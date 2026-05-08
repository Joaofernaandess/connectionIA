const propriedadeParametroEnum = require("../enums/propriedadeParametroEnum");
const enumProvider = require("./enumProvider");

exports.getById = (id) => getById(id);

module.exports = exports;

/**
 *
 * @param id
 * @returns {{id: number} | undefined }
 */
function getById(id) {
    return enumProvider.getByKey(propriedadeParametroEnum, "id", id);
}