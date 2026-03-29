const express = require('express');
const router = express.Router();
const build = require('../controllers/build');

router.post('/', build.startBuild);
router.get('/download', build.downloadBuild);

module.exports = router;
