const Departamento = require('../entities/departamento');

const responseTypeEnum = require('../enums/responseTypeEnum');

const databaseService = require('../services/common/databaseService');

exports.add = (departamento) => add(departamento);
exports.get = (id) => get(id);
exports.getAll = () => getAll();
exports.getList = (equipeId, atendenteId) => getList(equipeId, atendenteId);
exports.delete = (id) => _delete(id);
exports.update = (departamento) => update(departamento);

module.exports = exports;

async function add(departamento) {
    const queryResult = await databaseService.execute(`
            INSERT INTO departamento(
                nome,
                sommusgestor_departamento_id,
                excluido                
            ) VALUES (
                "${departamento.nome}",
                ${departamento.sommusGestorId},
                false
            );
    `);

    return queryResult;
}

async function get(id) {
    let departamento = new Departamento();

    const queryResult = await databaseService.execute(`
        SELECT departamento_id,
               nome,
               sommusgestor_departamento_id,
               excluido

          FROM departamento

         WHERE departamento_id = ${id}
           AND excluido = false
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        const departamentoDb = queryResult.content[0];

        if (departamentoDb) {
            departamento.id = departamentoDb.departamento_id;
            departamento.nome = departamentoDb.nome;
            departamento.sommusGestorId = departamentoDb.sommusgestor_departamento_id;
            departamento.excluido = (departamentoDb.excluido && departamentoDb.excluido == 1 ? true : false);
        }
    }

    return departamento;
}

async function getAll() {
    let departamentos = new Array();

    const queryResult = await databaseService.execute(`
        SELECT departamento_id,
               nome,
               sommusgestor_departamento_id,
               excluido

          FROM departamento   
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const departamentoDb = queryResult.content[i];
            let departamento = new Departamento();

            departamento.id = departamentoDb.departamento_id;
            departamento.nome = departamentoDb.nome;
            departamento.sommusGestorId = departamentoDb.sommusgestor_departamento_id;
            departamento.excluido = (departamentoDb.excluido && departamentoDb.excluido == 1 ? true : false);

            departamentos.push(departamento);
        }
    }

    return departamentos;
}

async function getList(equipeId, atendenteId) {
    let departamentos = new Array();

    const query = `
            SELECT DISTINCT d.departamento_id,
                   d.nome,
                   d.sommusgestor_departamento_id,
                   d.excluido

              FROM departamento d 

         LEFT JOIN equipe e
                ON e.departamento_id = d.departamento_id

         LEFT JOIN departamento_atendente da
                ON da.departamento_id = d.departamento_id
            
            ${getListWhere(equipeId, atendenteId)}
    `;
    const queryResult = await databaseService.execute(query);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const departamentoDb = queryResult.content[i];
            let departamento = new Departamento();

            departamento.id = departamentoDb.departamento_id;
            departamento.nome = departamentoDb.nome;
            departamento.sommusGestorId = departamentoDb.sommusgestor_departamento_id;
            departamento.excluido = (departamentoDb.excluido && departamentoDb.excluido == 1 ? true : false);

            departamentos.push(departamento);
        }
    }

    return departamentos;
}

function getListWhere(equipeId, atendenteId) {
    let where = "d.excluido = 0";

    if (atendenteId > 0)
        where += ` AND da.atendente_id = ${atendenteId}`;

    if (equipeId > 0)
        where += `${where && where.length > 0 ? " AND " : ""} e.equipe_id = ${equipeId}`;

    return where && where.length > 0 ? `WHERE ${where}` : ``;
}

async function _delete(id) {
    const queryResult = await databaseService.execute(`
        UPDATE departamento

           SET excluido = true

         WHERE departamento_id = ${id}
    `);

    return queryResult.type == responseTypeEnum.success;
}

async function update(departamento) {
    const queryResult = await databaseService.execute(`
        UPDATE departamento

           SET nome                         = "${departamento.nome}",
               excluido                     = ${departamento.excluido},
               sommusgestor_departamento_id = ${departamento.sommusGestorId}
               
         WHERE departamento_id = ${departamento.id}
    `);

    return queryResult.type == responseTypeEnum.success;
}