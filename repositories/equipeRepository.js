const Equipe = require('../entities/equipe');

const responseTypeEnum = require('../enums/responseTypeEnum');

const databaseService = require('../services/common/databaseService');
const commonService = require('../services/common/commonService');
const logService = require('../services/common/logService');

exports.add = (equipe) => add(equipe);
exports.get = (id) => get(id);
exports.getByNome = (nome) => getByNome(nome);
exports.getAll = () => getAll();
exports.getList = (departamentoId, atendenteId) => getList(departamentoId, atendenteId);
exports.delete = (id) => _delete(id);
exports.update = (equipe) => update(equipe);

module.exports = exports;

async function add(equipe) {
    const queryResult = await databaseService.execute(`
            INSERT INTO equipe(
                nome,
                sommusgestor_equipe_id,
                departamento_id,
                excluido                
            ) VALUES (
                "${equipe.nome}",
                ${equipe.sommusGestorId},
                ${commonService.sqlValueZeroForNull(equipe.departamentoId)},
                false
            );
    `);

    return queryResult;
}

async function get(id) {
    let equipe = new Equipe();

    const queryResult = await databaseService.execute(`
        SELECT equipe_id,
               nome,
               sommusgestor_equipe_id,
               departamento_id,
               excluido

          FROM equipe

         WHERE equipe_id = ${id}
           AND excluido = false
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        const equipeDb = queryResult.content[0];

        if (equipeDb) {
            equipe.id = equipeDb.equipe_id;
            equipe.nome = equipeDb.nome;
            equipe.sommusGestorId = equipeDb.sommusgestor_equipe_id;
            equipe.departamentoId = equipeDb.departamento_id;
            equipe.excluido = (equipeDb.excluido && equipeDb.excluido == 1 ? true : false);
        }
    }

    return equipe;
}

async function getByNome(nome) {
    let equipe = new Equipe();

    const queryResult = await databaseService.execute(`
        SELECT equipe_id,
               nome,
               sommusgestor_equipe_id,
               departamento_id,
               excluido

          FROM equipe

         WHERE nome = "${nome}"
           AND excluido = false
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        const equipeDb = queryResult.content[0];

        if (equipeDb) {
            equipe.id = equipeDb.equipe_id;
            equipe.nome = equipeDb.nome;
            equipe.sommusGestorId = equipeDb.sommusgestor_equipe_id;
            equipe.departamentoId = equipeDb.departamento_id;
            equipe.excluido = (equipeDb.excluido && equipeDb.excluido == 1 ? true : false);
        }
    }

    return equipe;
}

async function getAll() {
    let equipes = new Array();

    const queryResult = await databaseService.execute(`
        SELECT equipe_id,
               nome,
               sommusgestor_equipe_id,
               departamento_id,
               excluido

          FROM equipe   
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const equipeDb = queryResult.content[i];
            let equipe = new Equipe();

            equipe.id = equipeDb.equipe_id;
            equipe.nome = equipeDb.nome;
            equipe.sommusGestorId = equipeDb.sommusgestor_equipe_id;
            equipe.departamentoId = equipeDb.departamento_id;
            equipe.excluido = (equipeDb.excluido && equipeDb.excluido == 1 ? true : false);

            equipes.push(equipe);
        }
    }

    return equipes;
}

async function getList(departamentoId, atendenteId) {
    let equipes = new Array();

    const query = `    
             SELECT DISTINCT e.equipe_id,
                    e.nome,
                    e.sommusgestor_equipe_id,
                    e.departamento_id,
                    e.excluido

               FROM equipe e 

          LEFT JOIN equipe_atendente ea
                 ON ea.equipe_id = e.equipe_id
          
          ${getListWhere(departamentoId, atendenteId)}
    `;
    const queryResult = await databaseService.execute(query);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const equipeDb = queryResult.content[i];
            let equipe = new Equipe();

            equipe.id = equipeDb.equipe_id;
            equipe.nome = equipeDb.nome;
            equipe.sommusGestorId = equipeDb.sommusgestor_equipe_id;
            equipe.departamentoId = equipeDb.departamento_id;
            equipe.excluido = (equipeDb.excluido && equipeDb.excluido == 1 ? true : false);

            equipes.push(equipe);
        }
    }

    return equipes;
}

function getListWhere(departamentoId, atendenteId) {
    let where = "";

    if (atendenteId > 0)
        where += ` ea.atendente_id = ${atendenteId}`;

    if (departamentoId > 0)
        where += `${where && where.length > 0 ? " AND " : ""} e.departamento_id = ${departamentoId}`;

    return where && where.length > 0 ? `WHERE ${where}` : ``;
}

async function _delete(id) {
    const queryResult = await databaseService.execute(`
        UPDATE equipe

           SET excluido = true

         WHERE equipe_id = ${id}
    `);

    return queryResult.type == responseTypeEnum.success;
}

async function update(equipe) {
    const queryResult = await databaseService.execute(`
        UPDATE equipe

           SET nome                   = "${equipe.nome}",
               excluido               = ${equipe.excluido},
               sommusgestor_equipe_id = ${equipe.sommusGestorId},
               departamento_id        = ${commonService.sqlValueZeroForNull(equipe.departamentoId)}
               
         WHERE equipe_id = ${equipe.id}
    `);

    return queryResult.type == responseTypeEnum.success;
}