const commonService = require('../common/commonService');
const notificationService = require('../common/notificationService');

const atendimentoService = require('../atendimentoService');
const atendimentoMensagemService = require('../atendimentoMensagemService');
const ResponseHttp = require("../../entities/responseHttp");
const httpCodeEnum = require("../../enums/httpCodeEnum");

exports.evaluation = (io, contactIdentity, score) => evaluation(io, contactIdentity, score);
exports.expired = (contactIdentity) => expired(contactIdentity);
exports.waiting = (contactIdentity) => waiting(contactIdentity);

module.exports = exports;

async function evaluation(io, contactIdentity, score) {
    if (!contactIdentity)
        return;

    const informouScore = (score != null);
    const atendimento = await atendimentoService.getUltimoAtendimento(contactIdentity);

    if (atendimento.id == 0)
        return;

    await commonService.sleep(1000);
    await atendimentoMensagemService.addMensagensPosteriores(atendimento);

    if (informouScore)
        await atendimentoService.setNota(atendimento.id, score);

    notificationService.sendAll(io, "EVALUATION", atendimento.id);
}

async function expired(contactIdentity) {
    if (!contactIdentity)
        return;

    const atendimento = await atendimentoService.getUltimoAtendimento(contactIdentity);
    return atendimento.desabilitaChatRegraWhatsApp;
}

async function waiting(contactIdentity) {
    if (!contactIdentity)
        return new ResponseHttp(httpCodeEnum.BAD_REQUEST, "contactIdentity não enviado", 0);
    return await atendimentoService.getAtendimentoEmEspera(contactIdentity);
}