const express = require("express")
const { pool } = require("./db")
const auth = require("./middlewares/auth")

const router = express.Router()


// Middleware para verificar token
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ error: "Token requerido" })

  const decoded = auth.verifyToken(token)
  if (!decoded) return res.status(401).json({ error: "Token inválido" })

  req.userId = decoded.userId
  next()
}

// ===== AUTENTICACIÓN =====

// Registro
router.post("/auth/registro", async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos" })

    const connection = await pool.getConnection()
    const passwordHash = auth.hashPassword(password)

    await connection.execute("INSERT INTO usuarios (email, password) VALUES (?, ?)", [email, passwordHash])

    connection.release()
    res.json({ mensaje: "Usuario registrado exitosamente" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos" })

    const connection = await pool.getConnection()
    const [usuarios] = await connection.execute("SELECT * FROM usuarios WHERE email = ?", [email])
    connection.release()

    if (usuarios.length === 0) return res.status(401).json({ error: "Credenciales inválidas" })

    const usuario = usuarios[0]
    if (!auth.verifyPassword(password, usuario.password)) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    if (usuario.dos_fa_activo) {
      return res.json({
        mensaje: "Ingresa el código 2FA",
        userId: usuario.id,
        require2FA: true,
      })
    }

    const token = auth.generateToken(usuario.id)
    res.json({ token, userId: usuario.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Configurar 2FA
router.post("/auth/setup-2fa", verificarToken, async (req, res) => {
  try {
    const secret = auth.generateSecret()
    const qrCode = await auth.generateQR(secret)

    res.json({
      secret: secret.base32,
      qrCode: qrCode,
      mensaje: "Escanea el código QR con Google Authenticator",
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Activar 2FA
router.post("/auth/activate-2fa", verificarToken, async (req, res) => {
  try {
    const { secret, code } = req.body
    if (!secret || !code) return res.status(400).json({ error: "Secret y code requeridos" })

    if (!auth.verifyTOTP(secret, code)) {
      return res.status(400).json({ error: "Código 2FA inválido" })
    }

    const connection = await pool.getConnection()
    await connection.execute("UPDATE usuarios SET secret_2fa = ?, dos_fa_activo = TRUE WHERE id = ?", [
      secret,
      req.userId,
    ])
    connection.release()

    res.json({ mensaje: "2FA activado correctamente" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Verificar 2FA en login
router.post("/auth/verify-2fa", async (req, res) => {
  try {
    const { userId, code } = req.body
    if (!userId || !code) return res.status(400).json({ error: "userId y code requeridos" })

    const connection = await pool.getConnection()
    const [usuarios] = await connection.execute("SELECT secret_2fa FROM usuarios WHERE id = ?", [userId])
    connection.release()

    if (usuarios.length === 0) return res.status(401).json({ error: "Usuario no encontrado" })

    if (!auth.verifyTOTP(usuarios[0].secret_2fa, code)) {
      return res.status(401).json({ error: "Código 2FA inválido" })
    }

    const token = auth.generateToken(userId)
    res.json({ token, mensaje: "Login exitoso" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ===== PRODUCTOS =====

// Listar productos
router.get("/productos", async (req, res) => {
  try {
    const connection = await pool.getConnection()
    const [productos] = await connection.execute("SELECT * FROM productos")
    connection.release()
    res.json(productos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear producto (admin)
router.post("/productos", verificarToken, async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock } = req.body
    if (!nombre || !precio || stock === undefined) {
      return res.status(400).json({ error: "Datos incompletos" })
    }

    const connection = await pool.getConnection()
    await connection.execute("INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)", [
      nombre,
      descripcion,
      precio,
      stock,
    ])
    connection.release()

    res.json({ mensaje: "Producto creado" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ===== CARRITO =====

// Agregar al carrito
router.post("/carrito", verificarToken, async (req, res) => {
  try {
    const { producto_id, cantidad } = req.body
    if (!producto_id || !cantidad) return res.status(400).json({ error: "Datos incompletos" })

    const connection = await pool.getConnection()

    const [existe] = await connection.execute("SELECT * FROM carrito WHERE usuario_id = ? AND producto_id = ?", [
      req.userId,
      producto_id,
    ])

    if (existe.length > 0) {
      await connection.execute("UPDATE carrito SET cantidad = cantidad + ? WHERE usuario_id = ? AND producto_id = ?", [
        cantidad,
        req.userId,
        producto_id,
      ])
    } else {
      await connection.execute("INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)", [
        req.userId,
        producto_id,
        cantidad,
      ])
    }

    connection.release()
    res.json({ mensaje: "Producto agregado al carrito" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Ver carrito
router.get("/carrito", verificarToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    const [carrito] = await connection.execute(
      `
      SELECT c.*, p.nombre, p.precio 
      FROM carrito c 
      JOIN productos p ON c.producto_id = p.id 
      WHERE c.usuario_id = ?
    `,
      [req.userId],
    )
    connection.release()

    res.json(carrito)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ===== PEDIDOS =====

// Crear pedido
router.post("/pedidos", verificarToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()

    // Obtener carrito
    const [carrito] = await connection.execute("SELECT * FROM carrito WHERE usuario_id = ?", [req.userId])

    if (carrito.length === 0) return res.status(400).json({ error: "Carrito vacío" })

    // Calcular total
    let total = 0
    for (const item of carrito) {
      const [producto] = await connection.execute("SELECT precio FROM productos WHERE id = ?", [item.producto_id])
      total += producto[0].precio * item.cantidad
    }

    // Crear pedido
    const [result] = await connection.execute("INSERT INTO pedidos (usuario_id, total) VALUES (?, ?)", [
      req.userId,
      total,
    ])

    const pedidoId = result.insertId

    // Agregar detalles
    for (const item of carrito) {
      const [producto] = await connection.execute("SELECT precio FROM productos WHERE id = ?", [item.producto_id])

      await connection.execute(
        "INSERT INTO detalles_pedidos (pedido_id, producto_id, cantidad, precio) VALUES (?, ?, ?, ?)",
        [pedidoId, item.producto_id, item.cantidad, producto[0].precio],
      )
    }

    // Limpiar carrito
    await connection.execute("DELETE FROM carrito WHERE usuario_id = ?", [req.userId])

    connection.release()
    res.json({ mensaje: "Pedido creado", pedidoId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Ver pedidos
router.get("/pedidos", verificarToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    const [pedidos] = await connection.execute("SELECT * FROM pedidos WHERE usuario_id = ?", [req.userId])
    connection.release()

    res.json(pedidos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
