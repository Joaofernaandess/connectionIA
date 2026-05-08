const SelectOption = require('../entities/selectOption');

exports.departamentosToSelectOptions = (departamentos) => departamentosToSelectOptions(departamentos);

module.exports = exports;

function departamentosToSelectOptions(departamentos) {
    let selectOptions = new Array();

    // NONE
    let selectOptionNone = new SelectOption();
    selectOptionNone.id = 0;
    selectOptions.push(selectOptionNone);

    for (let i = 0; i < departamentos.length; i++) {
        const departamento = departamentos[i];

        let selectOption = new SelectOption();
        selectOption.id = departamento.id;
        selectOption.description = departamento.nome;

        selectOptions.push(selectOption)
    }

    return selectOptions;
}