import { Cart } from '../models/cartModel.js'
import { Product } from '../models/productModel.js'

export const cartController = {
  async get(req, res) {
    try {
      const items = await Cart.getByUserId(req.userId)
      const total = await Cart.getTotal(req.userId)

      res.json({
        items,
        total,
        count: items.length
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async addItem(req, res) {
    try {
      const { producto_id, cantidad } = req.body

      if (!producto_id || !cantidad || cantidad < 1) {
        return res.status(400).json({ 
          error: 'producto_id y cantidad válida son requeridos' 
        })
      }

      const product = await Product.getById(producto_id)
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }

      if (product.stock < cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente. Disponible: ${product.stock}` 
        })
      }

      await Cart.addItem(req.userId, producto_id, parseInt(cantidad))
      
      res.json({ mensaje: 'Producto agregado al carrito' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async updateQuantity(req, res) {
    try {
      const { producto_id, cantidad } = req.body

      if (!producto_id || !cantidad || cantidad < 1) {
        return res.status(400).json({ 
          error: 'producto_id y cantidad válida son requeridos' 
        })
      }

      const product = await Product.getById(producto_id)
      if (product.stock < cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente. Disponible: ${product.stock}` 
        })
      }

      const updated = await Cart.updateQuantity(req.userId, producto_id, parseInt(cantidad))
      
      if (!updated) {
        return res.status(404).json({ error: 'Item no encontrado en el carrito' })
      }

      res.json({ mensaje: 'Cantidad actualizada' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async removeItem(req, res) {
    try {
      const { producto_id } = req.params

      const removed = await Cart.removeItem(req.userId, producto_id)
      
      if (!removed) {
        return res.status(404).json({ error: 'Item no encontrado en el carrito' })
      }

      res.json({ mensaje: 'Producto eliminado del carrito' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async clear(req, res) {
    try {
      await Cart.clear(req.userId)
      res.json({ mensaje: 'Carrito vaciado' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}