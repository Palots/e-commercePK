    import { pool } from '../db.js'

    export const Cart = {
    // Obtener carrito de un usuario
    async getByUserId(userId) {
    const [rows] = await pool.query(`
        SELECT 
        c.id,
        c.producto_id,
        c.cantidad,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock,
        (c.cantidad * p.precio) as subtotal
        FROM carrito c
        INNER JOIN productos p ON c.producto_id = p.id
        WHERE c.usuario_id = ?
    `, [userId])
    return rows
    },

    // Agregar producto al carrito
    async addItem(userId, productId, cantidad) {
    try {
        // Verificar si ya existe
        const [existing] = await pool.query(
        'SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?',
        [userId, productId]
        )

        if (existing.length > 0) {
        // Actualizar cantidad
        const [result] = await pool.query(
            'UPDATE carrito SET cantidad = cantidad + ? WHERE id = ?',
            [cantidad, existing[0].id]
        )
        return result.affectedRows > 0
        } else {
        // Insertar nuevo
        const [result] = await pool.query(
            'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
            [userId, productId, cantidad]
        )
        return result.insertId
        }
    } catch (error) {
        throw error
    }
    },

    // Actualizar cantidad
    async updateQuantity(userId, productId, cantidad) {
    const [result] = await pool.query(
        'UPDATE carrito SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?',
        [cantidad, userId, productId]
    )
    return result.affectedRows > 0
    },

    // Eliminar item del carrito
    async removeItem(userId, productId) {
    const [result] = await pool.query(
        'DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?',
        [userId, productId]
    )
    return result.affectedRows > 0
    },

    // Vaciar carrito
    async clear(userId) {
    const [result] = await pool.query(
        'DELETE FROM carrito WHERE usuario_id = ?',
        [userId]
    )
    return result.affectedRows > 0
    },

    // Calcular total del carrito
    async getTotal(userId) {
    const [rows] = await pool.query(`
        SELECT SUM(c.cantidad * p.precio) as total
        FROM carrito c
        INNER JOIN productos p ON c.producto_id = p.id
        WHERE c.usuario_id = ?
    `, [userId])
    return rows[0].total || 0
    }
    }