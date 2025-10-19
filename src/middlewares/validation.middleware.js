import { body, validationResult } from 'express-validator';

function validateResults(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

const registerUserValidation = [
    body("name")
        .isString()
        .withMessage("Name must be a string")
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters"),

    body("email")
        .isEmail()
        .withMessage("Invalid email format"),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    validateResults
];

const loginUserValidation = [
    body("email")
        .isEmail()
        .withMessage("Invalid email format"),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),

    validateResults
];

const createChatValidation = [
    body("message")
        .isString()
        .withMessage("Message must be a string")
        .notEmpty()
        .withMessage("Message is required")
        .isLength({ min: 1, max: 5000 })
        .withMessage("Message must be between 1 and 5000 characters"),

    body("model")
        .optional()
        .isString()
        .withMessage("Model must be a string"),

    body("mode")
        .optional()
        .isIn(['manual', 'auto'])
        .withMessage("Mode must be either 'manual' or 'auto'"),

    validateResults
];

const addMessageValidation = [
    body("message")
        .isString()
        .withMessage("Message must be a string")
        .notEmpty()
        .withMessage("Message is required")
        .isLength({ min: 1, max: 5000 })
        .withMessage("Message must be between 1 and 5000 characters"),

    body("model")
        .optional()
        .isString()
        .withMessage("Model must be a string"),

    validateResults
];

export {
    registerUserValidation,
    loginUserValidation,
    createChatValidation,
    addMessageValidation
};