const jwt = require("jsonwebtoken")
const speakeasy = require("speakeasy")
const QRCode = require("qrcode")
const crypto = require("crypto")

const SECRET_KEY = "tu_clave_secreta_super_segura_2025"

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash
}

function generateToken(userId) {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: "24h" })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY)
  } catch {
    return null
  }
}

function generateSecret() {
  return speakeasy.generateSecret({
    name: "E-commerce",
    issuer: "E-commerce App",
  })
}

async function generateQR(secret) {
  return await QRCode.toDataURL(secret.otpauth_url)
}

function verifyTOTP(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 2,
  })
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateSecret,
  generateQR,
  verifyTOTP,
}
