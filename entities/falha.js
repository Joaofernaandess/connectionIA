const Atendente = require("./atendente");
module.exports = class Falha {
    constructor() {
        this.id = 0;
        this.atendente = new Atendente();
        this.dataHora = new Date();
        this.tipo = 0;
    }
}