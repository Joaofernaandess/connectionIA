const Equipe = require('../entities/equipe');

const equipeRepository = require('../repositories/equipeRepository');
const atendenteRepository = require('../repositories/atendenteRepository');

exports.getList = (departamentoId, atendenteId) => getList(departamentoId, atendenteId);
exports.getEquipeAtendentesByEquipeNome = (name) => getEquipeAtendentesByEquipeNome(name);

module.exports = exports;

async function getList(departamentoId, atendenteId) {
    let equipes = await equipeRepository.getList(departamentoId, atendenteId);
    
    equipes = preparaEquipes(equipes);
    equipes.sort(ordenaEquipes);

    return equipes;
}

async function getEquipeAtendentesByEquipeNome(name) {
    let atendentes = new Array();
    let equipe = new Equipe();

    if (name) {
        equipe = await equipeRepository.getByNome(name);

        if (equipe.id > 0) {
            atendentes = await atendenteRepository.getByEquipeId(equipe.id);
        }
    }

    return {
        equipe: equipe,
        atendentes: atendentes
    };
}

function preparaEquipes(equipes) {
    let equipesAtivos = new Array();

    for (let i = 0; i < equipes.length; i++) {
        const equipe = equipes[i];

        if (equipe.excluido) continue;

        equipesAtivos.push(equipe);
    }

    return equipesAtivos;
}

function ordenaEquipes(a, b) {
    if (a.nome < b.nome) return -1;
    if (a.nome > b.nome) return 1;
    return 0;
}