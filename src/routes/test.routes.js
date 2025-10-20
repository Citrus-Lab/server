import express from 'express';
import { authUser } from "../middlewares/auth.middleware.js";
import { createChatValidation } from "../middlewares/validation.middleware.js";
import { createSimpleChat } from "../controllers/test.controller.js";

const router = express.Router();

// Test chat without OpenRouter
router.post("/chat", authUser, createChatValidation, createSimpleChat);

export default router;