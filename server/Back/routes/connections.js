const express = require('express');
const router = express.Router();
const connection = require('../controllers/connection');

router.post('/', connection.recordConnection);

router.get('/recent', connection.getRecentConnections);

router.put('/:id/inactive', connection.markInactive);

module.exports = router;
