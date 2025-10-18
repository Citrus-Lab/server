import express from 'express';
import { authUser } from "../middlewares/auth.middleware.js";
import { getAvailableModels, selectBestModel } from "../controllers/models.controller.js";
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateModelSelection = [
    body("message")
        .isString()
        .withMessage("Message must be a string")
        .notEmpty()
        .withMessage("Message is required"),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Get all available models
router.get("/", authUser, getAvailableModels);

// Get best model for a message
router.post("/select", authUser, validateModelSelection, selectBestModel);

export default router;