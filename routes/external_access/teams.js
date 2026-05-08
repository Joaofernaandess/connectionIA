const express = require('express');
const router = express.Router();

const teamController = require('../../controllers/external_access/teamController');

router.get('/online', teamController.getOnline);

module.exports = router;