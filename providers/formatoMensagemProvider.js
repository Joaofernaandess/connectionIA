const formatoMensagemEnum = require("../enums/formatoMensagemEnum");
const enumProvider = require("./enumProvider");

exports.getById = (id) => getById(id);
exports.getByType = (type) => getByType(type);
exports.getByTypeReponse = (type) => getByTypeReponse(type);

module.exports = exports;

function getById(id) {
    return enumProvider.getByKey(formatoMensagemEnum, "id", id);
}

function getByType(type) {
    if (!type || typeof type !== "string") {
        return formatoMensagemEnum.naoDefinido;
    }

    const normalizedType = type.toLowerCase();

    if (normalizedType.includes("text")) {
        return formatoMensagemEnum.texto;
    } else if (normalizedType.includes("reply")) {
        return formatoMensagemEnum.resposta;
    } else if (
        normalizedType.includes("image") ||
        normalizedType.includes("audio") ||
        normalizedType.includes("voice") ||
        normalizedType.includes("video") ||
        normalizedType.includes("media") ||
        normalizedType.includes("document") ||
        normalizedType.includes("location")
    ) {
        return formatoMensagemEnum.arquivo;
    } else if (normalizedType.includes("application")) {
        return formatoMensagemEnum.arquivo;
    } else {
        return formatoMensagemEnum.naoDefinido;
    }
}

function getByTypeReponse(type) {
    if (!type)
        return "texto"

    if (type.includes("image")) {
        return "imagem";
    } else if (type.includes("audio") || type.includes("voice")) {
        return "audio";
        // } else if (type.includes("video")) {
        //     return "arquivo";
        // } else if (type.includes("application")) {
        //     return "arquivo";
    } else {
        return "arquivo";
    }
}
