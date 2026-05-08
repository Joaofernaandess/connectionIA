exports.getByKey = (_enum, key, value) => getByKey(_enum, key, value);
exports.getBy2Keys = (_enum, key, key2, value) => getBy2Keys(_enum, key, key2, value);
exports.getEnumObject = (_enum ) => getEnumObject(_enum);

module.exports = exports;

function getByKey(_enum, key, value) {
    const canalObjs = getEnumObject(_enum);

    for (let i = 0; i < canalObjs.length; i++) {
        const canalObj = canalObjs[i];
        const _key = canalObj[1][key];

        if (_key && ((typeof _key == "string" && _key.toLowerCase() == value.toLowerCase()) || (_key == value)))
            return canalObj[1];
    }
    return undefined;
}

function getBy2Keys(_enum, key, key2, value) {
    const canalObjs = getEnumObject(_enum);

    for (let i = 0; i < canalObjs.length; i++) {
        const canalObj = canalObjs[i];
        const _key = canalObj[1][key][key2];

        if (_key && ((typeof _key == "string" && _key.toLowerCase() == value.toLowerCase()) || (_key == value)))
            return canalObj[1];
    }

    return undefined;
}

function getEnumObject(_enum) {
    return Object.entries(_enum);
}