const { getDB } = require("../db");

// Crear producto
async function createProduct(req, res) {
  try {
    const { name, description, price, stock } = req.body;
    const db = getDB();
    const [result] = await db.execute(
      "INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)",
      [name, description, price, stock]
    );

    res.status(201).json({ id: result.insertId, name, description, price, stock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear producto" });
  }
}

// Listar todos los productos
async function getProducts(req, res) {
  try {
    const db = getDB();
    const [rows] = await db.execute("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
}

// Obtener producto por ID
async function getProductById(req, res) {
  try {
    const db = getDB();
    const [rows] = await db.execute("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el producto" });
  }
}

// Actualizar producto
async function updateProduct(req, res) {
  try {
    const { name, description, price, stock } = req.body;
    const db = getDB();
    await db.execute(
      "UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?",
      [name, description, price, stock, req.params.id]
    );
    res.json({ message: "Producto actualizado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar producto" });
  }
}

// Eliminar producto
async function deleteProduct(req, res) {
  try {
    const db = getDB();
    await db.execute("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
