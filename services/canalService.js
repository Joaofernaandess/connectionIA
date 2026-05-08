const canalEnum = require('../enums/blip/canalEnum');

const enumProvider = require('../providers/enumProvider');

exports.getCanal = (canal, source) => getCanal(canal, source);
exports.getAll = () => getAll();

module.exports = exports;

function getCanal(canal, source) {
    let canalFinded = enumProvider.getByKey(canalEnum, "identity", canal);

    if (!canalFinded) {
        canalFinded = enumProvider.getByKey(canalEnum, "idString", source);
    }

    if (!canalFinded) {
        canalFinded = enumProvider.getByKey(canalEnum, "identity", source);
    }

    if (!canalFinded) {
        canalFinded = enumProvider.getByKey(canalEnum, "idString", "outro");
    }

    return canalFinded;
}

function getAll() {
    let canais = new Array();

    canais.push({
        id: "all",
        descricao: ""
    });

    Object.entries(canalEnum).forEach(
        c => {
            canais.push({
                id: c[1].idString,
                descricao: c[1].name
            })
        }
    );

    return canais;
}