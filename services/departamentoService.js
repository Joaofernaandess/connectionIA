const departamentoRepository = require('../repositories/departamentoRepository');

exports.getList = (equipeId, atendenteId) => getList(equipeId, atendenteId);

module.exports = exports;

async function getList(equipeId, atendenteId) {
    let departamentos = await departamentoRepository.getList(equipeId, atendenteId);

    departamentos = preparaDepartamentos(departamentos);
    departamentos.sort(ordenaDepartamentos);

    return departamentos;
}

function preparaDepartamentos(departamentos) {
    let departamentosAtivos = new Array();

    for (let i = 0; i < departamentos.length; i++) {
        const departamento = departamentos[i];

        if (departamento.excluido) continue;

        departamentosAtivos.push(departamento);
    }

    return departamentosAtivos;
}

function ordenaDepartamentos(a, b) {
    if (a.nome < b.nome) return -1;
    if (a.nome > b.nome) return 1;
    return 0;
}