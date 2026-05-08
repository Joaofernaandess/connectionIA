const statusEnum = require("../../enums/blip/statusEnum");

exports.get = async (status) => get(status);

module.exports = exports;

function get(status) {
    
    status = status ? status : "";

    switch (status.toLowerCase()) {
        case "open":
            return statusEnum.open;

        case "waiting":
            return statusEnum.waiting;

        case "closed":
            return statusEnum.closed;

        case "closedattendant":
            return statusEnum.closedattendant;

        case "closedclient":
            return statusEnum.closedclient;

        case "transferred":
            return statusEnum.transferred;

        case "missed":
            return statusEnum.missed;

        default:
            return statusEnum.waiting;
    }
}