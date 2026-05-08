const express = require('express');
const router = express.Router();

const healthController = require('../../controllers/external_access/healthController');

router.get('/', healthController.health);

module.exports = router;