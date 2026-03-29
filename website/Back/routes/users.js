const { Router } = require('express');
const router = Router();

const { getMe } = require('../controllers/users');

const authMiddleware = require('../middleware/auth');

router.get('/@me', authMiddleware, getMe);

module.exports = router;