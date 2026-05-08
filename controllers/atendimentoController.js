const url = require('url');

const httpCodeEnum = require('../enums/httpCodeEnum');

const atendimentoService = require('../services/atendimentoService');
const atendimentoMensagemService = require('../services/atendimentoMensagemService');

const atendimentoMap = require('../maps/atendimentoMap');

exports.getAll = (req, res) => getAll(req, res);
exports.getById = (req, res) => getById(req, res);

exports.postAtender = (req, res) => postAtender(req, res);
exports.postFinalizar = (req, res) => postFinalizar(req, res);
exports.postTransferir = (req, res) => postTransferir(req, res);

exports.postMensagemTexto = (req, res) => postMensagemTexto(req, res);
exports.postMensagemArquivo = (req, res) => postMensagemArquivo(req, res);
exports.postMensagemAudio = (req, res) => postMensagemAudio(req, res);

module.exports = exports;

async function getAll(req, res) {
    const params = url.parse(req.url, true).query;
    const atendenteLogado = JSON.parse(req.headers["atendente"]);

    let quantidadeAtendimentos = await atendimentoService.count(params);
    let atendimentos = await atendimentoService.getAll(params, atendenteLogado);
    atendimentos = await atendimentoMap.atendimentosToAtendimentosVM(atendimentos);

    res.status(httpCodeEnum.OK);
    res.json({
        atendimentos: atendimentos,
        quantidadeAtendimentos: quantidadeAtendimentos
    });
}

async function getById(req, res) {
    const atendimentoId = req.params.id;
    const atendenteLogado =
        req.headers["atendente"] ? JSON.parse(req.headers["atendente"]) : null;

    if (!atendenteLogado) {
        res.status(httpCodeEnum.UNAUTHORIZED);
        res.json({
            "mensagem": "Header obrigatório."
        });

        return;
    }

    let atendimento = await atendimentoService.getById(atendimentoId, atendenteLogado);
    atendimento = await atendimentoMap.atendimentoToAtendimentoVM(atendimento);

    res.status(httpCodeEnum.OK);
    res.json({
        atendimento
    });
}

async function postAtender(req, res) {
    const atendimentoId = req.params.id;
    const contatoId = req.body.contatoId;
    let atendenteLogado = {
        id: 0
    };

    if (req.headers && req.headers["atendente"])
        atendenteLogado = JSON.parse(req.headers["atendente"]);

    const responseHttp =
        await atendimentoService.atender(req.io, atendimentoId, contatoId, atendenteLogado.id);

    res.status(responseHttp.httpCode);
    res.json({
        mensagem: responseHttp.message
    });
}

async function postFinalizar(req, res) {
    const atendimentoId = req.params.id;
    let atendenteLogado = {
        id: 0
    };

    if (req.headers && req.headers["atendente"])
        atendenteLogado = JSON.parse(req.headers["atendente"]);

    const responseHttp =
        await atendimentoService.finalizar(req.io, atendimentoId, atendenteLogado.id)

    res.status(responseHttp.httpCode);
    res.json({
        mensagem: responseHttp.message
    });
}

async function postTransferir(req, res) {
    const atendimentoId = req.params.id;
    const equipeId = req.body.equipeId;
    const departamentoId = req.body.departamentoId;
    const atendenteId = req.body.atendenteId;
    let atendenteLogado = {
        id: 0
    };

    if (req.headers && req.headers["atendente"])
        atendenteLogado = JSON.parse(req.headers["atendente"]);

    const responseHttp = await atendimentoService.transferir(req.io, {
        atendimentoId,
        equipeId,
        departamentoId,
        atendenteId,
        atendenteLogadoId: atendenteLogado.id
    });

    res.status(responseHttp.httpCode);
    res.json({
        mensagem: responseHttp.message
    });
}

async function postMensagemTexto(req, res) {
    const atendimentoId = req.params.id;
    const atendenteLogado = JSON.parse(req.headers["atendente"]);
    const conteudo = req.body.conteudo;

    const responseHttp =
        await atendimentoMensagemService
            .sendMensagemTexto(req.io, atendimentoId, atendenteLogado.id, conteudo);

    res.status(responseHttp.httpCode);
    res.json({
        mensagem: responseHttp.message
    });
}

async function postMensagemArquivo(req, res) {
    const atendimentoId = req.params.id;
    const atendenteLogado = JSON.parse(req.headers["atendente"]);
    const arquivo = req.file;

    const responseHttp =
        await atendimentoMensagemService
            .sendMensagemArquivo(req.io, atendimentoId, atendenteLogado.id, arquivo);

    res.status(responseHttp.httpCode);
    res.json({
        mensagem: responseHttp.message
    });
}

async function postMensagemAudio(req, res) {
    const atendimentoId = req.params.id;
    const atendenteLogado = JSON.parse(req.headers["atendente"]);
    const audio = req.file;

    const responseHttp =
        await atendimentoMensagemService
            .sendMensagemAudio(req.io, atendimentoId, atendenteLogado.id, audio);

    res.status(responseHttp.httpCode);
    res.json({
        mensagem: responseHttp.message
    });
}