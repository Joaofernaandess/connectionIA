const express = require('express');
const router = express.Router();

const redirectController = require('../../controllers/external_access/redirectController');

router.get('/', redirectController.valid);

module.exports = router;