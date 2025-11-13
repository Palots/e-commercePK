import express from "express"
import { productController } from "../controllers/productController.js"
import { verificarToken } from "../middlewares/auth.js"

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión de productos
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos
 */
router.get("/", productController.getAll)

/**
 * @swagger
 * /api/productos/disponibles:
 *   get:
 *     summary: Obtener productos con stock disponible
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos disponibles
 */
router.get("/disponibles", productController.getAvailable)

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 */
router.get("/:id", productController.getById)

// Rutas protegidas
router.use(verificarToken)

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - precio
 *               - stock
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Laptop HP
 *               descripcion:
 *                 type: string
 *                 example: Laptop HP Pavilion 15 pulgadas
 *               precio:
 *                 type: number
 *                 example: 1500.00
 *               stock:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */
router.post("/", productController.create)

/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Producto actualizado
 */
router.put("/:id", productController.update)

/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto eliminado
 */
router.delete("/:id", productController.remove)

export default router