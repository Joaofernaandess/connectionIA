const Atendente = require("./atendente");
const Equipe = require("./equipe");
const Departamento = require("./departamento");

module.exports = class Redirecionamento {
    constructor() {
        this.id = 0;
        this.mensagem = "";
        this.mensagemRetorno = "";
        this.atendente = new Atendente();
        this.equipe = new Equipe();
        this.departamento = new Departamento();
        this.excluido = false;
    }
}