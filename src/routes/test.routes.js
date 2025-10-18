import express from 'express';
import { authUser } from "../middlewares/auth.middleware.js";
import { createChatValidation } from "../middlewares/validation.middleware.js";
import { createSimpleChat } from "../controllers/test.controller.js";
import { debugOpenRouter, testSimpleResponse } from "../controllers/debug.controller.js";
import { testOpenRouterDirect } from "../controllers/openrouter-test.controller.js";

const router = express.Router();

// Test chat without OpenRouter
router.post("/chat", authUser, createChatValidation, createSimpleChat);

// Debug endpoints
router.get("/debug", debugOpenRouter);
router.post("/mock-response", testSimpleResponse);
router.post("/openrouter-direct", testOpenRouterDirect);

export default router;