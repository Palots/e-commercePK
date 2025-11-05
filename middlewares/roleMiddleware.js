// Middleware para verificar si el usuario es admin
const verificarRol = (rolRequerido) => {
  return async (req, res, next) => {
    try {
      const connection = await require("../db").pool.getConnection();
      const [usuarios] = await connection.execute(
        "SELECT rol FROM usuarios WHERE id = ?",
        [req.userId]
      );
      connection.release();

      if (usuarios.length === 0)
        return res.status(404).json({ error: "Usuario no encontrado" });

      const rolUsuario = usuarios[0].rol;
      if (rolUsuario !== rolRequerido)
        return res.status(403).json({ error: "Acceso denegado" });

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

module.exports = { verificarRol };
