import { Product } from '../models/productModel.js'

export const productController = {
  async getAll(req, res) {
    try {
      const products = await Product.getAll()
      res.json(products)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getAvailable(req, res) {
    try {
      const products = await Product.getAvailable()
      res.json(products)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getById(req, res) {
    try {
      const product = await Product.getById(req.params.id)
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }
      res.json(product)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async create(req, res) {
    try {
      const { nombre, descripcion, precio, stock } = req.body

      if (!nombre || precio === undefined || stock === undefined) {
        return res.status(400).json({ 
          error: 'Nombre, precio y stock son requeridos' 
        })
      }

      const product = await Product.create({
        nombre,
        descripcion: descripcion || '',
        precio: parseFloat(precio),
        stock: parseInt(stock)
      })

      res.status(201).json(product)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async update(req, res) {
    try {
      const { nombre, descripcion, precio, stock } = req.body
      
      const updated = await Product.update(req.params.id, {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        stock: parseInt(stock)
      })

      if (!updated) {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }

      res.json({ mensaje: 'Producto actualizado exitosamente' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async remove(req, res) {
    try {
      const deleted = await Product.remove(req.params.id)
      if (!deleted) {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }
      res.json({ mensaje: 'Producto eliminado exitosamente' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}