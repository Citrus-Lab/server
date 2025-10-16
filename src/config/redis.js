import Redis from 'ioredis';

let redis = null;

try {
    redis = new Redis(process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
    });

    redis.on('connect', () => {
        console.log('✅ Connected to Redis');
    });

    redis.on('error', (err) => {
        console.warn('⚠️ Redis connection failed, running without Redis:', err.message);
        redis = null;
    });

} catch (error) {
    console.warn('⚠️ Redis initialization failed, running without Redis:', error.message);
    redis = null;
}

// Mock Redis methods when Redis is not available
const mockRedis = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1
};

export default redis || mockRedis;
