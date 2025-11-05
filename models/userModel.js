import { pool } from '../config/db.js';

export const User = {
  async getAll() {
    const [rows] = await pool.query('SELECT id, username, email, role, is_verified FROM users');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT id, username, email, role, is_verified FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ username, email, password, role }) {
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)',
      [username, email, password, role || 'client', true]
    );
    return { id: result.insertId, username, email, role };
  },

  async update(id, data) {
    const [result] = await pool.query('UPDATE users SET ? WHERE id = ?', [data, id]);
    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }
};
