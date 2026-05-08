const statusEnum = require("../enums/blip/statusEnum");
const enumProvider = require("./enumProvider");

exports.getById = (id) => getById(id);
exports.getByBlipId = (identity) => getByBlipId(identity);

module.exports = exports;

function getById(id) {
    return enumProvider.getBy2Keys(statusEnum, "intern", "id", id);
}

function getByBlipId(identity) {
    return enumProvider.getByKey(statusEnum, "id", identity);
}