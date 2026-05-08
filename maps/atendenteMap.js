const Atendente = require('../entities/atendente');
const SelectOption = require('../entities/selectOption');

exports.attendantToAtendente = (contact) => attendantToAtendente(contact);
exports.atendentesToAtendentesVM = (atendentes) => atendentesToAtendentesVM(atendentes);
exports.atendentesToSelectOptionsWithNone = (atendentes) => atendentesToSelectOptionsWithNone(atendentes);

module.exports = exports;

function attendantToAtendente(attendant) {
    let atendente = new Atendente();

    atendente.nome = attendant.fullname;
    atendente.email = attendant.email;
    atendente.urlFoto = "";

    return atendente;
}

function atendentesToAtendentesVM(atendentes) {
    let atendentesVM = new Array();

    for (let i = 0; i < atendentes.length; i++) {
        const atendente = atendentes[i];
        atendentesVM.push(atendenteToAtendenteVM(atendente));
    }

    return atendentesVM;
}

function atendenteToAtendenteVM(atendente) {
    let atendenteVM = new Atendente();

    atendenteVM.id = atendente.id;
    atendenteVM.nome = atendente.nome;
    atendenteVM.urlFoto = atendente.urlFoto;
    atendenteVM.equipes = atendente.equipes.map(e => e.id);
    atendenteVM.equipePrincipalId = atendente.equipePrincipalId;
    atendenteVM.departamentos = atendente.departamentos.map(e => e.id);
    atendenteVM.departamentoPrincipalId = atendente.departamentoPrincipalId;
    atendenteVM.excluido = atendente.excluido;

    return atendenteVM;
}

function atendentesToSelectOptionsWithNone(atendentes) {
    let selectOptions = new Array();

    // NONE
    let selectOptionNone = new SelectOption();
    selectOptionNone.id = 0;
    selectOptions.push(selectOptionNone);

    for (let i = 0; i < atendentes.length; i++) {
        const atendente = atendentes[i];

        let selectOption = new SelectOption();
        selectOption.id = atendente.id;
        selectOption.description = atendente.nome;
        selectOption.entitie = {
            email: atendente.email,
            equipes: atendente.equipes.map(e => e.id),
            equipePrincipalId: atendente.equipePrincipalId,
            departamentos: atendente.departamentos.map(e => e.id),
            departamentoPrincipalId: atendente.departamentoPrincipalId
        };

        selectOptions.push(selectOption)
    }

    return selectOptions;
}