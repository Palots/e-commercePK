import express from "express"
import dotenv from "dotenv"
import { initDB } from "./db.js"
import routes from "./routes/index.js"
import { swaggerUi, swaggerSpec, swaggerOptions } from "./swagger.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// ========== MIDDLEWARES ==========

// JSON parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS muy permisivo para desarrollo
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  next()
})

// Logging de peticiones (para debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// ========== SWAGGER ==========
app.use('/api-docs', swaggerUi.serve)
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerOptions))

// ========== RUTAS ==========
app.use("/api", routes)

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    mensaje: "🚀 Servidor E-Commerce API",
    status: "online",
    documentacion: "http://localhost:3000/api-docs",
    api: "http://localhost:3000/api"
  })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" })
})

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack)
  res.status(500).json({ error: "Error interno del servidor" })
})

// ========== INICIAR SERVIDOR ==========
async function start() {
  try {
    await initDB()
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════╗
║   🚀 SERVIDOR E-COMMERCE INICIADO     ║
╠════════════════════════════════════════╣
║   📍 URL: http://localhost:${PORT}       ║
║   📚 API: http://localhost:${PORT}/api   ║
║   📖 DOCS: http://localhost:${PORT}/api-docs ║
║   🗄️  Base de datos: Conectada ✅      ║
╚════════════════════════════════════════╝
      `)
    })
  } catch (error) {
    console.error("❌ Error al iniciar servidor:", error)
    process.exit(1)
  }
}

start()