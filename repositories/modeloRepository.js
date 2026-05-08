const Modelo = require('../entities/modelo');
const ModeloParametro = require('../entities/modeloParametro');

const responseTypeEnum = require('../enums/responseTypeEnum');

const databaseService = require('../services/common/databaseService');
const commonService = require('../services/common/commonService');

exports.getAllModelos = (comParametros) => getAllModelos(comParametros);
exports.getModeloById = (id, comParametros) => getModeloById(id, comParametros);
exports.getModeloParametroById = (id) => getModeloParametroById(id);
exports.getModeloParametroByModeloId = (modeloId) => getModeloParametroByModeloId(modeloId);

module.exports = exports;

/**
 * Retorna todos os modelos.
 * @param comParametros {boolean} Indica se deve retornar os parâmetros de modelo. Default: false.
 * @returns {Promise<*[]>} Retorna uma promise com os modelos. Pode ser um array vazio.
 */
async function getAllModelos(comParametros = false) {
    const modelos = [];

    const queryResult = await databaseService.execute(`
            SELECT modelo_id,
                   nome,
                   tipo,
                   conteudo,
                   url

              FROM modelo

             WHERE excluido = 0;
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (const modeloDb of queryResult.content) {
            const modelo = new Modelo();

            modelo.id = modeloDb.modelo_id;
            modelo.nome = modeloDb.nome;
            modelo.tipo = modeloDb.tipo;
            modelo.conteudo = modeloDb.conteudo;
            modelo.url = modeloDb.url;

            if (comParametros) {
                modelo.parametros = await getModeloParametroByModeloId(modelo.id);
            }

            modelos.push(modelo);
        }
    }

    return modelos;
}

/** Retorna um modelo pelo ID.
 * @param id ID do modelo.
 * @param comParametros {boolean} Indica se deve retornar os parâmetros de modelo. Default: false.
 * @returns {Promise<Modelo>} Retorna uma promise com o modelo. Pode ser vazio.
 */
async function getModeloById(id, comParametros = false) {
    const modelo = new Modelo();

    const queryResult = await databaseService.execute(`
            SELECT modelo_id,
                   nome,
                   tipo,
                   conteudo,
                   url

              FROM modelo

             WHERE modelo_id = ${id}
               AND excluido = 0;
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        const modeloDb = queryResult.content[0];
        if (modeloDb) {
            modelo.id = modeloDb.modelo_id;
            modelo.nome = modeloDb.nome;
            modelo.tipo = modeloDb.tipo;
            modelo.conteudo = modeloDb.conteudo;
            modelo.url = modeloDb.url;

            if (comParametros) {
                modelo.parametros = await getModeloParametroByModeloId(modelo.id);
            }
        }
    }

    return modelo;
}

/** Retorna um parâmetro de modelo pelo ID.
 * @param id ID do parâmetro de modelo.
 * @returns {Promise<ModeloParametro>} Retorna uma promise com o parâmetro de modelo. Pode ser um array vazio.
 */
async function getModeloParametroById(id) {
    const modeloParametro = new ModeloParametro();

    const queryResult = await databaseService.execute(`
            SELECT modelo_parametro_id,
                   modelo_id,
                   nome,
                   ordem,
                   propriedade

              FROM modelo_parametro

             WHERE modelo_parametro_id = ${id};
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        const modeloParametroDb = queryResult.content[0];
        if (modeloParametroDb) {
            modeloParametro.id = modeloParametroDb.modelo_parametro_id;
            modeloParametro.modelo.id = modeloParametroDb.modelo_id;
            modeloParametro.nome = modeloParametroDb.nome;
            modeloParametro.ordem = modeloParametroDb.ordem;
            modeloParametro.propriedade = modeloParametroDb.propriedade;
        }
    }

    return modeloParametro;
}

/** Retorna os parâmetros de modelo pelo ID do modelo.
 * @param modeloId ID do modelo.
 * @returns {Promise<ModeloParametro[] | []>} Retorna uma promise com os parâmetros de modelo. Pode ser um array vazio.
 */
async function getModeloParametroByModeloId(modeloId) {
    const modeloParametros = [];

    const queryResult = await databaseService.execute(`
            SELECT modelo_parametro_id,
                   modelo_id,
                   nome,
                   ordem,
                   propriedade

              FROM modelo_parametro

             WHERE modelo_id = ${modeloId};
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        for (const modeloParametroDb of queryResult.content) {
            const modeloParametro = new ModeloParametro();

            modeloParametro.id = modeloParametroDb.modelo_parametro_id;
            modeloParametro.modelo.id = modeloParametroDb.modelo_id;
            modeloParametro.nome = modeloParametroDb.nome;
            modeloParametro.ordem = modeloParametroDb.ordem;
            modeloParametro.propriedade = modeloParametroDb.propriedade;

            modeloParametros.push(modeloParametro);
        }
    }

    return modeloParametros;
}
