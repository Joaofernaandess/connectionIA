const express = require('express');
const router = express.Router();

const syncController = require('../../controllers/external_access/syncController');

router.get('/', syncController.sync);
router.get('/status', syncController.status);

module.exports = router;
