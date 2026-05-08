const moment = require('moment');
moment.locale("pt-br");

const ResponseHttp = require('../entities/responseHttp');
const Atendimento = require('../entities/atendimento');
const AtendimentoAtividade = require('../entities/atendimentoAtividade');
const AtendimentoMensagem = require('../entities/atendimentoMensagem');
const Equipe = require('../entities/equipe');

const responseTypeEnum = require('../enums/responseTypeEnum');
const httpCodeEnum = require('../enums/httpCodeEnum');
const statusEnum = require('../enums/statusEnum');
const atividadeEnum = require('../enums/atividadeEnum');
const formatoMensagemEnum = require('../enums/formatoMensagemEnum');
const filaEnum = require('../enums/filaEnum');
const blipStatusEnum = require("../enums/blip/statusEnum");

const blipApiService = require('./blip/apiService');
const blipStatusService = require('./blip/statusService');

const commonService = require('./common/commonService');
const notificationService = require('./common/notificationService');
const validationService = require('./common/validationService');

const contatoService = require('./contatoService');
const atendimentoMensagemService = require('./atendimentoMensagemService');
const atendimentoAtividadeService = require('./atendimentoAtividadeService');

const canalProvider = require('../providers/canalProvider');

const atendimentoRepository = require('../repositories/atendimentoRepository');
const atendimentoAtividadeRepository = require('../repositories/atendimentoAtividadeRepository');
const atendimentoMensagemRepository = require('../repositories/atendimentoMensagemRepository');
const contatoRepository = require('../repositories/contatoRepository');
const atendenteRepository = require('../repositories/atendenteRepository');
const equipeRepository = require('../repositories/equipeRepository');
const equipeAtendenteRepository = require('../repositories/equipeAtendenteRepository');
const departamentoAtendenteRepository = require('../repositories/departamentoAtendenteRepository');
const departamentoRepository = require('../repositories/departamentoRepository');

const logService = require('./common/logService');
const departamentoEnum = require("../enums/departamentoEnum");
const contactService = require("./blip/contactService");
const userService = require('./external_access/userService');
const atendenteService = require('./atendenteService');

exports.getByTicketId = (ticketId) => getByTicketId(ticketId);
exports.getByTicketId = (ticketId) => getByTicketId(ticketId);
exports.count = (params) => count(params);
exports.getAll = (params, atendenteLogado) => getAll(params, atendenteLogado);
exports.getById = (atendimentoId, atendenteLogado) => getById(atendimentoId, atendenteLogado);
exports.getUltimoAtendimento = (blipContatoId) => getUltimoAtendimento(blipContatoId);
exports.getAtendimentoEmEspera = (identificadorContato) => getAtendimentoEmEspera(identificadorContato);

exports.create = (body) => create(body);
exports.setAtendimentoAoAtendentePadrao = (body) => setAtendimentoAoAtendentePadrao(body);

exports.atender = (io, atendimentoId, contatoId, atendenteId) => atender(io, atendimentoId, contatoId, atendenteId);
exports.finalizar = (io, atendimentoId, atendenteId) => finalizar(io, atendimentoId, atendenteId);
exports.transferir = (io, params) => transferir(io, params);
exports.redireciona = (io, params) => redireciona(io, params);
exports.setNota = (atendimentoId, nota) => setNota(atendimentoId, nota);

module.exports = exports;

async function getByTicketId(ticketId) {
    let atendimento = await atendimentoRepository.getByTicketId(ticketId);

    if (atendimento.id > 0) {
        atendimento.contato = await contatoRepository.get(atendimento.contato.id);

        if (atendimento.atendente.id > 0)
            atendimento.atendente = await atendenteRepository.get(atendimento.atendente.id);

        if (atendimento.equipe.id > 0)
            atendimento.equipe = await equipeRepository.get(atendimento.equipe.id);
    }

    return atendimento;
}

async function count(params) {
    params.canal = getParamsCanal(params.canal);

    let quantidadeAtendimentos = await atendimentoRepository.count(params);

    return quantidadeAtendimentos;
}

async function getAll(params, atendenteLogado) {
    const itensPorPagina = 30;
    const paginaInicio = params.paginaInicio ? params.paginaInicio : 0;
    const paginaFim = params.paginaFim ? params.paginaFim : 1;

    params.take = (paginaFim - paginaInicio) * itensPorPagina;
    params.skip = paginaInicio * itensPorPagina;
    params.canal = getParamsCanal(params.canal);

    let atendimentos = new Array();
    let atendimentosDb = await atendimentoRepository.getAll(params);
    if (atendimentosDb.length > 0) {
        atendimentos = await preparaAtendimentos(atendimentosDb, atendenteLogado);
    }

    return atendimentos;
}

async function getById(atendimentoId, atendenteLogado) {
    let atendimentoDb = await atendimentoRepository.getById(atendimentoId);
    let atendimento = await preparaAtendimento(atendimentoDb, atendenteLogado);

    return atendimento;
}

async function getUltimoAtendimento(blipContatoId) {
    const contato = await contatoService.get(blipContatoId)
    let ultimoAtendimento = new Atendimento();

    if (contato.id > 0) {
        let atendimentosDb = await atendimentoRepository.getByContatoId(contato.id);

        if (atendimentosDb.length > 0) {
            let atendimentoDb = atendimentosDb[atendimentosDb.length - 1];

            ultimoAtendimento = atendimentoDb;

            ultimoAtendimento = await preparaAtendimento(ultimoAtendimento, null);
        }
    }

    return ultimoAtendimento;
}

/**
 *  Verifica se existe um atendimento em espera para o contato
 * @param identificadorContato Número de WhatsApp ou Tunnel do contato no Router
 * @returns {Promise<ResponseHttp>}
 */
async function getAtendimentoEmEspera(identificadorContato) {
    await finalizaAtendimentosAguardandoAMaisde24horas();
    const ehNumeroWhatsapp = validationService.isValidBrazilianCellphone(identificadorContato);
    if (ehNumeroWhatsapp) {
        const contato = await contatoRepository.getPorNumeroWhatsapp(identificadorContato,);
        const fila = await verificaAtendimentoEmEspera(contato);
        return new ResponseHttp(httpCodeEnum.OK, "Atendimento em espera", fila.id);
    } else {
        const contato = await contatoRepository.getBlipContatoRoteadorId(identificadorContato);
        if (contato && contato.id > 0) {
            const fila = await verificaAtendimentoEmEspera(contato);
            return new ResponseHttp(httpCodeEnum.OK, "Atendimento em espera", fila.id);
        }
    }
    return new ResponseHttp(httpCodeEnum.OK, "Nenhum atendimento em espera.", filaEnum.nenhum.id);
}

/**
 * Finaliza atendimentos que estão aguardando a mais de 24 horas
 * @returns {Promise<void>}
 */
async function finalizaAtendimentosAguardandoAMaisde24horas() {
    const atendimentosAguardando = await atendimentoRepository.getAllAguardando();
    if (atendimentosAguardando.length > 0) {
        for (const atendimento of atendimentosAguardando) {
            const mensagens = await atendimentoMensagemRepository.getByAtendimentoId(atendimento.id);
            if (mensagens.length > 0) {
                const ultimaMensagem = mensagens[mensagens.length - 1];
                const dataUltimaMensagem = new moment(ultimaMensagem.dataHora);
                const now = new moment();
                const diff = now.diff(dataUltimaMensagem, 'hours');
                if (diff > 23) {
                    atendimento.status = statusEnum.finalizado;
                    await atendimentoRepository.updateStatus(atendimento.id, statusEnum.finalizado);
                }
            }
        }
    }
}

async function verificaAtendimentoEmEspera(contato) {
    const atendimentosNaoFinalizados =
        await atendimentoRepository.getAguardandoPorContatoId(contato.id);
    if (atendimentosNaoFinalizados.length > 0) {
        const departamentosAtendente = await departamentoAtendenteRepository.getByAtendenteId(atendimentosNaoFinalizados[0].atendente.id);
        if (departamentosAtendente.length > 0) {
            let departamentoPrincipal = departamentosAtendente.find(d => d.principal === 1);
            departamentoPrincipal = departamentoPrincipal ? departamentoPrincipal : departamentosAtendente[0];
            if (departamentoPrincipal.departamento.id === departamentoEnum.suporte.id) return  filaEnum.suporte;
            else if (departamentoPrincipal.departamento.id === departamentoEnum.comercial.id) return filaEnum.vendas;
            else if (departamentoPrincipal.departamento.id === departamentoEnum.administrativo.id) return  filaEnum.financeiro;
        }
    }
    return filaEnum.nenhum;
}

async function create(body) {
    const ehTicket = body.id.toLowerCase().includes("ticket");
    if (!ehTicket) {
        return new ResponseHttp(httpCodeEnum.NOT_FOUND, "Requisição não se trata de um atendimento.");
    }

    const content = body.content;
    const ticketId = content.id;
    const atendimentoDb = await getByTicketId(ticketId);
    if ((atendimentoDb.id > 0 && atendimentoDb.blipAtendimentoId) || atendimentoDb.status === statusEnum.finalizado) {
        return new ResponseHttp(httpCodeEnum.OK, "Atendimento criado.", atendimentoDb);
    }

    let atendimento;
    const contato = await createContato(content);
    const atendimentosNaoFinalizados = await atendimentoRepository.getAguardandoPorContatoId(contato.id);
    if (atendimentosNaoFinalizados.length === 1) {
        const atendimentoNaoFinalizado = atendimentosNaoFinalizados[0];
        if (atendimentoNaoFinalizado && atendimentoNaoFinalizado.id > 0) {
            atendimentoNaoFinalizado.contato = contato;
            const resultado = await vinculaComAtendimentoAberto(atendimentoNaoFinalizado, content);
            if (resultado.sucesso) {
                return new ResponseHttp(httpCodeEnum.OK, "Atendimento vinculado.", resultado.atendimento);
            }
        }
    }

    atendimento = await createAtendimento(content);
    atendimento.contato = contato;
    if (contato.id > 0) {
        const resAtendimento = await addAtendimento(atendimento);
        if (resAtendimento.type === responseTypeEnum.success) {
            atendimento.id = resAtendimento.content.insertId;
        }
    }
    return new ResponseHttp(httpCodeEnum.OK, "Atendimento criado.", atendimento);
}

async function setAtendimentoAoAtendentePadrao(body) {
    const content = body.content;
    const ticketId = content.id;

    await blipApiService.assignTicketToAnAgent(
        ticketId,
        process.env.BLIP_AGENT_DEFAULT,
        "open"
    );
}

async function atender(io, atendimentoId, contatoId, atendenteId) {
    let atendimento = await atendimentoRepository.getById(atendimentoId);

    if (atendimento.id > 0 &&
        atendimento.status &&
        atendimento.status.intern.id === statusEnum.atendendo.id
    ) {
        return new ResponseHttp(httpCodeEnum.BAD_REQUEST, "Atendimento já em andamento.");
    }

    const atendente = await atendenteRepository.get(atendenteId);
    const equipePadraoAtendente = (await equipeAtendenteRepository.getByAtendenteId(atendente.id)).filter(e => e.principal)[0];
    const departamentoPadraoAtendente = (await departamentoAtendenteRepository.getByAtendenteId(atendente.id)).filter(d => d.principal)[0];

    const contato = await contatoRepository.get(contatoId);

    atendimento.atendente = atendente;
    atendimento.contato = contato;

    const ticketId = atendimento.blipAtendimentoId;
    if (ticketId !== "") {
        const atendimentoAtividade = geraAtendimentoAtividadeAtendeu(atendimento);

        await atendimentoAtividadeService.add(atendimentoAtividade);
        await atendimentoRepository.updateAtendendo(
            atendimentoId,
            atendimento.atendente,
            !equipePadraoAtendente ||equipePadraoAtendente.equipe.id === 0 ? null : equipePadraoAtendente.equipe.id,
            !departamentoPadraoAtendente || departamentoPadraoAtendente.departamento.id === 0 ? null : departamentoPadraoAtendente.departamento.id
        );


        let conteudo = await getConteudoAtendimento(atendimento);

        let atendimentoMensagem = geraAtendimentoMensagem(atendimento,
            formatoMensagemEnum.texto,
            conteudo
        );

        await atendimentoMensagemService.send(io, atendimentoMensagem);

        if (io)
            notificationService.sendAll(io, "START", atendimentoId);

        return new ResponseHttp(httpCodeEnum.OK, "Atendimento atribuído com sucesso.");
    } else {
        return new ResponseHttp(httpCodeEnum.NOT_FOUND, "Erro ao recuperar o atendimento na base do BLiP.");
    }
}

async function finalizar(io, atendimentoId, atendenteId) {
    let atendimento = await atendimentoRepository.getById(atendimentoId);
    const atendente = await atendenteRepository.get(atendenteId);

    atendimento.atendente = atendente;

    const ticketId = atendimento.blipAtendimentoId;
    if (ticketId !== "") {
        const responseClose = await blipApiService.changeStatus(ticketId, "closedattendant");
        let atendimentoJaFechado = false;

        if (responseClose.code === 401 && responseClose.data.reason && responseClose.data.reason.code === 64) {
            atendimentoJaFechado = true;
        }

        if (responseClose.code === httpCodeEnum.OK || atendimentoJaFechado) {
            const atendimentoAtividade = geraAtendimentoAtividadeFinalizou(atendimento);

            await atendimentoAtividadeService.add(atendimentoAtividade);
            await atendimentoRepository.updateStatus(atendimentoId, statusEnum.finalizado);

            if (io)
                notificationService.sendAll(io, "END", atendimentoId);

            return new ResponseHttp(httpCodeEnum.OK, "Atendimento finalizado com sucesso.");
        } else {
            return new ResponseHttp(httpCodeEnum.UNAUTHORIZED, "Ocorreu um erro ao finalizar o atendimento.");
        }
    } else {
        return new ResponseHttp(httpCodeEnum.NOT_FOUND, "Erro ao recuperar o atendimento na base do BLiP.");
    }
}

async function transferir(io, params) {
    // Converte IDs para número para evitar comparações incorretas
    let atendimentoId = Number(commonService.isNull(params.atendimentoId, 0));
    let equipeId = Number(commonService.isNull(params.equipeId, 0));
    let departamentoId = Number(commonService.isNull(params.departamentoId, 0));
    let atendenteId = Number(commonService.isNull(params.atendenteId, 0));
    let atendenteLogadoId = Number(commonService.isNull(params.atendenteLogadoId, 0));

    const atendimentoDb = await atendimentoRepository.getById(atendimentoId);
    let atendimento = Object.assign({}, atendimentoDb);

    if (atendenteLogadoId && atendenteLogadoId > 0)
        atendimento.atendente = await atendenteRepository.get(atendenteLogadoId);

    const responseTransferenciaValidada = await getResponseTransferenciaValidada(atendimentoDb, departamentoId, equipeId, atendenteId)

    if (responseTransferenciaValidada.httpCode === httpCodeEnum.OK) {
        const atendimentoAtividade = geraAtendimentoAtividadeTransferiu(atendimento, equipeId, departamentoId, atendenteId);

        await atendimentoAtividadeService.add(atendimentoAtividade);
        await atendimentoRepository.updateTransferir(atendimentoId, atendenteId, equipeId, departamentoId);

        if (io) {
            notificationService.sendAll(io, "TRANSFER", atendimentoId);

            if (atendenteId && atendenteId > 0) {
                const atendente = await atendenteRepository.get(atendenteId);
                if (atendente && atendente.email) {
                    const sockets = userService.getUserByEmail(decodeURI(atendente.email));
                    const mensagem = `Atendimento #${atendimentoId} transferido para você.`;
                    sockets.forEach(socket => {
                        notificationService.sendNewEvent(io, socket.socketId, "new-ticket", {
                            mensagem: mensagem,
                            atendimentoId: atendimentoId
                        });
                    });
                }
            } else if (equipeId && equipeId > 0) {
                const atendentes = await atendenteService.getByEquipeId(equipeId);
                const mensagem = `Atendimento #${atendimentoId} transferido para sua equipe.`;
                // Notifica somente quem tem essa equipe como principal
                atendentes
                    .filter(a => Number(a.equipePrincipalId) === equipeId)
                    .forEach(atendente => {
                        if (atendente && atendente.email) {
                            const sockets = userService.getUserByEmail(decodeURI(atendente.email));
                            sockets.forEach(socket => {
                                notificationService.sendNewEvent(io, socket.socketId, "new-ticket", {
                                    mensagem: mensagem,
                                    atendimentoId: atendimentoId
                                });
                            });
                        }
                    });
            } else if (departamentoId && departamentoId > 0) {
                const atendentes = await atendenteService.getList(0, departamentoId);
                const mensagem = `Atendimento #${atendimentoId} transferido para seu departamento.`;
                // Notifica apenas os usuários com esse departamento como principal
                atendentes
                    .filter(a => Number(a.departamentoPrincipalId) === departamentoId)
                    .forEach(atendente => {
                        if (atendente && atendente.email) {
                            const sockets = userService.getUserByEmail(decodeURI(atendente.email));
                            sockets.forEach(socket => {
                                notificationService.sendNewEvent(io, socket.socketId, "new-ticket", {
                                    mensagem: mensagem,
                                    atendimentoId: atendimentoId
                                });
                            });
                        }
                    });
            }
        }

        return new ResponseHttp(httpCodeEnum.OK, "Atendimento transferido com sucesso.");
    } else {
        return responseTransferenciaValidada;
    }
}

async function redireciona(io, params) {
    let atendimentoId = commonService.isNull(params.atendimentoId, 0);
    let equipeId = commonService.isNull(params.equipeId, 0)
    let departamentoId = commonService.isNull(params.departamentoId, 0)
    let atendenteId = commonService.isNull(params.atendenteId, 0);

    await atendimentoRepository.updateRedireciona(atendimentoId, atendenteId, equipeId, departamentoId);

    if (io)
        notificationService.sendAll(io, "REDIRECT", atendimentoId);

    return new ResponseHttp(httpCodeEnum.OK, "Atendimento redirecionado com sucesso.");
}

async function setNota(atendimentoId, nota) {
    await atendimentoRepository.updateNota(atendimentoId, nota);
    return new ResponseHttp(httpCodeEnum.OK, "Nota atribuída ao atendimento com sucesso.");
}

async function createContato(content) {
    return await contatoService.get(content.customerIdentity);
}

async function addAtendimento(atendimento) {
    const responseAdd = await atendimentoRepository.add(atendimento);

    if (responseAdd.type === responseTypeEnum.success) {
        atendimento.id = responseAdd.content.insertId;
    }

    return responseAdd;
}

async function createAtendimento(content) {
    let atendimento = new Atendimento()
    let equipe = await getEquipeByTeam(content.team);

    atendimento.blipAtendimentoId = content.id;
    atendimento.dataHora = new Date();
    atendimento.status = await blipStatusService.get(content.status);
    atendimento.equipe = equipe;
    atendimento.departamento.id = equipe.departamentoId;

    return atendimento;
}

async function vinculaComAtendimentoAberto(atendimento, content) {
    atendimento.blipAtendimentoId = content.id;
    atendimento.status = blipStatusEnum.open;

    const resultado = await atendimentoRepository.updateRetornoNotificacaoAtiva(
        atendimento.id, atendimento.blipAtendimentoId, statusEnum.atendendo.id);
    const sucesso = resultado.type.id === responseTypeEnum.success.id;
    return {
        sucesso: sucesso,
        atendimento: atendimento
    };
}

async function getEquipeByTeam(teamName) {
    let equipe = new Equipe();

    if (teamName) {
        equipe = await equipeRepository.getByNome(teamName);
    }

    return equipe;
}

async function preparaAtendimentos(atendimentos, atendenteLogado) {
    for (let i = 0; i < atendimentos.length; i++) {
        atendimentos[i] = await preparaAtendimento(atendimentos[i], atendenteLogado);
    }

    atendimentos.sort((a, b) => new Date(b.dataUltimaMensagem) - new Date(a.dataUltimaMensagem));

    return atendimentos;
}

async function preparaAtendimento(atendimento, atendenteLogado) {
    atendimento.contato = await contatoRepository.get(atendimento.contato.id);
    atendimento.mensagens = await atendimentoMensagemService.getByAtendimento(atendimento);

    if (atendimento.mensagens.length > 0) {
        atendimento.quantidadeMensagensNaoRespondidas = atendimentoMensagemService.getQuantidadeMensagensNaoRespondidas(atendimento.mensagens);
        atendimento.dataUltimaMensagem = atendimentoMensagemService.getDataHoraUltimaMensagem(atendimento);
        atendimento.dataUltimaMensagemRecebida = atendimentoMensagemService.getDataHoraUltimaMensagemRecebida(atendimento);
    }

    if (atendimento.atendente.id > 0)
        atendimento.atendente = await atendenteRepository.get(atendimento.atendente.id);

    if (atendimento.equipe.id > 0)
        atendimento.equipe = await equipeRepository.get(atendimento.equipe.id);

    if (atendimento.departamento.id > 0)
        atendimento.departamento = await departamentoRepository.get(atendimento.departamento.id);

    atendimento.desabilitaChatRegraWhatsApp = desabilitaChatRegraWhatsApp(atendimento);
    atendimento.desabilitaChatRegraAtendente = desabilitaChatRegraAtendente(atendimento, atendenteLogado);
    atendimento.desabilitaChatRegraNotificaoAtiva = atendimento.status.intern.id === statusEnum.aguardando.id;
    atendimento.permiteAtender = await permiteAtender(atendimento, atendenteLogado);
    atendimento.habilitaTransferencia = habilitaTransferencia(atendimento);

    return atendimento;
}

function habilitaTransferencia(atendimento) {
    const atendimentoFinalizado = atendimento.status.intern.id === statusEnum.finalizado.id;
    return !atendimentoFinalizado;
}

function desabilitaChatRegraWhatsApp(atendimento) {
    if (atendimento.contato.canal.idString === "whatsapp" ||
        atendimento.contato.canal.idString === "messenger") {

        if (atendimento.mensagens.length === 0) {
            const inicioDaConversa = new moment(atendimento.dataHora);
            const now = new moment();
            const diff = now.diff(inicioDaConversa, 'minutes');

            if (diff > process.env.BLIP_MAX_TIME_SEND_MESSAGE_WP) {
                return true;
            }

            return false;
        }

        const ultimaMensagemRecebida = new moment(atendimento.dataUltimaMensagemRecebida);
        const now = new moment();
        const diff = now.diff(ultimaMensagemRecebida, 'minutes');

        if (diff > process.env.BLIP_MAX_TIME_SEND_MESSAGE_WP) {
            return true;
        }
    }

    return false;
}

function desabilitaChatRegraAtendente(atendimento, atendenteLogado) {
    if (!(atendimento.atendente.id) && atendimento.status.intern.id === statusEnum.atendendo.id)
    {
        return true;
    }

    return atendimento.atendente.id > 0 &&
        atendenteLogado &&
        atendimento.atendente.id !== atendenteLogado.id;
}

async function permiteAtender(atendimento, atendenteLogado) {
    const atendimentoDefinidoAoAtendenteLogado =
        (atendimento.atendente && atendenteLogado && atendimento.atendente.id === atendenteLogado.id);

    const atendimentoDefinidoParaAtendente = atendimento.atendente.id > 0;

    const atendimentoStatusPendente = atendimento.status.intern.id === statusEnum.pendente.id;

    const oAtendenteEstaNaEquipe =
        atendenteLogado ? await atendenteEstaNaEquipe(atendenteLogado.id, atendimento.equipe.id) : false;

    const oAtendenteEstaNoDepartamento =
        atendenteLogado ? await atendenteEstaNoDepartamento(atendenteLogado.id, atendimento.departamento.id) : false;

    return atendenteLogado &&
        (atendimentoDefinidoAoAtendenteLogado  || (atendimentoStatusPendente && !atendimentoDefinidoParaAtendente)) ||
        (atendimentoDefinidoAoAtendenteLogado || (oAtendenteEstaNaEquipe && !atendimentoDefinidoParaAtendente)) ||
        (atendimentoDefinidoAoAtendenteLogado || (oAtendenteEstaNoDepartamento && !atendimentoDefinidoParaAtendente));
}

function getSaudations() {
    const date = new Date();
    const time = date.getHours();

    if (time < 12)
        return "Bom dia";
    if (time >= 12 && time < 18)
        return "Boa tarde";
    if (time >= 18)
        return "Boa noite";

    return "";
}

function geraAtendimentoAtividadeAtendeu(atendimento) {
    let atendimentoAtividade = new AtendimentoAtividade();

    atendimentoAtividade.atendimento.id = atendimento.id;
    atendimentoAtividade.atendente.id = atendimento.atendente.id;
    atendimentoAtividade.atividade = atividadeEnum.atendeu;

    return atendimentoAtividade;
}

function geraAtendimentoAtividadeFinalizou(atendimento) {
    let atendimentoAtividade = new AtendimentoAtividade();

    atendimentoAtividade.atendimento.id = atendimento.id;
    atendimentoAtividade.atendente.id = atendimento.atendente.id;
    atendimentoAtividade.atividade = atividadeEnum.finalizou;

    return atendimentoAtividade;
}

function geraAtendimentoAtividadeTransferiu(atendimento, equipeId, departamentoId, atendenteId) {
    let atendimentoAtividade = new AtendimentoAtividade();

    atendimentoAtividade.atendimento.id = atendimento.id;
    atendimentoAtividade.atendente.id = atendimento.atendente.id;
    atendimentoAtividade.atividade = atividadeEnum.transferiu;
    atendimentoAtividade.transferenciaEquipe.id = equipeId;
    atendimentoAtividade.transferenciaDepartamento.id = departamentoId;
    atendimentoAtividade.transferenciaAtendente.id = atendenteId;

    return atendimentoAtividade;
}

function geraAtendimentoMensagem(atendimento, tipo, conteudo) {
    let atendimentoMensagem = new AtendimentoMensagem();

    atendimentoMensagem.atendimento = atendimento;
    atendimentoMensagem.equipe = atendimento.equipe;
    atendimentoMensagem.atendente = atendimento.atendente;
    atendimentoMensagem.recebido = false;
    atendimentoMensagem.formato = tipo;
    atendimentoMensagem.conteudo = conteudo;

    return atendimentoMensagem;
}

function getParamsCanal(canal) {
    try {
        if (canal.id && canal.id > 0) {
            return canal;
        }

        return canal !== "all" ? canalProvider.getByIdString(canal) : {
            id: 0
        }
    } catch (error) {
        return {
            id: 0
        }
    }
}

async function getConteudoAtendimento(atendimento) {
    let conteudo = `Olá, ${atendimento.contato.nome}! ${getSaudations()}! Meu nome é ${atendimento.atendente.nome}. Em que posso ajudar?`

    if (await houveMensagemDeUmAtendenteHumano(atendimento.id))
        conteudo = `Olá, ${atendimento.contato.nome}! ${getSaudations()}! Meu nome é ${atendimento.atendente.nome}. Vou continuar seu atendimento.`

    return conteudo;
}

async function houveMensagemDeUmAtendenteHumano(atendimentoId) {
    const mensagens = await atendimentoMensagemRepository.getByAtendimentoId(atendimentoId);
    if (!mensagens) return false;

    const teveMensagemDeAtendentes = mensagens.find(a => a.atendente.id > 0);

    return !!teveMensagemDeAtendentes;
}

async function houveTransferencia(atendimentoId) {
    const atividades = await atendimentoAtividadeRepository.getByAtendimentoId(atendimentoId);
    const atividadeTransferencia = atividades.find(a => a.atividade === atividadeEnum.transferiu.id);

    return !!atividadeTransferencia;
}

async function atendenteEstaNaEquipe(atendenteId, equipeId) {
    const equipesAtendente = await equipeAtendenteRepository.getByAtendenteId(atendenteId);
    const equipeAtendente = equipesAtendente.find(e => e.equipe.id === equipeId);

    return equipeAtendente && equipeAtendente.equipe.id === equipeId ? true : false;
}

async function atendenteEstaNoDepartamento(atendenteId, departamentoId) {
    const departamentosAtendente = await departamentoAtendenteRepository.getByAtendenteId(atendenteId);
    const departamentoAtendente = departamentosAtendente.find(d => d.departamento.id === departamentoId);

    return departamentoAtendente && departamentoAtendente.departamento.id === departamentoId ? true : false;
}

async function getResponseTransferenciaValidada(atendimentoDb, departamentoId, equipeId, atendenteId) {
    let responseHttp = new ResponseHttp(httpCodeEnum.OK);

    if (equipeId > 0) {
        let equipeDb = await equipeRepository.get(equipeId);

        if (departamentoId === 0 && equipeDb.departamentoId > 0) {
            responseHttp = new ResponseHttp(httpCodeEnum.BAD_REQUEST, "Por favor informe o departamento.");
        }
    }

    if (atendenteId > 0) {
        equipesDoAtendenteDb = await equipeAtendenteRepository.getByAtendenteId(atendenteId);
        departamentosDoAtendenteDb = await departamentoAtendenteRepository.getByAtendenteId(atendenteId);

        if (equipesDoAtendenteDb.length > 0 && equipeId === 0) {
            responseHttp = new ResponseHttp(httpCodeEnum.BAD_REQUEST, "Por favor informe a equipe.");
        }

        if (departamentosDoAtendenteDb.length > 0 && departamentoId === 0) {
            responseHttp = new ResponseHttp(httpCodeEnum.BAD_REQUEST, "Por favor informe o departamento.");
        }
    }

    if (atendenteId === 0 && equipeId === 0 && departamentoId === 0) {
        responseHttp = new ResponseHttp(httpCodeEnum.BAD_REQUEST, "Por favor informe uma das três opções: atendente, equipe e/ou departamento.");
    }

    if (atendenteId === atendimentoDb.atendente.id && equipeId === atendimentoDb.equipe.id && departamentoId === atendimentoDb.departamento.id) {
        responseHttp = new ResponseHttp(httpCodeEnum.BAD_REQUEST, "Atendimento já está para essa combinação de atendente/equipe/departamento.");
    }

    return responseHttp;
}