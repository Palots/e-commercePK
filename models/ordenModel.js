    import { pool } from '../db.js'

    export const Order = {
    // Crear pedido
    async create(userId, total) {
    const [result] = await pool.query(
        'INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, ?)',
        [userId, total, 'pendiente']
    )
    return result.insertId
    },

    // Agregar detalle de pedido
    async addDetail(pedidoId, productoId, cantidad, precio) {
    const [result] = await pool.query(
        'INSERT INTO detalles_pedidos (pedido_id, producto_id, cantidad, precio) VALUES (?, ?, ?, ?)',
        [pedidoId, productoId, cantidad, precio]
    )
    return result.insertId
    },

    // Obtener pedidos de un usuario
    async getByUserId(userId) {
    const [rows] = await pool.query(`
        SELECT 
        p.id,
        p.total,
        p.estado,
        p.created_at,
        COUNT(dp.id) as total_items
        FROM pedidos p
        LEFT JOIN detalles_pedidos dp ON p.id = dp.pedido_id
        WHERE p.usuario_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
    `, [userId])
    return rows
    },

    // Obtener detalles de un pedido
    async getDetails(pedidoId) {
    const [rows] = await pool.query(`
        SELECT 
        dp.id,
        dp.producto_id,
        dp.cantidad,
        dp.precio,
        prod.nombre,
        prod.descripcion,
        (dp.cantidad * dp.precio) as subtotal
        FROM detalles_pedidos dp
        INNER JOIN productos prod ON dp.producto_id = prod.id
        WHERE dp.pedido_id = ?
    `, [pedidoId])
    return rows
    },

    // Actualizar estado del pedido
    async updateStatus(pedidoId, estado) {
    const [result] = await pool.query(
        'UPDATE pedidos SET estado = ? WHERE id = ?',
        [estado, pedidoId]
    )
    return result.affectedRows > 0
    },

    // Obtener pedido por ID
    async getById(pedidoId) {
    const [rows] = await pool.query(
        'SELECT * FROM pedidos WHERE id = ?',
        [pedidoId]
    )
    return rows[0]
    }
    }