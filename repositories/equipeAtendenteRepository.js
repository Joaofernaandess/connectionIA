const EquipeAtendente = require('../entities/equipeAtendente');

const responseTypeEnum = require('../enums/responseTypeEnum');

const databaseService = require('../services/common/databaseService');

exports.add = (equipeAtendente) => add(equipeAtendente);
exports.getByAtendenteId = (atendenteId) => getByAtendenteId(atendenteId);
exports.deleteByAtendenteId = (atendenteId) => deleteByAtendenteId(atendenteId);

module.exports = exports;

async function add(equipeAtendente) {
    const queryResult = await databaseService.execute(`
        INSERT INTO equipe_atendente(
            equipe_id,
            atendente_id,
            principal
        ) VALUES (
            ${equipeAtendente.equipe.id},
            ${equipeAtendente.atendente.id},
            ${equipeAtendente.principal}
        )
        ON DUPLICATE KEY UPDATE
            principal = VALUES(principal);
    `);

    return queryResult;
}

async function getByAtendenteId(atendenteId) {
    let equipeAtendentes = [];

    const queryResult = await databaseService.execute(`
        SELECT equipe_id,
               atendente_id,
               principal 

          FROM equipe_atendente   

         WHERE atendente_id = ${atendenteId} 
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const equipeAtendenteDb = queryResult.content[i];
            let equipeAtendente = new EquipeAtendente();

            equipeAtendente.equipe.id = equipeAtendenteDb.equipe_id;
            equipeAtendente.atendente.id = equipeAtendenteDb.atendente_id;
            equipeAtendente.principal = equipeAtendenteDb.principal;

            equipeAtendentes.push(equipeAtendente);
        }
    }

    return equipeAtendentes;
}

async function deleteByAtendenteId(atendenteId) {
    const queryResult = await databaseService.execute(`
        DELETE FROM equipe_atendente
              WHERE atendente_id = ${atendenteId};
    `);

    return queryResult;
}
