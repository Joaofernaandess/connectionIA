const express = require('express');
const router = express.Router();

const loginMiddleware = require('../middlewares/loginMiddleware');
const loginController = require('../controllers/loginController');

router.get('', [
    loginMiddleware.validaParametros,
    loginController.autentica
]);

router.get('/valida', [
    loginMiddleware.validaHeaders,
    loginController.valida
])

module.exports = router;