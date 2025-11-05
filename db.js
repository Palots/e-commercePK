const mysql = require("mysql2/promise")

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "karentorregob03*",
  database: process.env.DB_NAME || "marketplace",
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

async function initDB() {
  let retries = 5
  while (retries > 0) {
    try {
      const connection = await pool.getConnection()

      // Tabla usuarios
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          secret_2fa VARCHAR(255),
          dos_fa_activo BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Tabla productos
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS productos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          descripcion TEXT,
          precio DECIMAL(10, 2) NOT NULL,
          stock INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Tabla carrito
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS carrito (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          producto_id INT NOT NULL,
          cantidad INT NOT NULL,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
          FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
      `)

      // Tabla pedidos
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS pedidos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          total DECIMAL(10, 2) NOT NULL,
          estado VARCHAR(50) DEFAULT 'pendiente',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
      `)

      // Tabla detalles pedidos
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS detalles_pedidos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          pedido_id INT NOT NULL,
          producto_id INT NOT NULL,
          cantidad INT NOT NULL,
          precio DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
          FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
      `)

      connection.release()
      console.log("✅ Base de datos inicializada")
      return
    } catch (error) {
      retries--
      if (retries === 0) {
        console.error("❌ Error conectando a BD:", error.message)
        throw error
      }
      console.log(`⏳ Reintentando conexión... (${retries} intentos restantes)`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}

module.exports = { pool, initDB }
