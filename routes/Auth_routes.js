import express from "express"
import { pool } from "../db.js"
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateSecret,
  generateQR,
  verifyTOTP,
  verificarToken,
} from "../middlewares/auth.js"

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints para registro, login y autenticación de doble factor
 */

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Usuario registrado exitosamente
 *                 userId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Datos inválidos o email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/registro", async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña requeridos" })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email inválido" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" })
    }

    const passwordHash = hashPassword(password)
    const [result] = await pool.execute(
      "INSERT INTO usuarios (email, password) VALUES (?, ?)",
      [email, passwordHash]
    )

    res.status(201).json({
      mensaje: "Usuario registrado exitosamente",
      userId: result.insertId,
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El email ya está registrado" })
    }
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login exitoso (puede requerir 2FA)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     mensaje:
 *                       type: string
 *                       example: Login exitoso
 *                 - type: object
 *                   properties:
 *                     mensaje:
 *                       type: string
 *                       example: Ingresa el código 2FA
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     require2FA:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña requeridos" })
    }

    const [usuarios] = await pool.execute(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    )

    if (usuarios.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    const usuario = usuarios[0]
    if (!verifyPassword(password, usuario.password)) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    if (usuario.dos_fa_activo) {
      return res.json({
        mensaje: "Ingresa el código 2FA",
        userId: usuario.id,
        require2FA: true,
      })
    }

    const token = generateToken(usuario.id)
    res.json({ 
      token, 
      userId: usuario.id,
      mensaje: "Login exitoso"
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/auth/setup-2fa:
 *   post:
 *     summary: Configurar autenticación de doble factor
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Código QR generado para configurar 2FA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                   example: JBSWY3DPEHPK3PXP
 *                 qrCode:
 *                   type: string
 *                   example: data:image/png;base64,iVBORw0KGgoAAAANS...
 *                 mensaje:
 *                   type: string
 *                   example: Escanea el código QR con Google Authenticator
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/setup-2fa", verificarToken, async (req, res) => {
  try {
    const secret = generateSecret()
    const qrCode = await generateQR(secret)

    res.json({
      secret: secret.base32,
      qrCode: qrCode,
      mensaje: "Escanea el código QR con Google Authenticator",
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/auth/activate-2fa:
 *   post:
 *     summary: Activar autenticación de doble factor
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - secret
 *               - code
 *             properties:
 *               secret:
 *                 type: string
 *                 example: JBSWY3DPEHPK3PXP
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA activado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Código 2FA inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/activate-2fa", verificarToken, async (req, res) => {
  try {
    const { secret, code } = req.body
    if (!secret || !code) {
      return res.status(400).json({ error: "Secret y código requeridos" })
    }

    if (!verifyTOTP(secret, code)) {
      return res.status(400).json({ error: "Código 2FA inválido" })
    }

    await pool.execute(
      "UPDATE usuarios SET secret_2fa = ?, dos_fa_activo = TRUE WHERE id = ?",
      [secret, req.userId]
    )

    res.json({ mensaje: "2FA activado correctamente" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/auth/deactivate-2fa:
 *   post:
 *     summary: Desactivar autenticación de doble factor
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA desactivado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Código 2FA inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/deactivate-2fa", verificarToken, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) {
      return res.status(400).json({ error: "Código requerido" })
    }

    const [usuarios] = await pool.execute(
      "SELECT secret_2fa FROM usuarios WHERE id = ?",
      [req.userId]
    )

    if (!verifyTOTP(usuarios[0].secret_2fa, code)) {
      return res.status(400).json({ error: "Código 2FA inválido" })
    }

    await pool.execute(
      "UPDATE usuarios SET secret_2fa = NULL, dos_fa_activo = FALSE WHERE id = ?",
      [req.userId]
    )

    res.json({ mensaje: "2FA desactivado correctamente" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     summary: Verificar código 2FA durante el login
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - code
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login exitoso con 2FA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 userId:
 *                   type: integer
 *                   example: 1
 *                 mensaje:
 *                   type: string
 *                   example: Login exitoso con 2FA
 *       401:
 *         description: Código 2FA inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/verify-2fa", async (req, res) => {
  try {
    const { userId, code } = req.body
    if (!userId || !code) {
      return res.status(400).json({ error: "userId y código requeridos" })
    }

    const [usuarios] = await pool.execute(
      "SELECT secret_2fa FROM usuarios WHERE id = ? AND dos_fa_activo = TRUE",
      [userId]
    )

    if (usuarios.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado o 2FA no activado" })
    }

    if (!verifyTOTP(usuarios[0].secret_2fa, code)) {
      return res.status(401).json({ error: "Código 2FA inválido" })
    }

    const token = generateToken(userId)
    res.json({ 
      token, 
      userId,
      mensaje: "Login exitoso con 2FA" 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar validez del token JWT
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/verify", verificarToken, async (req, res) => {
  try {
    const [usuarios] = await pool.execute(
      "SELECT id, email, dos_fa_activo FROM usuarios WHERE id = ?",
      [req.userId]
    )

    if (usuarios.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.json({ 
      valid: true,
      user: usuarios[0]
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router