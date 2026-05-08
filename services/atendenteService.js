const userService = require('./external_access/userService');

const atendenteRepository = require('../repositories/atendenteRepository');
const equipeAtendenteRepository = require('../repositories/equipeAtendenteRepository');
const departamentoAtendenteRepository = require('../repositories/departamentoAtendenteRepository');

exports.getList = (equipeId, departamentoId) => getList(equipeId, departamentoId);
exports.getByEquipeId = (equipeId) => getByEquipeId(equipeId);
exports.getByEmail = (email) => getByEmail(email);

module.exports = exports;

async function getList(equipeId, departamentoId) {
    let atendentes = await atendenteRepository.getList(equipeId, departamentoId);

    atendentes = await preparaAtendentes(atendentes);
    atendentes.sort(ordenaAtendentes);

    return atendentes;
}

async function getByEquipeId(equipeId) {
    let atendentes = await atendenteRepository.getByEquipeId(equipeId);
    atendentes = await preparaAtendentes(atendentes);
    atendentes.sort(ordenaAtendentes);

    return atendentes;
}

async function getByEmail(email) {
    const atendente = await atendenteRepository.getByEmail(email);
    return atendente;
}

async function preparaAtendentes(atendentes) {
    let atendentesAtivos = new Array();

    for (let i = 0; i < atendentes.length; i++) {
        let atendente = atendentes[i];

        if (atendente.excluido) {
            continue;
        }

        atendente.nome += getStatusAtendente(atendente.email);

        const atendenteEquipes = await equipeAtendenteRepository.getByAtendenteId(atendente.id);
        const atendenteDepartamentos = await departamentoAtendenteRepository.getByAtendenteId(atendente.id);

        for (let x = 0; x < atendenteEquipes.length; x++) {
            const atendenteEquipe = atendenteEquipes[x];
            atendente.equipes.push(atendenteEquipe.equipe)

            if (atendenteEquipe.principal)
                atendente.equipePrincipalId = atendenteEquipe.equipe.id;
        }

        for (let x = 0; x < atendenteDepartamentos.length; x++) {
            const atendenteDepartamento = atendenteDepartamentos[x];
            atendente.departamentos.push(atendenteDepartamento.departamento)

            if (atendenteDepartamento.principal)
                atendente.departamentoPrincipalId = atendenteDepartamento.departamento.id;
        }

        atendentesAtivos.push(atendente);
    }

    return atendentesAtivos;
}

function getStatusAtendente(email) {
    const user = userService.getUserByEmail(email);
    let status = " (offline)";

    if (user && user.length > 0)
        status = "";

    return status;
}

function ordenaAtendentes(a, b) {
    if (a.nome < b.nome) return -1;
    if (a.nome > b.nome) return 1;
    return 0;
}