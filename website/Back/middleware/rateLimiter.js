const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_GLOBAL) || 100,
    message: { message: 'Too many requests, please try again later.' },
    skip: (req) => {
        const path = req.path;
        return path.includes('/screen') || path.includes('/heartbeat') || path.includes('/monitors') || path.includes('/command');
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_AUTH) || 10,
    message: { message: 'Too many attempts, please try again later.' }
});

module.exports = {
    globalLimiter,
    authLimiter
};
