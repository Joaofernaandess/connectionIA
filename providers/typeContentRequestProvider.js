exports.get = (type, content) => get(type, content);

module.exports = exports;

function get(type, content) {
    switch (type) {
        case "text/plain":
            return "new-message";
        case "application/vnd.lime.media-link+json":
            return "new-message";
        case "application/vnd.lime.reply+json":
            return "new-message";
        case "application/vnd.lime.chatstate+json":
            return typeNotificationChatState(content);
        case "application/vnd.iris.ticket+json":
            return "new-ticket"

        default:
            if (ehConteudoMidia(content)) {
                return "new-message";
            }
            return "none";
    }
}

function typeNotificationChatState(content) {
    if (!content.state) return "none";

    switch (content.state) {
        case "composing":
            return "composing"

        case "pause":
            return "pause"

        default:
            break;
    }
}

function ehConteudoMidia(content) {
    if (!content) {
        return false;
    }

    const possuiUri = typeof content.uri === "string" && content.uri.length > 0;
    const possuiTipo = typeof content.type === "string" && content.type.length > 0;

    return possuiUri && possuiTipo;
}
