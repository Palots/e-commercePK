import express from "express"
import { orderController } from "../controllers/ordenController.js"
import { verificarToken } from "../middlewares/auth.js"

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(verificarToken)

router.post("/", orderController.create)
router.get("/", orderController.getMyOrders)
router.get("/:id", orderController.getDetails)

export default router