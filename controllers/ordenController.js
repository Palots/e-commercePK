import { Order } from '../models/ordenModel.js'
import { Cart } from '../models/cartModel.js'
import { Product } from '../models/productModel.js'
import { pool } from '../db.js'

export const orderController = {
  async create(req, res) {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()

      const cartItems = await Cart.getByUserId(req.userId)
      
      if (cartItems.length === 0) {
        await connection.rollback()
        return res.status(400).json({ error: 'El carrito está vacío' })
      }

      for (const item of cartItems) {
        const hasStock = await Product.checkStock(item.producto_id, item.cantidad)
        if (!hasStock) {
          await connection.rollback()
          return res.status(400).json({ 
            error: `Stock insuficiente para ${item.nombre}` 
          })
        }
      }

      const total = await Cart.getTotal(req.userId)
      const pedidoId = await Order.create(req.userId, total)

      for (const item of cartItems) {
        await Order.addDetail(
          pedidoId, 
          item.producto_id, 
          item.cantidad, 
          item.precio
        )
        await Product.reduceStock(item.producto_id, item.cantidad)
      }

      await Cart.clear(req.userId)
      await connection.commit()

      res.status(201).json({
        mensaje: 'Pedido creado exitosamente',
        pedido_id: pedidoId,
        total
      })

    } catch (error) {
      await connection.rollback()
      res.status(500).json({ error: error.message })
    } finally {
      connection.release()
    }
  },

  async getMyOrders(req, res) {
    try {
      const orders = await Order.getByUserId(req.userId)
      res.json(orders)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getDetails(req, res) {
    try {
      const order = await Order.getById(req.params.id)
      
      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' })
      }

      if (order.usuario_id !== req.userId) {
        return res.status(403).json({ error: 'No autorizado' })
      }

      const details = await Order.getDetails(req.params.id)

      res.json({
        ...order,
        items: details
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}