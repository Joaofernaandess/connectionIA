const formatoMensagemEnum = require("../enums/formatoMensagemEnum");

const Atendimento = require("./atendimento");
const Atendente = require("./atendente");
const Equipe = require("./equipe");
const Departamento = require("./departamento");

module.exports = class AtendimentoMensagem {
    constructor() {
        this.id = 0;
        this.blipId = "";
        this.atendimento = new Atendimento();
        this.atendente = new Atendente();
        this.recebido = false;
        this.equipe = new Equipe();
        this.departamento = new Departamento();
        this.dataHora = new Date(1, 1, 1, 0, 0, 0, 0);
        this.formato = formatoMensagemEnum.naoDefinido;
        this.conteudo = "";
        this.modeloId = 0;
        this.status = 0;
        this.respostaPara = {};
    }
}