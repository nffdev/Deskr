const { Router } = require('express');
const router = Router();

const { getMe, changePassword, updateAccount, updateNotifications, getStorage, clearStorage } = require('../controllers/users');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../utils');

router.get('/@me', authMiddleware, asyncHandler(getMe));
router.put('/password', authMiddleware, asyncHandler(changePassword));
router.put('/account', authMiddleware, asyncHandler(updateAccount));
router.put('/notifications', authMiddleware, asyncHandler(updateNotifications));
router.get('/storage', authMiddleware, asyncHandler(getStorage));
router.delete('/storage', authMiddleware, asyncHandler(clearStorage));

module.exports = router;
