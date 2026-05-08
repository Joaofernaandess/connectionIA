const express = require('express');
const router = express.Router();

const redirecionamentoController = require('../controllers/redirecionamentoController');

router.post('/', redirecionamentoController.add);
router.put('/:id', redirecionamentoController.update);

module.exports = router;