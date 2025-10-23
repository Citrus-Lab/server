import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import modelsRoutes from "./routes/models.routes.js";
import testRoutes from "./routes/test.routes.js";
import templateRoutes from "./routes/template.routes.js";
import promptGeneratorRoutes from "./routes/promptGenerator.routes.js";
import promptGeneratorChatRoutes from "./routes/promptGeneratorChat.routes.js";
import collaborationRoutes from "./routes/collaboration.routes.js";

const app = express();

// Middlewares
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://192.168.1.61:3000",
        "http://localhost:3000",
        "https://citrus-lab-frontend.onrender.com",
        "https://citrus-lab-frontend.onrender.com/"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/models", modelsRoutes);
app.use("/api/test", testRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/prompt-generator", promptGeneratorRoutes);
app.use("/api/prompt-generator-chat", promptGeneratorChatRoutes);
app.use("/api/collaboration", collaborationRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "OK", 
        message: "AI Platform API is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

// Debug endpoint for collaboration system
app.get("/api/debug/collaboration", async (req, res) => {
    try {
        // Import services dynamically
        const { default: emailService } = await import('./services/email.service.js');
        const { default: Collaboration } = await import('./models/collaboration.model.js');
        
        // Get collaboration count
        let collaborationCount = 0;
        let sampleCollaborations = [];
        try {
            collaborationCount = await Collaboration.countDocuments();
            sampleCollaborations = await Collaboration.find()
                .limit(3)
                .select('chatId projectName collaborators shareLink shareLinkEnabled')
                .lean();
        } catch (dbError) {
            console.warn('Database query failed:', dbError.message);
        }
        
        const debugInfo = {
            timestamp: new Date().toISOString(),
            environment: {
                NODE_ENV: process.env.NODE_ENV || 'development',
                FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
                APP_URL: process.env.APP_URL || 'NOT SET',
                MONGODB_URI: process.env.MONGODB_URI ? 'SET ✓' : 'NOT SET ✗',
                JWT_SECRET: process.env.JWT_SECRET ? 'SET ✓' : 'NOT SET ✗'
            },
            emailConfig: {
                SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET ✓' : 'NOT SET ✗',
                SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'NOT SET',
                EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'NOT SET',
                EMAIL_USER: process.env.EMAIL_USER ? 'SET ✓' : 'NOT SET ✗',
                EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET ✓' : 'NOT SET ✗',
                serviceInitialized: emailService?.initialized || false,
                hasTransporter: !!(emailService?.transporter)
            },
            database: {
                collaborationCount,
                sampleCollaborations: sampleCollaborations.map(c => ({
                    id: c._id,
                    chatId: c.chatId,
                    projectName: c.projectName,
                    collaboratorCount: c.collaborators?.length || 0,
                    hasShareLink: !!c.shareLink,
                    shareLinkEnabled: c.shareLinkEnabled
                }))
            },
            routes: {
                collaborationRoutes: [
                    'GET /api/collaboration/:chatId',
                    'POST /api/collaboration/:chatId/invite',
                    'POST /api/collaboration/:chatId/share-link',
                    'GET /api/collaboration/shared/:shareToken',
                    'GET /api/collaboration/invitation/:shareToken'
                ]
            }
        };
        
        res.json(debugInfo);
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Simple chat endpoint for frontend testing (no auth required)
app.post("/api/chat", async (req, res) => {
    try {
        const { message, model = 'openai/gpt-4', mode = 'manual' } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ 
                error: "Message is required" 
            });
        }

        console.log(`Received chat request: ${message} (model: ${model}, mode: ${mode})`);

        // Import OpenRouter service dynamically
        const { default: openRouterService } = await import('./services/openrouter.service.js');
        
        // Determine which model to use
        let selectedModel = model;
        if (mode === 'auto') {
            selectedModel = await openRouterService.selectBestModel(message);
            console.log(`Auto-selected model: ${selectedModel}`);
        }

        // Get AI response
        const aiResponse = await openRouterService.generateResponse(message, selectedModel);

        res.json({
            response: aiResponse.content,
            model: selectedModel,
            mode: mode,
            usage: aiResponse.usage,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ 
            error: error.message || "Failed to process chat request",
            timestamp: new Date().toISOString()
        });
    }
});

// Simple template endpoint for testing (no auth required)
app.get("/api/templates-test", async (req, res) => {
    try {
        // Import Template model dynamically
        const { default: Template } = await import('./models/template.model.js');
        
        // Get some sample templates
        const templates = await Template.find({ isPublic: true })
            .limit(5)
            .select('name description category tags')
            .sort({ createdAt: -1 });

        res.json({
            message: "Template system is working!",
            sampleTemplates: templates,
            totalPublicTemplates: await Template.countDocuments({ isPublic: true }),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Template Test Error:', error);
        res.status(500).json({ 
            error: error.message || "Template system not ready",
            timestamp: new Date().toISOString()
        });
    }
});

// Simple prompt generator test endpoint (no auth required)
app.post("/api/prompt-generator-test", async (req, res) => {
    try {
        const { input } = req.body;
        
        if (!input || !input.trim()) {
            return res.status(400).json({ 
                error: "Input is required" 
            });
        }

        console.log(`Testing prompt generator with input: ${input}`);

        // Import OpenRouter service dynamically
        const { default: openRouterService } = await import('./services/openrouter.service.js');
        
        // Simple prompt improvement
        const systemPrompt = `You are a prompt engineer. Improve this messy input into a clear, structured prompt. Respond with JSON:
{
  "improved": "improved prompt here",
  "category": "detected category", 
  "confidence": 85,
  "improvements": ["what was improved"]
}`;

        const aiResponse = await openRouterService.generateResponse(
            `Improve this: "${input}"`,
            'anthropic/claude-3-sonnet',
            [{ role: 'system', content: systemPrompt }]
        );

        // Try to parse JSON response
        let result;
        try {
            const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
            result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (e) {
            result = null;
        }

        res.json({
            message: "Prompt generator test successful!",
            input: input,
            result: result || {
                improved: `Please help me with: ${input}`,
                category: "general",
                confidence: 60,
                improvements: ["Added basic structure"]
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Prompt Generator Test Error:', error);
        res.status(500).json({ 
            error: error.message || "Prompt generator test failed",
            timestamp: new Date().toISOString()
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});

export default app;
