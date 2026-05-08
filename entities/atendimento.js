const blipStatusEnum = require("../enums/blip/statusEnum");

const Contato = require("./contato");
const Atendente = require("./atendente");
const Equipe = require("./equipe");
const Departamento = require("./departamento");

module.exports = class Atendimento {
    constructor() {
        this.id = 0;
        this.blipAtendimentoId = "";
        this.contato = new Contato();
        this.atendente = new Atendente();
        this.equipe = new Equipe();
        this.departamento = new Departamento();
        this.dataHora = new Date(1, 1, 1, 0, 0, 0, 0);
        this.status = blipStatusEnum.undefined;
        this.mensagens = [];
        this.quantidadeMensagensNaoRespondidas = 0;
        this.dataUltimaMensagem = new Date(1, 1, 1, 0, 0, 0, 0);
        this.dataUltimaMensagemRecebida = new Date(1, 1, 1, 0, 0, 0, 0);
        this.desabilitaChatRegraWhatsApp = false;
        this.desabilitaChatRegraAtendente = false;
        this.desabilitaChatRegraNotificaoAtiva = false;
        this.permiteAtender = true;
    }
}