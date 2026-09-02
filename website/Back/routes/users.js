const { Router } = require('express');
const router = Router();

const { getMe, changePassword, updateAccount, updateNotifications, getStorage, clearStorage, deleteAccount, registerDeviceToken, removeDeviceToken } = require('../controllers/users');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../utils');

router.get('/@me', authMiddleware, asyncHandler(getMe));
router.put('/password', authMiddleware, asyncHandler(changePassword));
router.put('/account', authMiddleware, asyncHandler(updateAccount));
router.put('/notifications', authMiddleware, asyncHandler(updateNotifications));
router.post('/device-token', authMiddleware, asyncHandler(registerDeviceToken));
router.delete('/device-token', authMiddleware, asyncHandler(removeDeviceToken));
router.get('/storage', authMiddleware, asyncHandler(getStorage));
router.delete('/storage', authMiddleware, asyncHandler(clearStorage));
router.delete('/@me', authMiddleware, asyncHandler(deleteAccount));

module.exports = router;
