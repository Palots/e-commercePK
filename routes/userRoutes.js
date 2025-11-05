import express from "express";
import { registerUser, loginUser, verify2FA } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-2fa", verify2FA);

export default router;
