import express from 'express';
import { registerUserValidation, loginUserValidation } from "../middlewares/validation.middleware.js";
import { registerUser, loginUser, logout } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUserValidation, registerUser);
router.post("/login", loginUserValidation, loginUser);
router.post("/logout", logout);

export default router;