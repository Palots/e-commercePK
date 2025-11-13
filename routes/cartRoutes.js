import express from "express"
import { productController } from "../controllers/productController.js"
import { verificarToken } from "../middlewares/auth.js"

const router = express.Router()

// Rutas públicas
router.get("/", productController.getAll)
router.get("/disponibles", productController.getAvailable)
router.get("/:id", productController.getById)

// Rutas protegidas
router.use(verificarToken)
router.post("/", productController.create)
router.put("/:id", productController.update)
router.delete("/:id", productController.remove)

export default router