import { db } from "../config/db.js";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateSecret,
  generateQR,
  verifyTOTP
} from "../utils/authUtils.js";

// Registrar usuario
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashed = hashPassword(password);

    const [result] = await db.query(
      "INSERT INTO users (username, email, password, is_verified) VALUES (?, ?, ?, ?)",
      [username, email, hashed, false]
    );

    const secret = generateSecret();
    const qr = await generateQR(secret);

    res.json({
      message: "Usuario registrado con éxito",
      userId: result.insertId,
      secret: secret.base32,
      qr
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (!rows.length) return res.status(404).json({ error: "Usuario no encontrado" });

    const user = rows[0];
    if (!verifyPassword(password, user.password))
      return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = generateToken(user.id);
    res.json({ message: "Login correcto", token });
  } catch (err) {
    res.status(500).json({ error: "Error en el login" });
  }
};

// Verificar doble factor
export const verify2FA = async (req, res) => {
  try {
    const { secret, code } = req.body;
    const verified = verifyTOTP(secret, code);

    if (!verified) return res.status(400).json({ error: "Código incorrecto" });
    res.json({ message: "2FA verificado con éxito" });
  } catch (err) {
    res.status(500).json({ error: "Error al verificar 2FA" });
  }
};
