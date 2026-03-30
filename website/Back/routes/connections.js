const { Router } = require('express');
const router = Router();

const connection = require('../controllers/connection');
const { asyncHandler } = require('../utils');
const auth = require('../middleware/auth');

router.post('/', asyncHandler(connection.recordConnection));
router.get('/recent', auth, asyncHandler(connection.getRecentConnections));
router.put('/:id/inactive', auth, asyncHandler(connection.markInactive));
router.post('/:id/heartbeat', asyncHandler(connection.handleHeartbeat));

module.exports = router;
