import express from "express"
import authRoutes from "./Auth_routes.js"
import userRoutes from "./userRoutes.js"
import productRoutes from "./productRoutes.js"
import cartRoutes from "./cartRoutes.js"
import orderRoutes from "./ordenRoutes.js"

const router = express.Router()

// Montar todas las rutas
router.use("/auth", authRoutes)
router.use("/usuarios", userRoutes)
router.use("/productos", productRoutes)
router.use("/carrito", cartRoutes)
router.use("/pedidos", orderRoutes)

// Ruta de prueba
router.get("/", (req, res) => {
    res.json({
        mensaje: "API E-Commerce funcionando ✅",
        version: "1.0.0",
        endpoints: {
        auth: "/api/auth",
        usuarios: "/api/usuarios",
        productos: "/api/productos",
        carrito: "/api/carrito",
        pedidos: "/api/pedidos"
        }
    })
    })

export default router