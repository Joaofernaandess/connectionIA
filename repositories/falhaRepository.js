const Falha = require('../entities/falha');

const responseTypeEnum = require('../enums/responseTypeEnum');

const databaseService = require('../services/common/databaseService');
const commonService = require('../services/common/commonService');

exports.add = (falha) => add(falha);
exports.getAllFalhas = () => getAllFalhas();
exports.getFalhaById = (id) => getFalhaById(id);
exports.getFalhasEmPeriodo = (dataInicio, dataFim) => getFalhasEmPeriodo(dataInicio, dataFim);
exports.getFalhasPorAtendente = (atendenteId) => getFalhasPorAtendente(atendenteId);
exports.getFalhasPorTipo = (tipo, atendenteId) => getFalhasPorTipo(tipo, atendenteId);

module.exports = exports;

async function add(falha) {
    const queryResult = await databaseService.execute(`
        INSERT INTO falha (atendente_id, data_hora, tipo_falha)
        VALUES (${falha.atendente.id}, '${commonService.getDateTimeFormatMySQL(falha.dataHora)}', ${falha.tipo.id});
    `);

    if (queryResult.type === responseTypeEnum.success) {
        falha.id = queryResult.content.insertId;
    }

    return falha;
}

async function getAllFalhas() {
    const falhas = [];

    const queryResult = await databaseService.execute(`
            SELECT falha_id,
                   atendente_id,
                   data_hora,
                   tipo_falha
            FROM falha;
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        queryResult.content.forEach(falhaDb => {
            const falha = new Falha();

            falha.id = falhaDb.falha_id;
            falha.atendente.id = falhaDb.atendente_id;
            falha.dataHora = falhaDb.data_hora;
            falha.tipo = falhaDb.tipo_falha;

            falhas.push(falha);
        });
    }

    return falhas;
}

async function getFalhaById(id) {
    const falha = new Falha();
    const queryResult = await databaseService.execute(`
            SELECT falha_id,
                   atendente_id,
                   data_hora,
                   tipo_falha
            FROM falha
            WHERE falha_id = ${id};
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        const falhaDb = queryResult.content[0];

        falha.id = falhaDb.falha_id;
        falha.atendente.id = falhaDb.atendente_id;
        falha.dataHora = falhaDb.data_hora;
        falha.tipo = falhaDb.tipo_falha;
    }

    return falha;
}

async function getFalhasEmPeriodo(dataInicio, dataFim) {
    const falhas = [];

    const queryResult = await databaseService.execute(`
            SELECT falha_id,
                   atendente_id,
                   data_hora,
                   tipo_falha
            FROM falha
            WHERE data_hora BETWEEN '${dataInicio}' AND '${dataFim}';
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        queryResult.content.forEach(falhaDb => {
            const falha = new Falha();

            falha.id = falhaDb.falha_id;
            falha.atendente.id = falhaDb.atendente_id;
            falha.dataHora = falhaDb.data_hora;
            falha.tipo = falhaDb.tipo_falha;

            falhas.push(falha);
        });
    }

    return falhas;
}

async function getFalhasPorAtendente(atendenteId) {
    const falhas = [];

    const queryResult = await databaseService.execute(`
            SELECT falha_id,
                   atendente_id,
                   data_hora,
                   tipo_falha
            FROM falha
            WHERE atendente_id = ${atendenteId};
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        queryResult.content.forEach(falhaDb => {
            const falha = new Falha();

            falha.id = falhaDb.falha_id;
            falha.atendente.id = falhaDb.atendente_id;
            falha.dataHora = falhaDb.data_hora;
            falha.tipo = falhaDb.tipo_falha;

            falhas.push(falha);
        });
    }

    return falhas;
}

async function getFalhasPorTipo(tipo, atendenteId) {
    const falhas = [];

    const queryResult = await databaseService.execute(`
            SELECT falha_id,
                   atendente_id,
                   data_hora,
                   tipo_falha
            FROM falha
            WHERE tipo_falha = '${tipo}' AND atendente_id = ${atendenteId};
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        queryResult.content.forEach(falhaDb => {
            const falha = new Falha();

            falha.id = falhaDb.falha_id;
            falha.atendente.id = falhaDb.atendente_id;
            falha.dataHora = falhaDb.data_hora;
            falha.tipo = falhaDb.tipo_falha;

            falhas.push(falha);
        });
    }

    return falhas;
}