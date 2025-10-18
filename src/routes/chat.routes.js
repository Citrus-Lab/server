import express from 'express';
import { authUser } from "../middlewares/auth.middleware.js";
import { createChatValidation, addMessageValidation } from "../middlewares/validation.middleware.js";
import { createChat, getChatHistory, getChatById, addMessageToChat } from "../controllers/chat.controller.js";

const router = express.Router();

// Create new chat
router.post("/", authUser, createChatValidation, createChat);

// Get chat history
router.get("/", authUser, getChatHistory);

// Get specific chat
router.get("/:chatId", authUser, getChatById);

// Add message to existing chat
router.post("/:chatId/messages", authUser, addMessageValidation, addMessageToChat);

export default router;