const express = require('express');
const router = express.Router();

const atendimentoController = require('../controllers/atendimentoController');
const s3Controller = require('../controllers/s3Controller');

router.get('/', atendimentoController.getAll);
router.get('/:id', atendimentoController.getById);
router.get('/:id/finalizar', atendimentoController.postFinalizar);
router.post('/:id/atender', atendimentoController.postAtender);
router.post('/:id/transferir', atendimentoController.postTransferir);
router.post('/:id/mensagem/texto', atendimentoController.postMensagemTexto);
router.post('/:id/mensagem/arquivo', [
    s3Controller.upload,
    atendimentoController.postMensagemArquivo
]);
router.post('/:id/mensagem/audio', [
    s3Controller.uploadAudioLocal,
    s3Controller.sendAudioS3,
    atendimentoController.postMensagemAudio
]);

module.exports = router;