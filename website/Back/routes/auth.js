const { Router } = require('express');
const router = Router();

const { login, register, logout } = require('../controllers/auth');
const { asyncHandler } = require('../utils');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/auth');

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));
router.post('/register', authLimiter, validate(registerSchema), asyncHandler(register));
router.post('/logout', asyncHandler(logout));

module.exports = router;