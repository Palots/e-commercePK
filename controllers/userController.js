import { User } from '../models/userModel.js'
import { hashPassword } from '../middlewares/auth.js'

export const userController = {
  async getAll(req, res) {
    try {
      const users = await User.getAll()
      res.json(users)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async getById(req, res) {
    try {
      const user = await User.getById(req.params.id)
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }
      res.json(user)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async update(req, res) {
    try {
      const { email, password } = req.body
      const updateData = {}

      if (email) updateData.email = email
      if (password) updateData.password = hashPassword(password)

      const updated = await User.update(req.params.id, updateData)
      if (!updated) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      res.json({ mensaje: 'Usuario actualizado exitosamente' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  async remove(req, res) {
    try {
      const deleted = await User.remove(req.params.id)
      if (!deleted) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }
      res.json({ mensaje: 'Usuario eliminado exitosamente' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}