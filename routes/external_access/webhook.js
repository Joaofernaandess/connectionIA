const express = require('express');
const router = express.Router();

const webHookController = require('../../controllers/external_access/webHookController');

router.get('/', webHookController.index);
router.post('/', webHookController.main);

module.exports = router;