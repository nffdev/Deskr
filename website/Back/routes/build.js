const { Router } = require('express');
const router = Router();

const build = require('../controllers/build');
const { asyncHandler } = require('../utils');
const auth = require('../middleware/auth');

router.post('/', auth, asyncHandler(build.startBuild));
router.post('/upload/icon', auth, asyncHandler(build.uploadIcon));
router.get('/download', auth, build.downloadBuild);

module.exports = router;
