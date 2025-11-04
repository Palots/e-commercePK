const express = require("express")
const { initDB } = require("./db")
const routes = require("./routes")

const app = express()
const PORT = 3000

app.use(express.json())
app.use("/api", routes)

async function start() {
  try {
    await initDB()
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

start()
