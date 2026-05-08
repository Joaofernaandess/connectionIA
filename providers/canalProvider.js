const canalEnum = require("../enums/blip/canalEnum");
const enumProvider = require("./enumProvider");

exports.getById = (id) => getById(id);
exports.getByIdentity = (identity) => getByIdentity(identity);
exports.getByIdString = (idString) => getByIdString(idString);

module.exports = exports;

function getById(id) {
    return enumProvider.getByKey(canalEnum, "id", id);
}

function getByIdentity(identity) {
    return enumProvider.getByKey(canalEnum, "identity", identity);
}

function getByIdString(idString) {
    return enumProvider.getByKey(canalEnum, "idString", idString);
}