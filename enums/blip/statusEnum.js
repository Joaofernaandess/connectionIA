const statusEnum = require("../statusEnum");

/**
 *
 * @typedef {{blipId: string, intern: {id: number}, description: string, id: string}} BlipStatusEnum
 */

module.exports = {
    undefined: {
        id: "undefined",
        blipId: "",
        description: "Não definido",
        intern: statusEnum.naoDefinido
    },
    open: {
        id: "open",
        blipId: "open",
        description: "Atendendo",
        intern: statusEnum.atendendo
    },
    pending: {
        id: "pending",
        blipId: "",
        description: "Aguardando",
        intern: statusEnum.aguardando
    },
    waiting: {
        id: "waiting",
        blipId: "waiting",
        description: "Pendente",
        intern: statusEnum.pendente
    },
    closed: {
        id: "closed",
        blipId: "closed",
        description: "Fechado",
        intern: statusEnum.finalizado
    },
    closedattendant: {
        id: "closed",
        blipId: "closedattendant",
        description: "Fechado pelo atendente",
        intern: statusEnum.finalizado
    },
    closedclient: {
        id: "closed",
        blipId: "closedclient",
        description: "Fechado pelo cliente",
        intern: statusEnum.finalizado
    },
    transferred: {
        id: "transferred",
        blipId: "transferred",
        description: "Transferido",
        intern: statusEnum.naoDefinido
    },
    missed: {
        id: "missed",
        blipId: "missed",
        description: "Perdido",
        intern: statusEnum.naoDefinido
    }
}