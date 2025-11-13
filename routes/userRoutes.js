import express from "express"
import { userController } from "../controllers/userController.js"
import { verificarToken } from "../middlewares/auth.js"

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(verificarToken)

// GET /api/usuarios - Obtener todos los usuarios
router.get("/", userController.getAll)

// GET /api/usuarios/:id - Obtener usuario por ID
router.get("/:id", userController.getById)

// PUT /api/usuarios/:id - Actualizar usuario
router.put("/:id", userController.update)

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete("/:id", userController.remove)

export default router