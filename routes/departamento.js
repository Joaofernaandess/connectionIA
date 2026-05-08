const express = require('express');
const router = express.Router();

const departamentoController = require('../controllers/departamentoController');

router.get('/', departamentoController.getList);

module.exports = router;