import PromptGeneratorChat from '../models/promptGeneratorChat.model.js';
import { validationResult } from 'express-validator';

// Get or create active prompt generator session
export const getActiveSession = async (req, res) => {
    try {
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }

        // For guest users, return a basic session structure
        if (!req.user) {
            return res.json({
                message: 'Guest session created',
                session: {
                    id: null,
                    sessionId: sessionId,
                    title: 'Guest Session',
                    messages: [],
                    snippets: [],
                    generatedPrompts: [],
                    lastActivity: new Date(),
                    createdAt: new Date(),
                    isGuest: true
                }
            });
        }

        const userId = req.user.userId;
        const session = await PromptGeneratorChat.getOrCreateActiveSession(userId, sessionId);

        res.json({
            message: 'Session retrieved successfully',
            session: {
                id: session._id,
                sessionId: session.sessionId,
                title: session.title,
                messages: session.messages,
                snippets: session.snippets,
                generatedPrompts: session.generatedPrompts,
                lastActivity: session.lastActivity,
                createdAt: session.createdAt,
                isGuest: false
            }
        });

    } catch (error) {
        console.error('Get active session error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Save current session state
export const saveSessionState = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        // For guest users, just return success without saving
        if (!req.user) {
            return res.json({
                message: 'Guest session - data not persisted',
                session: {
                    id: null,
                    sessionId: req.body.sessionId,
                    title: req.body.title || 'Guest Session',
                    lastActivity: new Date(),
                    isGuest: true
                }
            });
        }

        const userId = req.user.userId;
        const { sessionId, messages, snippets, generatedPrompts, title } = req.body;

        let session = await PromptGeneratorChat.findOne({ userId, sessionId, isActive: true });

        if (!session) {
            session = new PromptGeneratorChat({
                userId,
                sessionId,
                title: title || 'Prompt Generator Session',
                messages: [],
                snippets: [],
                generatedPrompts: [],
                isActive: true
            });
        }

        // Update session data
        if (title) session.title = title;
        if (messages) session.messages = messages;
        if (snippets) session.snippets = snippets;
        if (generatedPrompts) session.generatedPrompts = generatedPrompts;

        await session.save();

        res.json({
            message: 'Session saved successfully',
            session: {
                id: session._id,
                sessionId: session.sessionId,
                title: session.title,
                lastActivity: session.lastActivity,
                isGuest: false
            }
        });

    } catch (error) {
        console.error('Save session state error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Reset session (archive current and create new)
export const resetSession = async (req, res) => {
    try {
        const { currentSessionId } = req.body;

        if (!currentSessionId) {
            return res.status(400).json({ message: 'Current session ID is required' });
        }

        // For guest users, just create a new session ID
        if (!req.user) {
            const newSessionId = `pg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            return res.json({
                message: 'Guest session reset',
                newSession: {
                    id: null,
                    sessionId: newSessionId,
                    title: 'Guest Session',
                    messages: [],
                    snippets: [],
                    generatedPrompts: [],
                    lastActivity: new Date(),
                    createdAt: new Date(),
                    isGuest: true
                },
                archivedSession: null
            });
        }

        const userId = req.user.userId;

        // Save current session before reset
        const currentSession = await PromptGeneratorChat.findOne({ 
            userId, 
            sessionId: currentSessionId, 
            isActive: true 
        });

        if (currentSession && (currentSession.messages.length > 0 || currentSession.generatedPrompts.length > 0)) {
            // Archive the current session
            currentSession.isActive = false;
            await currentSession.save();
        }

        // Create new session
        const newSession = await PromptGeneratorChat.resetSession(userId, currentSessionId);

        res.json({
            message: 'Session reset successfully',
            newSession: {
                id: newSession._id,
                sessionId: newSession.sessionId,
                title: newSession.title,
                messages: newSession.messages,
                snippets: newSession.snippets,
                generatedPrompts: newSession.generatedPrompts,
                lastActivity: newSession.lastActivity,
                createdAt: newSession.createdAt,
                isGuest: false
            },
            archivedSession: currentSession ? {
                id: currentSession._id,
                title: currentSession.title,
                messageCount: currentSession.messages.length,
                promptCount: currentSession.generatedPrompts.length,
                createdAt: currentSession.createdAt
            } : null
        });

    } catch (error) {
        console.error('Reset session error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get session history (archived sessions)
export const getSessionHistory = async (req, res) => {
    try {
        // For guest users, return empty history
        if (!req.user) {
            return res.json({
                sessions: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalSessions: 0,
                    hasNext: false,
                    hasPrev: false
                },
                message: 'Guest users have no saved history'
            });
        }

        const userId = req.user.userId;
        const { page = 1, limit = 10 } = req.query;

        const sessions = await PromptGeneratorChat.find({ 
            userId, 
            isActive: false,
            $or: [
                { 'messages.0': { $exists: true } },
                { 'generatedPrompts.0': { $exists: true } }
            ]
        })
        .sort({ lastActivity: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('sessionId title lastActivity createdAt messages generatedPrompts');

        const total = await PromptGeneratorChat.countDocuments({ 
            userId, 
            isActive: false,
            $or: [
                { 'messages.0': { $exists: true } },
                { 'generatedPrompts.0': { $exists: true } }
            ]
        });

        const formattedSessions = sessions.map(session => ({
            id: session._id,
            sessionId: session.sessionId,
            title: session.title,
            messageCount: session.messages.length,
            promptCount: session.generatedPrompts.length,
            lastActivity: session.lastActivity,
            createdAt: session.createdAt,
            preview: session.messages.length > 0 
                ? session.messages[0].text.substring(0, 100) + '...'
                : session.generatedPrompts.length > 0
                ? session.generatedPrompts[0].title
                : 'Empty session'
        }));

        res.json({
            sessions: formattedSessions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalSessions: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get session history error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get specific session by ID
export const getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // For guest users, return not found
        if (!req.user) {
            return res.status(404).json({ 
                message: 'Session not found - guest sessions are not persisted' 
            });
        }

        const userId = req.user.userId;
        const session = await PromptGeneratorChat.findOne({ 
            userId, 
            sessionId 
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({
            message: 'Session retrieved successfully',
            session: {
                id: session._id,
                sessionId: session.sessionId,
                title: session.title,
                messages: session.messages,
                snippets: session.snippets,
                generatedPrompts: session.generatedPrompts,
                isActive: session.isActive,
                lastActivity: session.lastActivity,
                createdAt: session.createdAt,
                isGuest: false
            }
        });

    } catch (error) {
        console.error('Get session by ID error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Delete session
export const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // For guest users, return not found
        if (!req.user) {
            return res.status(404).json({ 
                message: 'Session not found - guest sessions are not persisted' 
            });
        }

        const userId = req.user.userId;
        const session = await PromptGeneratorChat.findOneAndDelete({ 
            userId, 
            sessionId 
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({
            message: 'Session deleted successfully',
            deletedSession: {
                id: session._id,
                title: session.title,
                sessionId: session.sessionId
            }
        });

    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Mark prompt as used/injected
export const markPromptAction = async (req, res) => {
    try {
        const { sessionId, promptId } = req.params;
        const { action } = req.body; // 'used' or 'injected'

        // For guest users, just return success without persisting
        if (!req.user) {
            return res.json({
                message: `Prompt marked as ${action} (guest session - not persisted)`,
                session: {
                    id: null,
                    sessionId: sessionId,
                    isGuest: true
                }
            });
        }

        const userId = req.user.userId;
        const session = await PromptGeneratorChat.findOne({ userId, sessionId });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        let result;
        if (action === 'used') {
            result = await session.markPromptAsUsed(promptId);
        } else if (action === 'injected') {
            result = await session.markPromptAsInjected(promptId);
        } else {
            return res.status(400).json({ message: 'Invalid action. Use "used" or "injected"' });
        }

        res.json({
            message: `Prompt marked as ${action} successfully`,
            session: {
                id: result._id,
                sessionId: result.sessionId,
                isGuest: false
            }
        });

    } catch (error) {
        console.error('Mark prompt action error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};