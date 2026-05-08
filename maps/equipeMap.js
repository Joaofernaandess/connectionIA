const Equipe = require('../entities/equipe');
const SelectOption = require('../entities/selectOption');

exports.teamToEquipe = (team) => teamToEquipe(team);
exports.equipesToSelectOptionsWithNone = (equipes) => equipesToSelectOptionsWithNone(equipes);

module.exports = exports;

function teamToEquipe(team) {
    let equipe = new Equipe();

    equipe.nome = team.name;
    equipe.excluido = false;

    return equipe;
}

function equipesToSelectOptionsWithNone(equipes) {
    let selectOptions = new Array();

    // NONE
    let selectOptionNone = new SelectOption();
    selectOptionNone.id = 0;
    selectOptions.push(selectOptionNone);

    for (let i = 0; i < equipes.length; i++) {
        const equipe = equipes[i];

        let selectOption = new SelectOption();
        selectOption.id = equipe.id;
        selectOption.description = equipe.nome;

        if (equipe.departamentoId > 0) {
            selectOption.entitie = { departamentoId: equipe.departamentoId };
        }

        selectOptions.push(selectOption)
    }

    return selectOptions;
}