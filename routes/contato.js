const express = require('express');
const router = express.Router();

const contatoController = require('../controllers/contatoController');

router.put('/', contatoController.update);

module.exports = router;