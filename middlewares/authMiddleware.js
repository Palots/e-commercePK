const jwt = require("jsonwebtoken");

const SECRET_KEY = "tu_clave_secreta_super_segura_2025"; // misma del archivo auth.js

// Middleware de autenticación
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  // El token debe venir así:  Authorization: Bearer <token>
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Guardamos los datos del usuario en la request
    next(); // continúa con la ruta
  } catch (error) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
}

module.exports = authMiddleware;
