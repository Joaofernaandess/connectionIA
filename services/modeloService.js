const modeloRepository = require('../repositories/modeloRepository');
const Modelo = require('../entities/modelo');
const ModeloParametro = require('../entities/modeloParametro');

exports.getModelos = async (comParametros) => getModelos(comParametros);
exports.getModeloById = async (id, comParametros) => getModeloById(id, comParametros);

module.exports = exports;

async function getModelos(comParametros) {
    const modelos = await modeloRepository.getAllModelos(comParametros);
    if (!modelos) {
        return {
            success: false,
            message: 'Modelos não encontrados'
        }
    }

    return {
        success: true,
        data: modelos
    }
}

/**
 * Retorna um modelo pelo ID
 * @param id {number} ID do modelo
 * @param comParametros {boolean} Indica se deve retornar os parâmetros do modelo
 * @returns {Promise<{data: Modelo, success: boolean}|{success: boolean, message: string}>}
 */
async function getModeloById(id, comParametros = false) {
    if (!id) {
        return {
            success: false,
            message: 'Id não informado'
        }
    }

    const modelo = await modeloRepository.getModeloById(id, comParametros);
    if (!modelo) {
        return {
            success: false,
            message: 'Modelo não encontrado'
        }
    }

    return {
        success: true,
        data: modelo
    }
}
