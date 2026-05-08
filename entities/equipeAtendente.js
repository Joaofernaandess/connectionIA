const Equipe = require('../entities/equipe');
const Atendente = require('../entities/atendente');

module.exports = class EquipeAtendente {
    constructor() {
        this.equipe = new Equipe();
        this.atendente = new Atendente();
        this.principal = false
    }
}