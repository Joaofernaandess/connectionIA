const Atendimento = require('./atendimento');
const Atendente = require('./atendente');
const Equipe = require('./equipe');
const Departamento = require('./departamento');

module.exports = class AtendimentoAtividade {
    constructor() {
        this.id = 0;
        this.atendimento = new Atendimento();
        this.atendente = new Atendente();
        this.dataHora = new Date(1, 1, 1, 0, 0, 0, 0);
        this.atividade = undefined;
        this.transferenciaAtendente = new Atendente();
        this.transferenciaEquipe = new Equipe();
        this.transferenciaDepartamento = new Departamento();
    }
}