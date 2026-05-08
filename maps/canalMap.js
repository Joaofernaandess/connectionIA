const SelectOption = require('../entities/selectOption');

exports.canaisToSelectOptions = (canais) => canaisToSelectOptions(canais);

module.exports = exports;

function canaisToSelectOptions(canais) {
    let selectOptions = new Array();

    for (let i = 0; i < canais.length; i++) {
        const canal = canais[i];

        let selectOption = new SelectOption();
        selectOption.id = canal.id;
        selectOption.description = canal.descricao;
        
        selectOptions.push(selectOption)
    }

    return selectOptions;
}