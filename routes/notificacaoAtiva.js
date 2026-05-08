const express = require('express');
const router = express.Router();

const notificacaoAtivaController = require('../controllers/notificacaoAtivaController');

router.post('/whatsapp', notificacaoAtivaController.enviaNotificacaoAtivaWhatsapp);
router.get('/modelo', notificacaoAtivaController.getModelos);
router.get('/contatos', notificacaoAtivaController.getContatos);
router.get('/atendente/permissoes', notificacaoAtivaController.getAtendentePermissoes);

module.exports = router;