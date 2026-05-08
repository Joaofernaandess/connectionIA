const Atendente = require('../entities/atendente');

const responseTypeEnum = require('../enums/responseTypeEnum');

const databaseService = require('../services/common/databaseService');

exports.add = (atendente) => add(atendente);
exports.get = (id) => get(id);
exports.getAll = () => getAll();
exports.getList = (equipeId, departamentoId) => getList(equipeId, departamentoId);
exports.getByEmail = (email) => getByEmail(email);
exports.getByEquipeId = (equipeId) => getByEquipeId(equipeId);
exports.update = (atendente) => update(atendente);
exports.delete = (id) => _delete(id);

module.exports = exports;

async function add(atendente) {
    const queryResult = await databaseService.execute(`
        INSERT INTO atendente(
            nome,
            sommusgestor_atendente_id,
            email,
            url_foto
        ) VALUES (
            "${atendente.nome}",
            ${atendente.sommusGestorId},
            "${atendente.email}",
            "${atendente.urlFoto}"
        );
    `);

    return queryResult;
}

async function get(id) {
    let atendente = new Atendente();

    const queryResult = await databaseService.execute(`
        SELECT atendente_id,
               sommusgestor_atendente_id,
               nome,
               email,
               url_foto,
               excluido

          FROM atendente

         WHERE atendente_id = "${id}"
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        const atendenteDb = queryResult.content[0];

        if (atendenteDb) {
            atendente.id = atendenteDb.atendente_id;
            atendente.nome = atendenteDb.nome;
            atendente.email = atendenteDb.email;
            atendente.urlFoto = atendenteDb.url_foto;
            atendente.excluido = (atendenteDb.excluido && atendenteDb.excluido == 1 ? true : false);
        }
    }

    return atendente;
}

async function getByEmail(email) {
    let atendente = new Atendente();

    const queryResult = await databaseService.execute(`
        SELECT atendente_id,
               sommusgestor_atendente_id,
               nome,
               email,
               url_foto,
               excluido

          FROM atendente

         WHERE email = "${email}"
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        const atendenteDb = queryResult.content[0];

        if (atendenteDb) {
            atendente.id = atendenteDb.atendente_id;
            atendente.nome = atendenteDb.nome;
            atendente.email = atendenteDb.email;
            atendente.urlFoto = atendenteDb.url_foto;
            atendente.excluido = (atendenteDb.excluido && atendenteDb.excluido == 1 ? true : false);
        }
    }

    return atendente;
}

async function getByEquipeId(equipeId) {
    let atendentes = new Array();

    const queryResult = await databaseService.execute(`
        SELECT DISTINCT a.atendente_id,
                        a.sommusgestor_atendente_id,
                        a.nome,
                        a.email,
                        a.url_foto,
                        a.excluido

                   FROM atendente a

              LEFT JOIN equipe_atendente ea
                     ON ea.atendente_id = a.atendente_id

                  WHERE ea.equipe_id = ${equipeId}
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const atendenteDb = queryResult.content[i];
            let atendente = new Atendente();

            atendente.id = atendenteDb.atendente_id;
            atendente.sommusGestorId = atendenteDb.sommusgestor_atendente_id;
            atendente.nome = atendenteDb.nome;
            atendente.email = atendenteDb.email;
            atendente.urlFoto = atendenteDb.url_foto;
            atendente.excluido = (atendenteDb.excluido && atendenteDb.excluido == 1 ? true : false);

            atendentes.push(atendente);
        }
    }

    return atendentes;
}

async function getAll() {
    let atendentes = new Array();

    const queryResult = await databaseService.execute(`
        SELECT atendente_id,
               sommusgestor_atendente_id,
               nome,
               email,
               url_foto,
               excluido

          FROM atendente
    `);

    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const atendenteDb = queryResult.content[i];
            let atendente = new Atendente();

            atendente.id = atendenteDb.atendente_id;
            atendente.sommusGestorId = atendenteDb.sommusgestor_atendente_id;
            atendente.nome = atendenteDb.nome;
            atendente.email = atendenteDb.email;
            atendente.urlFoto = atendenteDb.url_foto;
            atendente.excluido = (atendenteDb.excluido && atendenteDb.excluido == 1 ? true : false);

            atendentes.push(atendente);
        }
    }

    return atendentes;
}

async function getList(equipeId, departamentoId) {
    let atendentes = new Array();

    const query = `
            SELECT DISTINCT a.atendente_id,
                   a.sommusgestor_atendente_id,
                   a.nome,
                   a.email,
                   a.url_foto,
                   a.excluido

              FROM atendente a

         LEFT JOIN equipe_atendente ea
                ON ea.atendente_id = a.atendente_id

         LEFT JOIN departamento_atendente da
                ON da.atendente_id = a.atendente_id

                ${getListWhere(equipeId, departamentoId)}
    `;
    const queryResult = await databaseService.execute(query);


    if (queryResult.type == responseTypeEnum.success && queryResult.content.length > 0) {
        for (let i = 0; i < queryResult.content.length; i++) {
            const atendenteDb = queryResult.content[i];
            let atendente = new Atendente();

            atendente.id = atendenteDb.atendente_id;
            atendente.sommusGestorId = atendenteDb.sommusgestor_atendente_id;
            atendente.nome = atendenteDb.nome;
            atendente.email = atendenteDb.email;
            atendente.urlFoto = atendenteDb.url_foto;
            atendente.excluido = (atendenteDb.excluido && atendenteDb.excluido == 1 ? true : false);

            atendentes.push(atendente);
        }
    }

    return atendentes;
}

function getListWhere(equipeId, departamentoId) {
    let where = "";

    if (equipeId > 0)
        where += ` ea.equipe_id = ${equipeId}`;

    if (departamentoId > 0)
        where += `${where && where.length > 0 ? " AND " : ""} da.departamento_id = ${departamentoId}`;

    return where && where.length > 0 ? `WHERE ${where}` : ``;
}

async function update(atendente) {
    const queryResult = await databaseService.execute(`
        UPDATE atendente

           SET nome                      = "${atendente.nome}",
               email                     = "${atendente.email}",
               url_foto                  = "${atendente.urlFoto}",
               sommusgestor_atendente_id = ${atendente.sommusGestorId},
               excluido                  = ${atendente.excluido}

         WHERE atendente_id = ${atendente.id}
    `);

    return queryResult;
}

async function _delete(id) {
    const queryResult = await databaseService.execute(`
        UPDATE atendente

           SET excluido = true

         WHERE atendente_id = ${id}
    `);

    return queryResult.type == responseTypeEnum.success;
}