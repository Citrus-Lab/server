import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import redis from "../config/redis.js";

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

export { authUser };