const Redirecionamento = require('../entities/redirecionamento');

const responseTypeEnum = require('../enums/responseTypeEnum');

const databaseService = require('../services/common/databaseService');
const commonService = require('../services/common/commonService');

exports.add = (redirecionamento) => add(redirecionamento);
exports.update = (redirecionamento) => update(redirecionamento);
exports.getByMensagem = (mensagem) => getByMensagem(mensagem);
exports.getAll = () => getAll();

module.exports = exports;

async function add(redirecionamento) {
    const queryResult = await databaseService.execute(`
            INSERT INTO redirecionamento(
                mensagem,
                atendente_id,
                equipe_id,
                departamento_id         
            ) VALUES (
                "${redirecionamento.mensagem}",
                ${commonService.sqlValueZeroForNull(redirecionamento.atendente.id)},
                ${commonService.sqlValueZeroForNull(redirecionamento.equipe.id)},
                ${commonService.sqlValueZeroForNull(redirecionamento.departamento.id)}
            );
    `);

    return queryResult;
}

async function update(redirecionamento) {
    const queryResult = await databaseService.execute(`
            UPDATE redirecionamento

               SET mensagem            = "${redirecionamento.mensagem}",
                   atendente_id        = ${commonService.sqlValueZeroForNull(redirecionamento.atendente.id)},
                   equipe_id           = ${commonService.sqlValueZeroForNull(redirecionamento.equipe.id)},
                   departamento_id     = ${commonService.sqlValueZeroForNull(redirecionamento.departamento.id)} 

             WHERE redirecionamento_id = ${redirecionamento.id};
    `);

    return queryResult;
}

async function getByMensagem(mensagem) {
    let redirecionamento = new Redirecionamento();

    const queryResult = await databaseService.execute(`
            SELECT redirecionamento_id,
                   mensagem,
                   atendente_id,
                   equipe_id,
                   departamento_id

              FROM redirecionamento

             WHERE mensagem = "${mensagem}"
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        const redirecionamentoDb = queryResult.content[0];

        if (redirecionamentoDb) {
            redirecionamento.id = redirecionamentoDb.redirecionamento_id;
            redirecionamento.mensagem = redirecionamentoDb.mensagem;
            redirecionamento.atendente.id = commonService.sqlValueNullForZero(redirecionamentoDb.atendente_id);
            redirecionamento.equipe.id = commonService.sqlValueNullForZero(redirecionamentoDb.equipe_id);
            redirecionamento.departamento.id = commonService.sqlValueNullForZero(redirecionamentoDb.departamento_id);
        }
    }

    return redirecionamento;
}

async function getAll() {
    let redirecionamentos = new Array();

    const queryResult = await databaseService.execute(`
            SELECT *            
              FROM redirecionamento
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const redirecionamentoDb = queryResult.content[i];
            let redirecionamento = new Redirecionamento();

            redirecionamento.id = redirecionamentoDb.redirecionamento_id;
            redirecionamento.mensagem = redirecionamentoDb.mensagem;
            redirecionamento.atendente.id = commonService.sqlValueNullForZero(redirecionamentoDb.atendente_id);
            redirecionamento.equipe.id = commonService.sqlValueNullForZero(redirecionamentoDb.equipe_id);
            redirecionamento.departamento.id = commonService.sqlValueNullForZero(redirecionamentoDb.departamento_id);

            redirecionamentos.push(redirecionamento);
        }
    }

    return redirecionamentos;
}