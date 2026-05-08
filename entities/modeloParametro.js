const Modelo = require("./modelo");
module.exports = class ModeloParametro {
    constructor() {
        this.id = 0;
        this.modelo = new Modelo();
        this.nome = "";
        this.ordem = 0;
        this.propriedade = 0;
    }
}