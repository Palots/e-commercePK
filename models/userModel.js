import { pool } from '../db.js'

export const User = {
  // Obtener todos los usuarios
  async getAll() {
    const [rows] = await pool.query(
      'SELECT id, email, dos_fa_activo, created_at FROM usuarios'
    )
    return rows
  },

  // Obtener por ID
  async getById(id) {
    const [rows] = await pool.query(
      'SELECT id, email, dos_fa_activo, created_at FROM usuarios WHERE id = ?',
      [id]
    )
    return rows[0]
  },

  // Obtener por email (con password para login)
  async getByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    )
    return rows[0]
  },

  // Crear usuario
  async create({ email, password }) {
    const [result] = await pool.query(
      'INSERT INTO usuarios (email, password) VALUES (?, ?)',
      [email, password]
    )
    return { id: result.insertId, email }
  },

  // Actualizar usuario
  async update(id, data) {
    const fields = []
    const values = []
    
    if (data.email) {
      fields.push('email = ?')
      values.push(data.email)
    }
    if (data.password) {
      fields.push('password = ?')
      values.push(data.password)
    }
    if (data.secret_2fa !== undefined) {
      fields.push('secret_2fa = ?')
      values.push(data.secret_2fa)
    }
    if (data.dos_fa_activo !== undefined) {
      fields.push('dos_fa_activo = ?')
      values.push(data.dos_fa_activo)
    }

    values.push(id)

    const [result] = await pool.query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    return result.affectedRows > 0
  },

  // Eliminar usuario
  async remove(id) {
    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id])
    return result.affectedRows > 0
  },

  // Activar 2FA
  async activate2FA(userId, secret) {
    const [result] = await pool.query(
      'UPDATE usuarios SET secret_2fa = ?, dos_fa_activo = TRUE WHERE id = ?',
      [secret, userId]
    )
    return result.affectedRows > 0
  },

  // Desactivar 2FA
  async deactivate2FA(userId) {
    const [result] = await pool.query(
      'UPDATE usuarios SET secret_2fa = NULL, dos_fa_activo = FALSE WHERE id = ?',
      [userId]
    )
    return result.affectedRows > 0
  }
}