const cacheKey = '__blip__redirects_messages';

const ResponseHttp = require('../entities/responseHttp');
const Redirecionamento = require('../entities/redirecionamento');

const redirecionamentoRepository = require('../repositories/redirecionamentoRepository');
const departamentoRepository = require('../repositories/departamentoRepository');
const atendenteRepository = require('../repositories/atendenteRepository');
const equipeRepository = require('../repositories/equipeRepository');

const httpCodeEnum = require('../enums/httpCodeEnum');
const responseTypeEnum = require('../enums/responseTypeEnum');

const commonService = require('./common/commonService');
const logService = require('./common/logService');

var responseHttp = new ResponseHttp();

exports.get = (mensagem) => get(mensagem);
exports.add = (redirecionamento) => add(redirecionamento);
exports.update = (redirecionamentoId, redirecionamento) => update(redirecionamentoId, redirecionamento);

module.exports = exports;

async function add(redirecionamento) {
    if (validaAdd(redirecionamento)) {
        const response = await redirecionamentoRepository.add(redirecionamento);

        if (response.type == responseTypeEnum.success) {
            responseHttp = new ResponseHttp(httpCodeEnum.OK, "Mensagem de redirecionamento cadastrado com sucesso.");
        } else {
            responseHttp = new ResponseHttp(httpCodeEnum.INTERNAL_SERVER_ERROR, "Erro ao cadastrar a mensagem de redirecionamento.");
        }
    }

    return responseHttp;
}

async function update(redirecionamentoId, redirecionamento) {
    redirecionamento.id = commonService.isNull(redirecionamentoId, 0);

    if (validaUpdate(redirecionamento)) {
        const response = await redirecionamentoRepository.update(redirecionamento);

        if (response.type == responseTypeEnum.success) {
            responseHttp = new ResponseHttp(httpCodeEnum.OK, "Mensagem de redirecionamento atualizada com sucesso.");
        } else {
            responseHttp = new ResponseHttp(httpCodeEnum.INTERNAL_SERVER_ERROR, "Erro ao cadastrar a mensagem de redirecionamento.");
        }
    }

    return responseHttp;
}

async function validaAdd(redirecionamento) {
    const redirecionamentoExiste = await redirecionamentoRepository.getByMensagem(redirecionamento.mensagem);

    if (redirecionamentoExiste) {
        responseHttp.httpCode = httpCodeEnum.BAD_REQUEST;
        responseHttp.message = "Mensagem de redirecionamento já existente.";

        return false;
    }

    return true;
}

async function validaUpdate(redirecionamento) {
    const redirecionamentoExiste = await redirecionamentoRepository.getByMensagem(redirecionamento.mensagem);

    if (redirecionamento.id == 0) {
        responseHttp.httpCode = httpCodeEnum.BAD_REQUEST;
        responseHttp.message = "Id da mensagem não informado.";

        return false;
    }

    if (redirecionamentoExiste && redirecionamento.id != redirecionamentoExiste.id) {
        responseHttp.httpCode = httpCodeEnum.BAD_REQUEST;
        responseHttp.message = "Mensagem de redirecionamento já existente.";

        return false;
    }

    return true;
}

async function get(mensagem) {
    const redirecionamento = await findRedirecionamentoPelaMensagem(decodeURI(mensagem));

    return redirecionamento;
}

async function findRedirecionamentoPelaMensagem(mensagem) {
    let mensagensRedirecionamento = await getMensagensRedirecionamento();
    let mensagemRedirecionamento = mensagensRedirecionamento.find(r => r.mensagem == mensagem);

    if (!mensagemRedirecionamento && commonService.hasLinksInContent(mensagem)) {
        mensagemRedirecionamento = mensagensRedirecionamento.find(r => mensagem.includes(r.mensagem));
    }

    return (!mensagemRedirecionamento ? new Redirecionamento() : mensagemRedirecionamento);
}

async function getMensagensRedirecionamento() {
    return mensagens = await redirecionamentoRepository.getAll();
}