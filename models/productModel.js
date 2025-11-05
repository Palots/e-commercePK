import { pool } from '../config/db.js';

export const Product = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM products');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ name, description, price, stock }) {
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
      [name, description, price, stock]
    );
    return { id: result.insertId, name, description, price, stock };
  },

  async update(id, { name, description, price, stock }) {
    const [result] = await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?',
      [name, description, price, stock, id]
    );
    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};
