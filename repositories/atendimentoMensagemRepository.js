const AtendimentoMensagem = require('../entities/atendimentoMensagem');
const Atendimento = require("../entities/atendimento");
const Atendente = require("../entities/atendente");
const Equipe = require("../entities/equipe");
const Departamento = require("../entities/departamento");

const responseTypeEnum = require('../enums/responseTypeEnum');

const databaseService = require('../services/common/databaseService');
const commonService = require('../services/common/commonService');
const stringService = require('../services/common/stringService');
const logService = require('../services/common/logService');

const formatoMensagemProvider = require('../providers/formatoMensagemProvider');
const atendimentoMensagemStatusEnum = require("../enums/statusAtendimentoMensagemEnum");

exports.add = (atendimentoMensagem) => add(atendimentoMensagem);
exports.updateConteudo = (atendimentoMensagemId, formatoId, conteudo) => updateConteudo(atendimentoMensagemId, formatoId, conteudo);
exports.getByAtendimentoId = (atendimentoId) => getByAtendimentoId(atendimentoId);
exports.getByBlipId = (blipId) => getByBlipId(blipId);

module.exports = exports;

async function add(atendimentoMensagem) {
    console.log("atendimentoMensagemRepository.add")
    const query = `
        INSERT INTO atendimento_mensagem(
            atendimento_id,
            blip_mensagem_id,
            atendente_id,
            equipe_id,
            departamento_id,
            data_hora,
            enviada_recebida,
            formato,
            conteudo,
            modelo_id,
            status,
            resposta_blip_mensagem_id
        ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?);
    `;

    const params = [
        atendimentoMensagem.atendimento.id,
        atendimentoMensagem.blipId || null,
        atendimentoMensagem.atendente.id > 0 ? atendimentoMensagem.atendente.id : null,
        atendimentoMensagem.equipe.id > 0 ? atendimentoMensagem.equipe.id : null,
        atendimentoMensagem.departamento.id > 0 ? atendimentoMensagem.departamento.id : null,
        atendimentoMensagem.recebido ? "R" : "E",
        atendimentoMensagem.formato.id,
        stringService.encode(atendimentoMensagem.formato.id, atendimentoMensagem.conteudo),
        atendimentoMensagem.modeloId > 0 ? atendimentoMensagem.modeloId : null,
        getAtendimentoMensagemStatus(atendimentoMensagem.status),
        getRespostaPara(atendimentoMensagem)
    ];

    const queryResult = await databaseService.execute(query, params);

    return queryResult;
}

async function updateConteudo(atendimentoMensagemId, formatoId, conteudo) {
    const query = `
        UPDATE atendimento_mensagem
           SET conteudo = ?
         WHERE atendimento_mensagem_id = ?
    `;

    const params = [stringService.encode(formatoId, conteudo), atendimentoMensagemId];

    return databaseService.execute(query, params);
}

async function getByAtendimentoId(atendimentoId) {
    let atendimentoMensagens = new Array();

    const queryResult = await databaseService.execute(`
           SELECT am.atendimento_mensagem_id,
                  am.atendimento_id,
                  am.blip_mensagem_id,
                  am.atendente_id,
                  am.equipe_id,
                  am.departamento_id,
                  am.data_hora,
                  am.enviada_recebida,
                  am.formato,
                  am.conteudo,
                  am.modelo_id,
                  am.status,
                  am.resposta_blip_mensagem_id
           
             FROM atendimento_mensagem am

            WHERE am.atendimento_id = ${atendimentoId}

         ORDER BY am.data_hora, am.atendimento_mensagem_id ASC 
    `);

    if (queryResult.type === responseTypeEnum.success) {

        for (let i = 0; i < queryResult.content.length; i++) {
            const atendimentoMensagemDb = queryResult.content[i];

            let atendimento = new Atendimento();
            let atendente = new Atendente();
            let equipe = new Equipe();
            let departamento = new Departamento();

            atendimento.id = atendimentoMensagemDb.atendimento_id;
            atendente.id = commonService.sqlValueNullForZero(atendimentoMensagemDb.atendente_id);
            equipe.id = commonService.sqlValueNullForZero(atendimentoMensagemDb.equipe_id);
            departamento.id= commonService.sqlValueNullForZero(atendimentoMensagemDb.departamento_id);

            let atendimentoMensagem = new AtendimentoMensagem();
            atendimentoMensagem.id = atendimentoMensagemDb.atendimento_mensagem_id;
            atendimentoMensagem.atendimento = atendimento;
            atendimentoMensagem.blipId = atendimentoMensagemDb.blip_mensagem_id;
            atendimentoMensagem.atendente = atendente;
            atendimentoMensagem.equipe = equipe;
            atendimentoMensagem.departamento = departamento;
            atendimentoMensagem.recebido = (atendimentoMensagemDb.enviada_recebida == "R" ? true : false);
            atendimentoMensagem.dataHora = new Date(atendimentoMensagemDb.data_hora);
            atendimentoMensagem.formato = formatoMensagemProvider.getById(atendimentoMensagemDb.formato);
            atendimentoMensagem.conteudo = stringService.decode(atendimentoMensagemDb.formato, atendimentoMensagemDb.conteudo);
            atendimentoMensagem.modeloId = atendimentoMensagemDb.modelo_id ? atendimentoMensagemDb.modelo_id : 0;
            atendimentoMensagem.status = statusToAtendimentoMensagemStatus(atendimentoMensagemDb.status);
            atendimentoMensagem.respostaPara = {blipId: atendimentoMensagemDb.resposta_blip_mensagem_id, mensagem: ""};

            atendimentoMensagens.push(atendimentoMensagem);
        }
    }

    return atendimentoMensagens;
}

async function getByBlipId(blipId) {
    let atendimentoMensagem = new AtendimentoMensagem();

    const queryResult = await databaseService.execute(`
           SELECT am.atendimento_mensagem_id,
                  am.atendimento_id,
                  am.blip_mensagem_id,
                  am.atendente_id,
                  am.equipe_id,
                  am.departamento_id,
                  am.data_hora,
                  am.enviada_recebida,
                  am.formato,
                  am.conteudo,
                  am.modelo_id,
                  am.status,
                  am.resposta_blip_mensagem_id         
           
             FROM atendimento_mensagem am

            WHERE am.blip_mensagem_id = "${blipId}"

         ORDER BY am.data_hora, am.atendimento_mensagem_id ASC 
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        const atendimentoMensagemDb = queryResult.content[0];

        let atendimento = new Atendimento();
        let atendente = new Atendente();
        let equipe = new Equipe();
        let departamento = new Departamento();

        atendimento.id = atendimentoMensagemDb.atendimento_id;
        atendente.id = commonService.sqlValueNullForZero(atendimentoMensagemDb.atendente_id);
        equipe.id = commonService.sqlValueNullForZero(atendimentoMensagemDb.equipe_id);
        departamento.id = commonService.sqlValueNullForZero(atendimentoMensagemDb.departamento_id);

        atendimentoMensagem.id = atendimentoMensagemDb.atendimento_mensagem_id;
        atendimentoMensagem.atendimento = atendimento;
        atendimentoMensagem.blipId = atendimentoMensagemDb.blip_mensagem_id;
        atendimentoMensagem.atendente = atendente;
        atendimentoMensagem.equipe = equipe;
        atendimentoMensagem.departamento = departamento;
        atendimentoMensagem.recebido = (atendimentoMensagemDb.enviada_recebida == "R" ? true : false);
        atendimentoMensagem.dataHora = new Date(atendimentoMensagemDb.data_hora);
        atendimentoMensagem.formato = formatoMensagemProvider.getById(atendimentoMensagemDb.formato);
        atendimentoMensagem.conteudo = stringService.decode(atendimentoMensagemDb.formato, atendimentoMensagemDb.conteudo);
        atendimentoMensagem.modeloId = atendimentoMensagemDb.modelo_id ? atendimentoMensagemDb.modelo_id : 0;
        atendimentoMensagem.status = statusToAtendimentoMensagemStatus(atendimentoMensagemDb.status);
        atendimentoMensagem.respostaPara = {blipId: atendimentoMensagemDb.resposta_blip_mensagem_id, mensagem: ""}
    }

    return atendimentoMensagem;
}

/**
 *
 * @param status {{id: number} | number | undefined | null}
 * @returns {number}
 */
function getAtendimentoMensagemStatus(status) {
    if (typeof status === "undefined" || status === null) {
        return 0;
    } else if (typeof status === "number") {
        return (status === 0 || status === 1) ? status : 0;
    } else if (typeof status === "object") {
        return (status === atendimentoMensagemStatusEnum.erro || status === atendimentoMensagemStatusEnum.processado)
            ? status.id : 0;
    } else {
        return 0;
    }
}

/**
 *
 * @param status {0 | 1}
 */
function statusToAtendimentoMensagemStatus(status) {
    switch (status) {
        case 0:
            return atendimentoMensagemStatusEnum.erro;
        case 1:
            return atendimentoMensagemStatusEnum.processado;
        default:
            return atendimentoMensagemStatusEnum.erro;
    }
}

function getRespostaPara(atendimentoMensagem) {
    if (atendimentoMensagem.respostaPara) {
        if (atendimentoMensagem.respostaPara.blipId) {
            return atendimentoMensagem.respostaPara.blipId;
        }
    }

    return null;
}
