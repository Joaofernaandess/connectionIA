const tipoFalhaEnum = require("../enums/tipoFalhaEnum");
const enumProvider = require("./enumProvider");

exports.getById = (id) => getById(id);

module.exports = exports;

/**
 *
 * @param id {number}
 * @returns {{id: number} | undefined }
 */
function getById(id) {
    return enumProvider.getByKey(tipoFalhaEnum, "id", id);
}