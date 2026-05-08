const axios = require('axios');
const mcache = require('memory-cache');

const Atendente = require('../../entities/atendente');
const Equipe = require('../../entities/equipe');
const EquipeAtendente = require('../../entities/equipeAtendente');
const Departamento = require('../../entities/departamento');
const DepartamentoAtendente = require('../../entities/departamentoAtendente');

const httpCodeEnum = require('../../enums/httpCodeEnum');
const tipoSincronizacaoEnum = require('../../enums/tipoSincronizacaoEnum');

const atendenteRepository = require('../../repositories/atendenteRepository');
const equipeRepository = require('../../repositories/equipeRepository');
const equipeAtendenteRepository = require('../../repositories/equipeAtendenteRepository');
const departamentoRepository = require('../../repositories/departamentoRepository');
const departamentoAtendenteRepository = require('../../repositories/departamentoAtendenteRepository');

const commonService = require('../common/commonService');
const fileService = require('../common/fileService');
const logService = require('../common/logService');

exports.processar = () => processar();
exports.start = () => start();
exports.status = () => status();

module.exports = exports;

const SYNC_INIT_KEY = "SYNC_INIT";
const SYNC_STATUS_KEY = "SYNC_STATUS";

async function processar() {
    if (syncIsRun() || process.env.HOMOLOGACAO == "true") {
        return false;
    }

    syncInit();
    setStatus({
        running: true,
        ok: null,
        error: null,
        stage: "init",
        startedAt: new Date().toISOString(),
        finishedAt: null
    });

    try {
        const ok = await processarImpl();
        setStatus({ ok, stage: ok ? "done" : "no-op" });
        return ok;
    } catch (err) {
        const mensagem = err && err.message ? err.message : String(err);
        logService.log2(`SYNC - ERRO - ${err && err.stack ? err.stack : mensagem}`);
        setStatus({ ok: false, error: mensagem, stage: "error" });
        return false;
    } finally {
        setStatus({ running: false, finishedAt: new Date().toISOString() });
        syncFinish();
    }
}

function start() {
    if (process.env.HOMOLOGACAO == "true") {
        return { started: false, disabled: true, status: status() };
    }

    if (syncIsRun()) {
        return { started: false, disabled: false, status: status() };
    }

    syncInit();
    setStatus({
        running: true,
        ok: null,
        error: null,
        stage: "init",
        startedAt: new Date().toISOString(),
        finishedAt: null
    });

    setImmediate(async () => {
        try {
            const ok = await processarImpl();
            setStatus({ ok, stage: ok ? "done" : "no-op" });
        } catch (err) {
            const mensagem = err && err.message ? err.message : String(err);
            logService.log2(`SYNC - ERRO - ${err && err.stack ? err.stack : mensagem}`);
            setStatus({ ok: false, error: mensagem, stage: "error" });
        } finally {
            setStatus({ running: false, finishedAt: new Date().toISOString() });
            syncFinish();
        }
    });

    return { started: true, disabled: false, status: status() };
}

function status() {
    return getStatus();
}

async function processarImpl() {
    setStatus({ stage: "fetch" });

    const response = await apiSommusGestorGetListas();
    if (!response || response.code !== httpCodeEnum.OK) {
        return false;
    }

    const data = response.data;
    let colaboradoresSommusGestor = data ? data.Colaboradores : [];
    let equipesSommusGestor = data ? data.Equipes : [];
    let departamentosSommusGestor = data ? data.Departamentos : [];

    colaboradoresSommusGestor = dedupeList(colaboradoresSommusGestor);
    equipesSommusGestor = dedupeList(equipesSommusGestor);
    departamentosSommusGestor = dedupeList(departamentosSommusGestor);

    if (!data || (
        colaboradoresSommusGestor.length === 0 &&
        equipesSommusGestor.length === 0 &&
        departamentosSommusGestor.length === 0
    )) {
        return true;
    }

    const atendentes = await atendenteRepository.getAll();
    const departamentos = await departamentoRepository.getAll();
    const equipes = await equipeRepository.getAll();

    const atendentesAProcessar = await getAtendentesAProcessar(colaboradoresSommusGestor, atendentes);
    const departamentosAProcessar = await getDepartamentosAProcessar(departamentosSommusGestor, departamentos);
    const equipesAProcessar = await getEquipesAProcessar(equipesSommusGestor, equipes);

    setStatus({ stage: "atendentes" });
    await processaAtendentes(atendentesAProcessar);

    setStatus({ stage: "departamentos" });
    await processaDepartamentos(departamentosAProcessar);

    setStatus({ stage: "equipes" });
    await processaEquipes(equipesAProcessar, departamentosAProcessar);

    setStatus({ stage: "departamentos-atendentes" });
    await processaDepartamentosAtendentes(departamentosAProcessar, atendentesAProcessar);

    setStatus({ stage: "equipes-atendentes" });
    await processaEquipesAtendentes(equipesAProcessar, atendentesAProcessar);

    return true;
}

async function apiSommusGestorGetListas() {
    let response = null;

    await axios({
        method: 'get',
        url: `${process.env.SOMMUSGESTOR_API}/api/sommusblip`,
        headers: {
            "Authorization": "1d3908edde3b55d5663a7831cf3acfff"
        },
        timeout: 5000
    })
        .then(function (res) {
            response = {
                code: res.status,
                mensagem: "",
                data: res.data
            };
        })
        .catch(function (error) {
            if (error.response) {
                response = {
                    code: error.response.status,
                    mensagem: error.response.data
                }
            } else if (error.request) {
                response = {
                    code: 400,
                    mensagem: error.request
                }
            } else {
                response = {
                    code: 400,
                    mensagem: error.message
                }
            }
        });

    return response;
}

async function getAtendentesAProcessar(colaboradoresSommusGestor, atendentesDb) {
    let atendentesAProcessar = new Array();

    colaboradoresSommusGestor = colaboradoresSommusGestor.sort((a, b) => a.Id - b.Id);

    // Dedupe collaborators by Id
    const map = new Map();
    colaboradoresSommusGestor.forEach(item => map.set(item.Id, item));
    colaboradoresSommusGestor = Array.from(map.values());

    colaboradoresSommusGestor.forEach(colaboradorSommusGestor => {
        atendentesAProcessar.push({
            tipo: tipoSincronizacaoEnum.adicionar,
            sommusBlipId: 0,
            sommusBlipUrlFoto: "",
            colaborador: colaboradorSommusGestor
        })
    });

    atendentesDb.forEach(atendenteDb => {
        const findIndex = atendentesAProcessar.findIndex(e =>
            e.colaborador && e.colaborador.Id == atendenteDb.sommusGestorId);

        if (findIndex >= 0) {
            atendentesAProcessar[findIndex].tipo = tipoSincronizacaoEnum.atualizar;
            atendentesAProcessar[findIndex].sommusBlipId = atendenteDb.id;
            atendentesAProcessar[findIndex].sommusBlipUrlFoto = atendenteDb.urlFoto;
        } else {
            atendentesAProcessar.push({
                tipo: tipoSincronizacaoEnum.excluir,
                sommusBlipId: atendenteDb.id,
                sommusBlipUrlFoto: "",
                colaborador: undefined
            })
        }
    });

    return atendentesAProcessar;
}

async function getEquipesAProcessar(equipesSommusGestor, equipesDb) {
    let equipesAProcessar = new Array();

    equipesSommusGestor = equipesSommusGestor.sort((a, b) => a.Id - b.Id);

    // Dedupe teams by Id
    const map = new Map();
    equipesSommusGestor.forEach(item => map.set(item.Id, item));
    equipesSommusGestor = Array.from(map.values());

    equipesSommusGestor.forEach(equipeSommusGestor => {
        equipesAProcessar.push({
            tipo: tipoSincronizacaoEnum.adicionar,
            sommusBlipId: 0,
            equipe: equipeSommusGestor
        })
    });

    equipesDb.forEach(equipeDb => {
        const findIndex = equipesAProcessar.findIndex(e =>
            e.equipe && e.equipe.Id == equipeDb.sommusGestorId);

        if (findIndex >= 0) {
            equipesAProcessar[findIndex].sommusBlipId = equipeDb.id;
            equipesAProcessar[findIndex].tipo = tipoSincronizacaoEnum.atualizar;
        } else {
            equipesAProcessar.push({
                sommusBlipId: equipeDb.id,
                tipo: tipoSincronizacaoEnum.excluir,
                equipe: undefined
            })
        }
    });

    return equipesAProcessar;
}

async function getDepartamentosAProcessar(departamentosSommusGestor, departamentosDb) {
    let departamentosAProcessar = new Array();

    departamentosSommusGestor = departamentosSommusGestor.sort((a, b) => a.Id - b.Id);

    // Dedupe departments by Id
    const mapDeps = new Map();
    departamentosSommusGestor.forEach(item => mapDeps.set(item.Id, item));
    departamentosSommusGestor = Array.from(mapDeps.values());

    departamentosSommusGestor.forEach(departamentoSommusGestor => {
        departamentosAProcessar.push({
            tipo: tipoSincronizacaoEnum.adicionar,
            sommusBlipId: 0,
            departamento: departamentoSommusGestor
        })
    });

    departamentosDb.forEach(departamentoDb => {
        const findIndex = departamentosAProcessar.findIndex(e =>
            e.departamento && e.departamento.Id == departamentoDb.sommusGestorId);

        if (findIndex >= 0) {
            departamentosAProcessar[findIndex].sommusBlipId = departamentoDb.id;
            departamentosAProcessar[findIndex].tipo = tipoSincronizacaoEnum.atualizar;
        } else {
            departamentosAProcessar.push({
                sommusBlipId: departamentoDb.id,
                tipo: tipoSincronizacaoEnum.excluir,
                departamento: undefined
            })
        }
    });

    return departamentosAProcessar;
}

async function processaAtendentes(atendentesAProcessar) {
    for (let i = 0; i < atendentesAProcessar.length; i++) {
        const atendenteAProcessar = atendentesAProcessar[i];

        const sommusBlipId = atendenteAProcessar.sommusBlipId;
        const colaboradorSommusGestor = atendenteAProcessar.colaborador;
        const usuarioSommusGestor = colaboradorSommusGestor ? colaboradorSommusGestor.Usuario : null;
        const tipo = atendenteAProcessar.tipo;

        if (tipo != tipoSincronizacaoEnum.excluir &&
            (!usuarioSommusGestor || usuarioSommusGestor.Id == 0))
            continue;

        logService.log2(`SYNC - ATENDENTES - ${usuarioSommusGestor ? usuarioSommusGestor.Nome : ""} - INICIADO `);

        let atendente = new Atendente();
        atendente.id = commonService.isNull(sommusBlipId, 0);
        atendente.sommusGestorId = colaboradorSommusGestor ? colaboradorSommusGestor.Id : 0;
        atendente.nome = usuarioSommusGestor ? usuarioSommusGestor.Nome : "";
        atendente.email = usuarioSommusGestor ? usuarioSommusGestor.Email : "";
        atendente.urlFoto = usuarioSommusGestor ? usuarioSommusGestor.UrlFoto : "";

        if (atendente.urlFoto) {
            const conteudo = await fileService.downloadAndSendS3(`${atendente.id}`, {
                uri: atendente.urlFoto,
                fileName: `${atendente.email.replace("@", "_")}`,
                title: `Foto de perfil ${atendente.nome}`
            }, "atendentes");

            atendente.urlFoto = conteudo.uri;
        }

        if (tipo == tipoSincronizacaoEnum.adicionar) {
            const id = await atendenteRepository.add(atendente);
            atendentesAProcessar[i].sommusBlipId = id.content.insertId;
        } else if (tipo == tipoSincronizacaoEnum.atualizar) {
            await atendenteRepository.update(atendente);
        } else if (tipo == tipoSincronizacaoEnum.excluir) {
            await atendenteRepository.delete(atendente.id);
        }

        if (atendente.id) {
            await equipeAtendenteRepository.deleteByAtendenteId(atendente.id);
            await departamentoAtendenteRepository.deleteByAtendenteId(atendente.id);
        }

        logService.log2(`SYNC - ATENDENTES - ${usuarioSommusGestor ? usuarioSommusGestor.Nome : ""} - FINALIZADO `);
    }
}

async function processaEquipes(equipesAProcessar, departamentosAProcessar) {
    for (let i = 0; i < equipesAProcessar.length; i++) {
        const equipeAProcessar = equipesAProcessar[i];

        const sommusBlipId = equipeAProcessar.sommusBlipId;
        const equipeSommusGestor = equipeAProcessar.equipe;
        const indexDepartamento = departamentosAProcessar.findIndex(d => equipeSommusGestor && d.departamento.Id == equipeSommusGestor.Departamento.Id);
        const tipo = equipeAProcessar.tipo;

        let equipe = new Equipe();
        equipe.id = commonService.isNull(sommusBlipId, 0);
        equipe.sommusGestorId = equipeSommusGestor ? equipeSommusGestor.Id : 0;
        equipe.nome = equipeSommusGestor ? equipeSommusGestor.Nome : "";
        equipe.departamentoId = indexDepartamento >= 0 ? departamentosAProcessar[indexDepartamento].sommusBlipId : 0;

        if (tipo == tipoSincronizacaoEnum.adicionar) {
            const id = await equipeRepository.add(equipe);
            equipesAProcessar[i].sommusBlipId = id.content.insertId;
        } else if (tipo == tipoSincronizacaoEnum.atualizar) {
            await equipeRepository.update(equipe);
        } else if (tipo == tipoSincronizacaoEnum.excluir) {
            await equipeRepository.delete(equipe.id);
        }
    }
}

async function processaDepartamentos(departamentosAProcessar) {
    for (let i = 0; i < departamentosAProcessar.length; i++) {
        const departamentoAProcessar = departamentosAProcessar[i];

        const sommusBlipId = departamentoAProcessar.sommusBlipId;
        const departamentoSommusGestor = departamentoAProcessar.departamento;
        const tipo = departamentoAProcessar.tipo;

        let departamento = new Departamento();
        departamento.id = commonService.isNull(sommusBlipId, 0);
        departamento.sommusGestorId = departamentoSommusGestor ? departamentoSommusGestor.Id : 0;
        departamento.nome = departamentoSommusGestor ? departamentoSommusGestor.Nome : "";

        if (tipo == tipoSincronizacaoEnum.adicionar) {
            const id = await departamentoRepository.add(departamento);
            departamentosAProcessar[i].sommusBlipId = id.content.insertId;
        } else if (tipo == tipoSincronizacaoEnum.atualizar) {
            await departamentoRepository.update(departamento);
        } else if (tipo == tipoSincronizacaoEnum.excluir) {
            await departamentoRepository.delete(departamento.id);
        }
    }
}

async function processaEquipesAtendentes(equipesAProcessar, atendentesAProcessar) {
    let equipesAtendentes = new Array();

    atendentesAProcessar.forEach(atendente => {
        const colaborador = atendente.colaborador;
        const atendenteId = atendente.sommusBlipId;

        if (colaborador && colaborador.Equipes && atendenteId > 0) {
            const equipes = colaborador.Equipes;

            equipes.forEach(equipe => {
                const equipeIndex = equipesAProcessar.findIndex(e =>
                    e.equipe && e.equipe.Id == equipe.Id);

                if (equipeIndex >= 0) {
                    const equipeAProcessar = equipesAProcessar[equipeIndex];

                    equipesAtendentes.push({
                        atendenteId: atendenteId,
                        equipeId: equipeAProcessar.sommusBlipId,
                        principal: equipe.Principal
                    })
                }
            });
        }
    });

    equipesAtendentes = dedupeVinculos(equipesAtendentes, e => `${e.equipeId}-${e.atendenteId}`);

    for (let i = 0; i < equipesAtendentes.length; i++) {
        const e = equipesAtendentes[i];

        let equipeAtendente = new EquipeAtendente();

        equipeAtendente.equipe.id = e.equipeId;
        equipeAtendente.atendente.id = e.atendenteId;
        equipeAtendente.principal = (e.principal ? true : false);

        await equipeAtendenteRepository.add(equipeAtendente);
    }
}

async function processaDepartamentosAtendentes(departamentosAProcessar, atendentesAProcessar) {
    let departamentosAtendentes = new Array();

    atendentesAProcessar.forEach(atendente => {
        const colaborador = atendente.colaborador;
        const atendenteId = atendente.sommusBlipId;

        if (colaborador && colaborador.Departamentos && atendenteId > 0) {
            const departamentos = colaborador.Departamentos;

            departamentos.forEach(departamento => {
                const departamentoIndex = departamentosAProcessar.findIndex(e =>
                    e.departamento && e.departamento.Id == departamento.Id);

                if (departamentoIndex >= 0) {
                    const departamentoAProcessar = departamentosAProcessar[departamentoIndex];

                    departamentosAtendentes.push({
                        atendenteId: atendenteId,
                        departamentoId: departamentoAProcessar.sommusBlipId,
                        principal: departamento.Principal
                    })
                }
            });
        }
    });

    departamentosAtendentes = dedupeVinculos(departamentosAtendentes, e => `${e.departamentoId}-${e.atendenteId}`);

    for (let i = 0; i < departamentosAtendentes.length; i++) {
        const e = departamentosAtendentes[i];

        let departamentoAtendente = new DepartamentoAtendente();

        departamentoAtendente.departamento.id = e.departamentoId;
        departamentoAtendente.atendente.id = e.atendenteId;
        departamentoAtendente.principal = (e.principal ? true : false);

        await departamentoAtendenteRepository.add(departamentoAtendente);
    }
}

function dedupeVinculos(items, keyFn) {
    const map = new Map();

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const key = keyFn(item);
        const existing = map.get(key);

        if (!existing) {
            map.set(key, { ...item });
            continue;
        }

        if (existing.principal || item.principal) {
            existing.principal = true;
        }
    }

    return Array.from(map.values());
}

function dedupeList(items) {
    if (!items || !items.length) return [];
    
    const map = new Map();
    items.forEach(item => {
        if (item && item.Id !== undefined) {
            map.set(item.Id, item);
        }
    });
    
    return Array.from(map.values());
}

function syncIsRun() {
    const cache = mcache.get(SYNC_INIT_KEY);
    return cache ? true : false;
}

function syncInit() {
    logService.log2("SYNC - INICOU");

    mcache.put(SYNC_INIT_KEY, "true", 60 * 60 * 1000, () => {
        logService.log(`CACHE EXPIRADO - SYNC-INIT`);
    });
}

function syncFinish() {
    logService.log2("SYNC - FINALIZOU");

    mcache.del(SYNC_INIT_KEY);
}

function syncCacheKey() {
    return SYNC_INIT_KEY;
}

function getStatus() {
    return mcache.get(SYNC_STATUS_KEY) || {
        running: syncIsRun(),
        ok: null,
        error: null,
        stage: null,
        startedAt: null,
        finishedAt: null
    };
}

function setStatus(next) {
    const current = getStatus();
    mcache.put(SYNC_STATUS_KEY, { ...current, ...next });
}
