const DepartamentoAtendente = require('../entities/departamentoAtendente');

const responseTypeEnum = require('../enums/responseTypeEnum');

const databaseService = require('../services/common/databaseService');

exports.add = (departamentoAtendente) => add(departamentoAtendente);
exports.getByAtendenteId = (atendenteId) => getByAtendenteId(atendenteId);
exports.deleteByAtendenteId = (atendenteId) => deleteByAtendenteId(atendenteId);

module.exports = exports;

async function add(departamentoAtendente) {
    const queryResult = await databaseService.execute(`
        INSERT INTO departamento_atendente(
            departamento_id,
            atendente_id,
            principal
        ) VALUES (
            ${departamentoAtendente.departamento.id},
            ${departamentoAtendente.atendente.id},
            ${departamentoAtendente.principal}
        )
        ON DUPLICATE KEY UPDATE
            principal = VALUES(principal);
    `);

    return queryResult;
}

async function getByAtendenteId(atendenteId) {
    let departamentoAtendentes = new Array();

    const queryResult = await databaseService.execute(`
        SELECT departamento_id,
               atendente_id,
               principal 

          FROM departamento_atendente   

         WHERE atendente_id = ${atendenteId} 
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const departamentoAtendenteDb = queryResult.content[i];
            let departamentoAtendente = new DepartamentoAtendente();

            departamentoAtendente.departamento.id = departamentoAtendenteDb.departamento_id;
            departamentoAtendente.atendente.id = departamentoAtendenteDb.atendente_id;
            departamentoAtendente.principal = departamentoAtendenteDb.principal;

            departamentoAtendentes.push(departamentoAtendente);
        }
    }

    return departamentoAtendentes;
}

async function deleteByAtendenteId(atendenteId) {
    const queryResult = await databaseService.execute(`
        DELETE FROM departamento_atendente
              WHERE atendente_id = ${atendenteId};
    `);

    return queryResult;
}
