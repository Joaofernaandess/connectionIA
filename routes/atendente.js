const express = require('express');
const router = express.Router();

const atendenteController = require('../controllers/atendenteController');

router.get('/', atendenteController.getList);

module.exports = router;