const { Router } = require('express');
const router = Router();

const { getMe } = require('../controllers/users');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../utils');

router.get('/@me', authMiddleware, asyncHandler(getMe));

module.exports = router;