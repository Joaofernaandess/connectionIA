const responseTypeEnum = require('../enums/responseTypeEnum');

const AtendimentoAtividade = require('../entities/atendimentoAtividade');

const commonService = require('../services/common/commonService');
const databaseService = require('../services/common/databaseService');

exports.add = (atendimentoAtividade) => add(atendimentoAtividade);
exports.getByAtendimentoId = (atendimentoId) => getByAtendimentoId(atendimentoId);

async function add(atendimentoAtividade) {
    const queryResult = await databaseService.execute(`
        INSERT INTO atendimento_atividade(
            atendimento_id,
            atendente_id,
            data_hora,
            atividade,
            transferencia_atendente_id,
            transferencia_equipe_id,
            transferencia_departamento_id
        ) VALUES (
            ${atendimentoAtividade.atendimento.id},
            ${atendimentoAtividade.atendente.id},
            NOW(),
            ${atendimentoAtividade.atividade.id},
            ${commonService.sqlValueZeroForNull(atendimentoAtividade.transferenciaAtendente.id)},
            ${commonService.sqlValueZeroForNull(atendimentoAtividade.transferenciaEquipe.id)},
            ${commonService.sqlValueZeroForNull(atendimentoAtividade.transferenciaDepartamento.id)}
        );
    `);

    return queryResult;
}

async function getByAtendimentoId(atendimentoId) {
    let atendimentoAtividades = new Array();

    const queryResult = await databaseService.execute(`
           SELECT *
           
             FROM atendimento_atividade

            WHERE atendimento_id = ${atendimentoId}

         ORDER BY atendimento_atividade_id ASC 
    `);

    if (queryResult.type == responseTypeEnum.success) {

        for (let i = 0; i < queryResult.content.length; i++) {
            const atendimentoAtividadeDb = queryResult.content[i];

            let atendimentoAtividade = new AtendimentoAtividade();

            atendimentoAtividade.id = atendimentoAtividadeDb.atendimento_atividade_id;
            atendimentoAtividade.atendimento.id = atendimentoAtividadeDb.atendimento_id;
            atendimentoAtividade.atendente.id = commonService.sqlValueNullForZero(atendimentoAtividadeDb.atendente_id);
            atendimentoAtividade.dataHora = new Date(atendimentoAtividadeDb.data_hora)
            atendimentoAtividade.atividade = atendimentoAtividadeDb.atividade
            atendimentoAtividade.transferenciaAtendente.id = commonService.sqlValueNullForZero(atendimentoAtividadeDb.transferencia_atendente_id);
            atendimentoAtividade.transferenciaEquipe.id = commonService.sqlValueNullForZero(atendimentoAtividadeDb.transferencia_equipe_id);
            atendimentoAtividade.transferenciaDepartamento.id = commonService.sqlValueNullForZero(atendimentoAtividadeDb.transferencia_departamento_id);

            atendimentoAtividades.push(atendimentoAtividade);
        }
    }

    return atendimentoAtividades;
}