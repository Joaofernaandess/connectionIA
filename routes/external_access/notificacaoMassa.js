const express = require('express');
const router = express.Router();

const notificacaoAtivaController = require('../../controllers/notificacaoAtivaController');

// Rota consumida por sistemas externos (ex: SommusGestor) para envio de notificações em massa
router.post('/', notificacaoAtivaController.enviaNotificacaoEmMassaWhatsapp);

module.exports = router;
