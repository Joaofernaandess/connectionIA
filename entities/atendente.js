module.exports = class Atendente {
    constructor() {
        this.id = 0;
        this.sommusGestorId = "";
        this.nome = "";
        this.email = "";
        this.urlFoto = "";
        this.equipes = new Array();
        this.equipePrincipalId = 0;
        this.departamentos = new Array();
        this.departamentoPrincipalId = 0;
        this.excluido = false;
    }
}