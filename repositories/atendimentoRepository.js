const Atendimento = require('../entities/atendimento');
const Contato = require('../entities/contato');
const Atendente = require('../entities/atendente');
const Equipe = require('../entities/equipe');
const Departamento = require('../entities/departamento');

const responseTypeEnum = require('../enums/responseTypeEnum');

const databaseService = require('../services/common/databaseService');
const commonService = require('../services/common/commonService');

const statusProvider = require('../providers/statusProvider');
const statusEnum = require('../enums/statusEnum');
const blipStatusEnum = require('../enums/blip/statusEnum');
const logService = require("../services/common/logService");

exports.add = (atendimento) => add(atendimento);
exports.updateRetornoNotificacaoAtiva = (atendimentoId, blipId, status) => updateRetornoNotificacaoAtiva(atendimentoId, blipId, status);
exports.updateStatus = (atendimentoId, status) => updateStatus(atendimentoId, status);
exports.updateAtendendo = (atendimentoId, atendente, equipeId = 0, departamentoId = 0) => updateAtendendo(atendimentoId, atendente, equipeId, departamentoId);
exports.updateTransferir = (atendimentoId, atendenteId, equipeId, departamentoId) => updateTransferir(atendimentoId, atendenteId, equipeId, departamentoId);
exports.updateRedireciona = (atendimentoId, atendenteId, equipeId, departamentoId) => updateRedireciona(atendimentoId, atendenteId, equipeId, departamentoId);
exports.updateNota = (atendimentoId, nota) => updateNota(atendimentoId, nota);
exports.getById = (id) => getById(id);
exports.getByTicketId = (blipTicketId) => getByTicketId(blipTicketId);
exports.getByContatoId = (contatoId) => getByContatoId(contatoId);
exports.getAbertoByAtendenteId = (atendenteId) => getAbertoByAtendenteId(atendenteId);
exports.getAllAguardando = (contatoId) => getAllAguardando(contatoId);
exports.getAguardandoPorContatoId = (contatoId) => getAguardandoPorContatoId(contatoId);
exports.getNaoFinalizadosPorContatoId = (contatoId) => getNaoFinalizadosPorContatoId(contatoId);
exports.getFinalizadosSemNotaPorContatoId = (contatoId) => getFinalizadosSemNotaPorContatoId(contatoId);
exports.getAll = (params) => getAll(params);
exports.count = (params) => count(params);

module.exports = exports;

/**
 *  Adiciona um atendimento no banco de dados
 * @param atendimento {Atendimento}
 * @returns {Promise<*>}
 */
async function add(atendimento) {
    const queryResult = await databaseService.execute(`
            INSERT INTO atendimento(
                blip_atendimento_id,
                contato_id,
                atendente_id,
                equipe_id,
                departamento_id,
                data_hora,
                status
            ) VALUES (
                ${atendimento.blipAtendimentoId ? `"${atendimento.blipAtendimentoId}"` : 'NULL'},
                ${atendimento.contato.id},
                ${commonService.sqlValueZeroForNull(atendimento.atendente.id)},
                ${commonService.sqlValueZeroForNull(atendimento.equipe.id)},
                ${commonService.sqlValueZeroForNull(atendimento.departamento.id)},
                NOW(),
                ${atendimento.status.intern.id}
            );
    `);

    return queryResult;
}

async function updateStatus(atendimentoId, status) {
    const queryResult = await databaseService.execute(`
            UPDATE atendimento

               SET status = ${status.id}
               
             WHERE atendimento_id = ${atendimentoId}  
    `);

    return queryResult;
}

/**
 * Atualiza o retorno da notificação ativa
 * @param atendimentoId {number}
 * @param blipId {string}
 * @param status {number}
 * @returns {Promise<*>}
 */
async function updateRetornoNotificacaoAtiva(atendimentoId, blipId, status) {
    const query = `
            UPDATE atendimento

               SET blip_atendimento_id = "${blipId}",
                   status  = ${status}
               
             WHERE atendimento_id = ${atendimentoId}  
    `

    const queryResult = await databaseService.execute(query);

    return queryResult;
}

async function updateAtendendo(atendimentoId, atendente, equipeId = 0, departamentoId = 0) {
    const updateQueries = [
        `status = ${statusEnum.atendendo.id}`,
        `atendente_id = ${commonService.sqlValueZeroForNull(atendente.id)}`
    ];

    if (equipeId && equipeId > 0) {
        updateQueries.push(`equipe_id = ${commonService.sqlValueZeroForNull(equipeId)}`);
    }

    if (departamentoId && departamentoId > 0) {
        updateQueries.push(`departamento_id = ${commonService.sqlValueZeroForNull(departamentoId)}`);
    }

    const queryResult = await databaseService.execute(`
            UPDATE atendimento
               SET ${updateQueries.join(', ')}
             WHERE atendimento_id = ${atendimentoId}  
    `);

    return queryResult;
}

async function updateTransferir(atendimentoId, atendenteId, equipeId, departamentoId) {
    const queryResult = await databaseService.execute(`
            UPDATE atendimento

               SET atendente_id    = ${commonService.sqlValueZeroForNull(atendenteId)},
                   equipe_id       = ${commonService.sqlValueZeroForNull(equipeId)},
                   departamento_id = ${commonService.sqlValueZeroForNull(departamentoId)},
                   status          = ${statusEnum.pendente.id} 

             WHERE atendimento_id = ${atendimentoId}  
    `);

    return queryResult;
}

async function updateRedireciona(atendimentoId, atendenteId, equipeId, departamentoId) {
    const queryResult = await databaseService.execute(`
            UPDATE atendimento

            SET atendente_id    = ${commonService.sqlValueZeroForNull(atendenteId)},
                equipe_id       = ${commonService.sqlValueZeroForNull(equipeId)},
                departamento_id = ${commonService.sqlValueZeroForNull(departamentoId)},
                status          = ${statusEnum.pendente.id} 

             WHERE atendimento_id = ${atendimentoId}  
    `);

    return queryResult;
}

async function updateNota(atendimentoId, nota) {
    const queryResult = await databaseService.execute(`
            UPDATE atendimento

               SET nota  = ${nota}

             WHERE atendimento_id = ${atendimentoId}  
    `);

    return queryResult;
}

async function getById(id) {
    let atendimento = new Atendimento();

    const queryResult = await databaseService.execute(`
           SELECT a.atendimento_id,
                  a.blip_atendimento_id,
                  a.contato_id,
                  a.atendente_id,
                  a.equipe_id,
                  a.departamento_id,
                  a.data_hora,
                  a.status
           
             FROM atendimento a

            WHERE a.atendimento_id = ${id}
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        const atendimentoDb = queryResult.content[0];
        atendimento = convertAtendimentoDbToAtendimento(atendimentoDb);
    }

    return atendimento;
}

async function getByTicketId(blipTicketId) {
    let atendimento = new Atendimento();

    const queryResult = await databaseService.execute(`
           SELECT a.atendimento_id,
                  a.blip_atendimento_id,
                  a.contato_id,
                  a.atendente_id,
                  a.equipe_id,
                  a.departamento_id,
                  a.data_hora,
                  a.status
           
             FROM atendimento a

            WHERE a.blip_atendimento_id = "${blipTicketId}"
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        const atendimentoDb = queryResult.content[0];
        atendimento = convertAtendimentoDbToAtendimento(atendimentoDb);
    }

    return atendimento;
}

async function getAbertoByAtendenteId(atendenteId) {
    let atendimentos = new Array();

    let query = `
           SELECT a.atendimento_id,
                  a.blip_atendimento_id,
                  a.contato_id,
                  a.atendente_id,
                  a.equipe_id,
                  a.departamento_id,
                  a.data_hora,
                  a.status
           
             FROM atendimento a

            WHERE a.atendente_id = ${atendenteId}
                 AND a.status <> ${statusEnum.finalizado.id}

         ORDER BY a.atendimento_id ASC
    `;

    const queryResult = await databaseService.execute(query);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const atendimentoDb = queryResult.content[i];
            const atendimento = convertAtendimentoDbToAtendimento(atendimentoDb);

            atendimentos.push(atendimento);
        }

    }

    return atendimentos;
}

async function getByContatoId(contatoId) {
    let atendimentos = new Array();

    let query = `
           SELECT a.atendimento_id,
                  a.blip_atendimento_id,
                  a.contato_id,
                  a.atendente_id,
                  a.equipe_id,
                  a.departamento_id,
                  a.data_hora,
                  a.status
           
             FROM atendimento a

            WHERE a.contato_id = ${contatoId}

         ORDER BY a.atendimento_id ASC
    `;

    const queryResult = await databaseService.execute(query);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const atendimentoDb = queryResult.content[i];
            const atendimento = convertAtendimentoDbToAtendimento(atendimentoDb);

            atendimentos.push(atendimento);
        }

    }

    return atendimentos;
}

async function getAllAguardando() {
    let atendimentos = new Array();

    let query = `
           SELECT a.atendimento_id,
                  a.blip_atendimento_id,
                  a.contato_id,
                  a.atendente_id,
                  a.equipe_id,
                  a.departamento_id,
                  a.data_hora,
                  a.status
           
             FROM atendimento a

            WHERE a.status = ${statusEnum.aguardando.id}

         ORDER BY a.atendimento_id ASC
    `;

    const queryResult = await databaseService.execute(query);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const atendimentoDb = queryResult.content[i];
            const atendimento = convertAtendimentoDbToAtendimento(atendimentoDb);

            atendimentos.push(atendimento);
        }

    }

    return atendimentos;
}

async function getAguardandoPorContatoId(contatoId) {
    let atendimentos = [];

    if (contatoId === 0) return atendimentos;

    let query = `
           SELECT a.atendimento_id,
                  a.blip_atendimento_id,
                  a.contato_id,
                  a.atendente_id,
                  a.equipe_id,
                  a.departamento_id,
                  a.data_hora,
                  a.status

             FROM atendimento a

            WHERE a.contato_id = ${contatoId}
                 AND a.status = ${statusEnum.aguardando.id}

         ORDER BY a.atendimento_id ASC
    `;

    const queryResult = await databaseService.execute(query);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const atendimentoDb = queryResult.content[i];
            const atendimento = convertAtendimentoDbToAtendimento(atendimentoDb);

            atendimentos.push(atendimento);
        }
    }

    return atendimentos;
}

async function getNaoFinalizadosPorContatoId(contatoId) {
    let atendimentos = [];

    if (contatoId === 0) return atendimentos;

    let query = `
           SELECT a.atendimento_id,
                  a.blip_atendimento_id,
                  a.contato_id,
                  a.atendente_id,
                  a.equipe_id,
                  a.departamento_id,
                  a.data_hora,
                  a.status

             FROM atendimento a

            WHERE a.contato_id = ${contatoId}
                 AND a.status <> ${statusEnum.finalizado.id}

         ORDER BY a.atendimento_id ASC
    `;

    const queryResult = await databaseService.execute(query);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const atendimentoDb = queryResult.content[i];
            const atendimento = convertAtendimentoDbToAtendimento(atendimentoDb);

            atendimentos.push(atendimento);
        }
    }

    return atendimentos;
}

async function getFinalizadosSemNotaPorContatoId(contatoId) {
    let atendimentos = [];

    if (contatoId === 0) return atendimentos;

    let query = `
           SELECT a.atendimento_id,
                  a.blip_atendimento_id,
                  a.contato_id,
                  a.atendente_id,
                  a.equipe_id,
                  a.departamento_id,
                  a.data_hora,
                  a.status

             FROM atendimento a

            WHERE a.contato_id = ${contatoId}
                 AND a.status = ${statusEnum.finalizado.id}
                 AND a.nota IS NULL
                 AND TIMESTAMPDIFF(MINUTE,(SELECT MAX(aa.data_hora) FROM atendimento_atividade aa WHERE aa.atividade = 3 AND aa.atendimento_id = a.atendimento_id),CURRENT_TIMESTAMP()) < 12

         ORDER BY a.atendimento_id ASC
    `;

    const queryResult = await databaseService.execute(query);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const atendimentoDb = queryResult.content[i];
            const atendimento = convertAtendimentoDbToAtendimento(atendimentoDb);

            atendimentos.push(atendimento);
        }
    }

    return atendimentos;
}

async function getAll(params) {
    let atendimentos = new Array();

    let query = `SELECT a.atendimento_id,
                        a.blip_atendimento_id,
                        a.contato_id,
                        a.atendente_id,
                        a.equipe_id,
                        a.departamento_id,
                        a.data_hora,                        
                        a.status
                        
                   FROM atendimento a

              LEFT JOIN contato c
                     ON a.contato_id = c.contato_id
                     
                     ${getWhereGetAll(params)}

                 LIMIT ${params.skip}, ${params.take}                        
    `;

    const queryResult = await databaseService.execute(query);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const atendimentoDb = queryResult.content[i];
            const atendimento = convertAtendimentoDbToAtendimento(atendimentoDb);

            atendimentos.push(atendimento);
        }
    }

    return atendimentos;
}

async function count(params) {
    let quantidade = 0;

    let query = `SELECT COUNT(*) AS quantidade
                        
                   FROM atendimento a

              LEFT JOIN contato c
                     ON a.contato_id = c.contato_id 
                     
                     ${getWhereGetAll(params)}
    `;

    const queryResult = await databaseService.execute(query);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        quantidade = queryResult.content[0]["quantidade"];
    }

    return quantidade;
}

function convertAtendimentoDbToAtendimento(atendimentoDb) {
    let contato = new Contato();
    let atendente = new Atendente();
    let equipe = new Equipe();
    let departamento = new Departamento();

    contato.id = atendimentoDb.contato_id;
    atendente.id = commonService.sqlValueNullForZero(atendimentoDb.atendente_id);
    equipe.id = commonService.sqlValueNullForZero(atendimentoDb.equipe_id);
    departamento.id = commonService.sqlValueNullForZero(atendimentoDb.departamento_id);

    let atendimento = new Atendimento();
    atendimento.id = atendimentoDb.atendimento_id;
    atendimento.blipAtendimentoId = atendimentoDb.blip_atendimento_id;
    atendimento.contato = contato;
    atendimento.atendente = atendente;
    atendimento.equipe = equipe;
    atendimento.departamento = departamento;
    atendimento.dataHora = new Date(atendimentoDb.data_hora);
    atendimento.status = statusProvider.getById(atendimentoDb.status);

    return atendimento;
}

function getWhereGetAll(params) {
    let where = "";

    if (params.id && params.id > 0) {
        where += `${getWhereAnd(where)} a.atendimento_id = ${params.id}`;
    } else {
        if (params.equipe && params.equipe > 0)
            where += `${getWhereAnd(where)} a.equipe_id = ${params.equipe}`

        if (params.departamento && params.departamento > 0)
            where += `${getWhereAnd(where)} a.departamento_id = ${params.departamento}`

        if (params.atendente && params.atendente > 0) {
            where += `${getWhereAnd(where)} 
            (a.atendente_id = ${params.atendente} OR 
                (a.atendente_id IS NULL AND a.equipe_id IN (
                    SELECT equipe_id FROM equipe_atendente ea WHERE ea.atendente_id = ${params.atendente}
                ))
            )
        `;
        }

        if (params.canal && params.canal.id > 0)
            where += `${getWhereAnd(where)} c.canal = ${params.canal.id}`;

        if (params.contato && params.contato.length > 0)
            where += `${getWhereAnd(where)} c.nome LIKE "${params.contato}%"`;

        if (params.atendimentoInicial)
            where += `${getWhereAnd(where)} a.data_hora >= "${params.atendimentoInicial} 00:00:00"`

        if (params.atendimentoFinal)
            where += `${getWhereAnd(where)} a.data_hora <= "${params.atendimentoFinal} 23:59:59"`

        if (params.aguardando || params.pendente || params.atendendo || params.finalizado) {
            let whereStatus = ""

            if (params.aguardando) {
                whereStatus += (whereStatus.length > 0 ? " OR " : "");
                whereStatus += `a.status = ${statusEnum.aguardando.id}`;
            }

            if (params.pendente) {
                whereStatus += (whereStatus.length > 0 ? " OR " : "");
                whereStatus += `a.status = ${statusEnum.pendente.id}`;
            }

            if (params.atendendo) {
                whereStatus += (whereStatus.length > 0 ? " OR " : "");
                whereStatus += `a.status = ${statusEnum.atendendo.id}`;
            }

            if (params.finalizado) {
                whereStatus += (whereStatus.length > 0 ? " OR " : "");
                whereStatus += `a.status = ${statusEnum.finalizado.id}`;
            }

            where += `${getWhereAnd(where)} (${whereStatus})`;
        } else {
            where += `${getWhereAnd(where)} FALSE`;
        }
    }

    where = (where.length > 0 ? ` WHERE ${where}` : ``);

    return where;
}

function getWhereAnd(where) {
    return where.length > 0 ? " AND " : "";
}