const Departamento = require('../entities/departamento');
const Atendente = require('../entities/atendente');

module.exports = class DepartamentoAtendente {
    constructor() {
        this.departamento = new Departamento();
        this.atendente = new Atendente();
        this.principal = false
    }
}