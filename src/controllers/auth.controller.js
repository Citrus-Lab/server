import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import redis from "../config/redis.js";
import bcrypt from 'bcrypt';

async function registerUser(req, res) {
    try {
        const { email, password, name } = req.body;

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function logout(req, res) {
    try {
        const token = req.cookies.token;

        if (token && redis) {
            try {
                // Add token to blacklist
                await redis.set(`blacklist:${token}`, 'true', 'EX', 7 * 24 * 60 * 60); // 7 days
            } catch (redisError) {
                console.warn('Redis blacklist failed:', redisError.message);
            }
        }

        res.clearCookie('token');
        res.json({ message: 'Logout successful' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function authUser(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check blacklist only if Redis is available
    if (redis) {
        try {
            const isTokenBlackListed = await redis.get(`blacklist:${token}`);
            if (isTokenBlackListed) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
        } catch (redisError) {
            console.warn('Redis blacklist check failed:', redisError.message);
        }
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

export {
    registerUser,
    loginUser,
    logout,
    authUser
};