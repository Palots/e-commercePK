import crypto from "crypto"
import jwt from "jsonwebtoken"
import speakeasy from "speakeasy"
import QRCode from "qrcode"
import dotenv from "dotenv"

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || "mi-super-secreto-jwt-12345"

// Hash de contraseña (simple con SHA256, considera usar bcrypt en producción)
export function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

// Verificar contraseña
export function verifyPassword(password, hash) {
  return hashPassword(password) === hash
}

// Generar token JWT
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" })
}

// Verificar token JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Generar secret 2FA
export function generateSecret() {
  return speakeasy.generateSecret({ 
    name: "E-Commerce App",
    length: 20
  })
}

// Generar código QR
export async function generateQR(secret) {
  try {
    return await QRCode.toDataURL(secret.otpauth_url)
  } catch (error) {
    throw new Error("Error generando código QR: " + error.message)
  }
}

// Verificar código TOTP
export function verifyTOTP(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 2,
  })
}

// Middleware para verificar token
export function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]
  
  if (!token) {
    return res.status(401).json({ error: "Token requerido" })
  }

  const decoded = verifyToken(token)
  
  if (!decoded) {
    return res.status(401).json({ error: "Token inválido o expirado" })
  }

  req.userId = decoded.userId
  next()
}