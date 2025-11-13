import { pool } from '../db.js'

export const Product = {
  // Obtener todos los productos
  async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM productos ORDER BY created_at DESC'
    )
    return rows
  },

  // Obtener productos con stock disponible
  async getAvailable() {
    const [rows] = await pool.query(
      'SELECT * FROM productos WHERE stock > 0 ORDER BY nombre'
    )
    return rows
  },

  // Obtener por ID
  async getById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM productos WHERE id = ?',
      [id]
    )
    return rows[0]
  },

  // Crear producto
  async create({ nombre, descripcion, precio, stock }) {
    const [result] = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, precio, stock]
    )
    return { id: result.insertId, nombre, descripcion, precio, stock }
  },

  // Actualizar producto
  async update(id, { nombre, descripcion, precio, stock }) {
    const [result] = await pool.query(
      'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?',
      [nombre, descripcion, precio, stock, id]
    )
    return result.affectedRows > 0
  },

  // Actualizar solo stock
  async updateStock(id, cantidad) {
    const [result] = await pool.query(
      'UPDATE productos SET stock = stock + ? WHERE id = ?',
      [cantidad, id]
    )
    return result.affectedRows > 0
  },

  // Reducir stock (para ventas)
  async reduceStock(id, cantidad) {
    const [result] = await pool.query(
      'UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [cantidad, id, cantidad]
    )
    return result.affectedRows > 0
  },

  // Eliminar producto
  async remove(id) {
    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id])
    return result.affectedRows > 0
  },

  // Verificar stock disponible
  async checkStock(id, cantidad) {
    const [rows] = await pool.query(
      'SELECT stock FROM productos WHERE id = ?',
      [id]
    )
    if (rows.length === 0) return false
    return rows[0].stock >= cantidad
  }
}