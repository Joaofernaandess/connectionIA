const moment = require('moment');
moment.locale("pt-br");

const ResponseHttp = require('../entities/responseHttp');
const AtendimentoMensagem = require('../entities/atendimentoMensagem');

const responseTypeEnum = require('../enums/responseTypeEnum');
const formatoMensagemEnum = require('../enums/formatoMensagemEnum');
const httpCodeEnum = require('../enums/httpCodeEnum');

const blipApiService = require('./blip/apiService');
const fileService = require('./common/fileService');
const notificationService = require('./common/notificationService');
const stringService = require('./common/stringService');

const atendimentoService = require('./atendimentoService');
const redirecionamentoService = require('./redirecionamentoService');

const formatoMensagemProvider = require('../providers/formatoMensagemProvider');
const typeContentRequestProvider = require('../providers/typeContentRequestProvider');

const atendimentoMensagemRepository = require('../repositories/atendimentoMensagemRepository');
const redirecionamentoRepository = require('../repositories/redirecionamentoRepository');
const atendimentoRepository = require('../repositories/atendimentoRepository');
const atendenteRepository = require('../repositories/atendenteRepository');
const contatoRepository = require('../repositories/contatoRepository');

const logService = require('./common/logService');
const statusAtendimentoMesangemEnum = require("../enums/statusAtendimentoMensagemEnum");

exports.create = (body) => create(body);
exports.addMensagensAnteriores = (io, atendimento) => addMensagensAnteriores(io, atendimento);
exports.addMensagensPosteriores = (atendimento) => addMensagensPosteriores(atendimento);
exports.addNotificacaoAtiva = (atendimento, contato, atendenteId, modeloId, conteudo) => addNotificacaoAtiva(atendimento, contato, atendenteId, modeloId, conteudo);

exports.send = (io, atendimentoMensagem) => send(io, atendimentoMensagem);
exports.sendMensagemTexto = (io, atendimentoId, atendenteId, conteudo) => sendMensagemTexto(io, atendimentoId, atendenteId, conteudo);
exports.sendMensagemArquivo = (io, atendimentoId, atendenteId, arquivo) => sendMensagemArquivo(io, atendimentoId, atendenteId, arquivo);
exports.sendMensagemAudio = (io, atendimentoId, atendenteId, audio) => sendMensagemAudio(io, atendimentoId, atendenteId, audio);

exports.getByAtendimento = (atendimento) => getByAtendimento(atendimento);
exports.getQuantidadeMensagensNaoRespondidas = (mensagens) => getQuantidadeMensagensNaoRespondidas(mensagens);
exports.getDataHoraUltimaMensagem = (atendimento) => getDataHoraUltimaMensagem(atendimento);
exports.getDataHoraUltimaMensagemRecebida = (atendimento) => getDataHoraUltimaMensagemRecebida(atendimento);

module.exports = exports;

async function create(body) {
    const atendimentoMensagem = await createAtendimentoMensagemWebHook(body);

    if (!atendimentoMensagem || atendimentoMensagem.blipId === "") {
        return new ResponseHttp(httpCodeEnum.NO_CONTENT, "Mensagem ignorada.");
    }

    console.log("adicionando mensagem anterior " + atendimentoMensagem.blipId);
    console.log(JSON.stringify(atendimentoMensagem));

    try {
        const response = await addAtendimentoMensagem(atendimentoMensagem);
        return response;
    } catch (error) {
        logService.log(error);
        return new ResponseHttp(httpCodeEnum.INTERNAL_SERVER_ERROR, "Erro ao registrar a mensagem.");
    }
}

async function addMensagensAnteriores(io, atendimento) {
    const blipMessages = await blipApiService.getMessages(atendimento.blipAtendimentoId, 0, 100);

    if (blipMessages.code == httpCodeEnum.OK) {
        const messages = blipMessages.data.resource.items;

        let atendimentoMensagens = new Array();
        let idUltimaMensagem = getPosicaoUltimaMensagem(messages);

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];

            let add = true;
            if (i > idUltimaMensagem) {
                add = false;
            }

            if (add) {
                const atendimentoMensagemCriado = await createAtendimentoMensagem(atendimento, message);

                if (atendimentoMensagemCriado) {
                    atendimentoMensagens.push(atendimentoMensagemCriado);
                }
            }
        }

        atendimentoMensagens.reverse();

        for (let i = 0; i < atendimentoMensagens.length; i++) {
            const atendimentoMensagem = atendimentoMensagens[i];
            console.log("adicionando mensagem anterior " + atendimentoMensagem.blipId);
            console.log(JSON.stringify(atendimentoMensagem));
            await addAtendimentoMensagem(atendimentoMensagem);
        }

        await verificaMensagensRedirecionamento(io, atendimento, atendimentoMensagens);
    }
}

async function addMensagensPosteriores(atendimento) {
    const blipMessages = await blipApiService.getMessages(atendimento.blipAtendimentoId, 0, 100);

    if (blipMessages.code == httpCodeEnum.OK) {
        const messages = blipMessages.data.resource.items;

        let atendimentoMensagens = new Array();
        let ultimaMensagem = atendimento.mensagens[atendimento.mensagens.length - 1];
        let idUltimaMensagem = (ultimaMensagem.id > 0 ? ultimaMensagem.blipId : null);
        let temUltimaMensagemNaLista = messages.find(m => m.id == idUltimaMensagem);

        if (!temUltimaMensagemNaLista) {
            return;
        }

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];

            if (idUltimaMensagem && message.id == idUltimaMensagem) {
                break;
            }

            const atendimentoMensagemCriado = await createAtendimentoMensagem(atendimento, message);

            if (atendimentoMensagemCriado) {
                atendimentoMensagens.push(atendimentoMensagemCriado);
            }
        }

        atendimentoMensagens.reverse();

        for (let i = 0; i < atendimentoMensagens.length; i++) {
            const atendimentoMensagem = atendimentoMensagens[i];
            console.log("adicionando mensagem posterior " + atendimentoMensagem.blipId);
            console.log(JSON.stringify(atendimentoMensagem));
            await addAtendimentoMensagem(atendimentoMensagem);
        }
    }
}

async function send(io, atendimentoMensagem) {
    if (!atendimentoMensagem.conteudo || atendimentoMensagem.conteudo.trim() == "")
        return new ResponseHttp(httpCodeEnum.NOT_ACCEPTABLE, "");

    const resSendBlip = await blipApiService.sendMessage(atendimentoMensagem.atendimento.contato.blipId, atendimentoMensagem.conteudo);

    if (resSendBlip.code === httpCodeEnum.OK || resSendBlip.code === httpCodeEnum.ACCEPTED) {
        atendimentoMensagem.blipId = resSendBlip.blipId;

        let atendimento = atendimentoMensagem.atendimento;
        if (!atendimento.equipe || atendimento.equipe.id === 0)
            atendimento = await atendimentoRepository.getById(atendimentoMensagem.atendimento.id);

        atendimentoMensagem.equipe = atendimento.equipe;
        atendimentoMensagem.departamento = atendimento.departamento;
        atendimentoMensagem.status = statusAtendimentoMesangemEnum.processado;

        const responseHttp = await addAtendimentoMensagem(atendimentoMensagem);

        if (responseHttp.httpCode === httpCodeEnum.OK)
            notificationService.sendAll(io, "SEND", atendimento.id);

        return responseHttp;
    } else {
        return new ResponseHttp(httpCodeEnum.NOT_FOUND, "Ocorreu um erro ao enviar a mensagem de texto.");
    }
}

async function addNotificacaoAtiva(atendimento, contato, atendenteId, modeloId, conteudo) {
    let atendimentoMensagem = new AtendimentoMensagem();
    let atendente = await atendenteRepository.get(atendenteId);

    atendimentoMensagem.atendimento.id = atendimento.id;
    atendimentoMensagem.atendente.id = atendente.id;
    atendimentoMensagem.equipe.id = atendente.equipe.id;
    atendimentoMensagem.departamento.id = atendente.equipe.departamento.id;
    atendimentoMensagem.recebido = false;
    atendimentoMensagem.dataHora = new Date();
    atendimentoMensagem.formato = formatoMensagemEnum.texto;
    atendimentoMensagem.conteudo = conteudo;
    atendimentoMensagem.modeloId = modeloId;
    atendimentoMensagem.status = statusAtendimentoMesangemEnum.processado;

    if (!atendimentoMensagem.conteudo || atendimentoMensagem.conteudo.trim() === "") {
        return {
            sucesso: false,
            mensagem: "Mensagem não enviada. Conteúdo vazio."
        }
    }

    if (modeloId === 0) {
        return {
            sucesso: false,
            mensagem: "Mensagem não enviada. Modelo não encontrado."
        }
    }

    const response = await addAtendimentoMensagem(atendimentoMensagem);

    if (response.httpCode === httpCodeEnum.OK) {
        notificationService.sendAll(io, "SEND", atendimento.id);
        return {
            sucesso: true,
            mensagem: "Mensagem enviada com sucesso."
        }
    }

    return {
        sucesso: false,
        mensagem: "Mensagem não enviada. Ocorreu um erro ao salvar a mensagem."
    }
}

async function sendMensagemTexto(io, atendimentoId, atendenteId, conteudo) {
    let atendimentoMensagem = new AtendimentoMensagem();
    let atendimento = await atendimentoRepository.getById(atendimentoId);
    let atendente = await atendenteRepository.get(atendenteId);
    let contato = await contatoRepository.get(atendimento.contato.id);

    atendimento.atendente = atendente;
    atendimento.contato = contato;

    atendimentoMensagem.atendimento.id = atendimento.id;
    atendimentoMensagem.atendente.id = atendimento.atendente.id;
    atendimentoMensagem.equipe.id = atendimento.equipe.id;
    atendimentoMensagem.departamento.id = atendimento.departamento.id;
    atendimentoMensagem.recebido = false;
    atendimentoMensagem.dataHora = new Date();
    atendimentoMensagem.formato = formatoMensagemEnum.texto;
    atendimentoMensagem.conteudo = conteudo;

    if (!atendimentoMensagem.conteudo || atendimentoMensagem.conteudo.trim() == "")
        return new ResponseHttp(httpCodeEnum.NOT_ACCEPTABLE, "");

    const resSendBlip = await blipApiService.sendMessage(atendimento.contato.blipId, atendimentoMensagem.conteudo);

    if (resSendBlip.code == httpCodeEnum.OK || resSendBlip.code == httpCodeEnum.ACCEPTED) {
        atendimentoMensagem.blipId = resSendBlip.blipId;
        atendimentoMensagem.status = statusAtendimentoMesangemEnum.processado;

        const responseHttp = await addAtendimentoMensagem(atendimentoMensagem);

        if (responseHttp.httpCode == httpCodeEnum.OK)
            notificationService.sendAll(io, "SENDTEXT", atendimento.id);

        return responseHttp;
    } else {
        return new ResponseHttp(httpCodeEnum.NOT_FOUND, "Ocorreu um erro ao enviar a mensagem de texto.");
    }
}

async function sendMensagemArquivo(io, atendimentoId, atendenteId, arquivo) {
    let atendimentoMensagem = new AtendimentoMensagem();
    let atendimento = await atendimentoRepository.getById(atendimentoId);
    let atendente = await atendenteRepository.get(atendenteId);
    let contato = await contatoRepository.get(atendimento.contato.id);
    const originalName = arquivo.originalname || arquivo.filename || 'arquivo';

    // Do not include title or text so the image is sent without a caption
    const contentMedia = {
        "type": arquivo.mimetype,
        "uri": arquivo.location,
        "aspectRatio": "1:1",
        "size": arquivo.size,
        "previewUri": arquivo.location,
        "previewType": arquivo.mimetype,
        "name": originalName,
        "fileName": originalName,
        "filename": originalName,
        "title": originalName
    }

    atendimento.atendente = atendente;
    atendimento.contato = contato;

    atendimentoMensagem.atendimento.id = atendimento.id;
    atendimentoMensagem.atendente.id = atendimento.atendente.id;
    atendimentoMensagem.equipe.id = atendimento.equipe.id;
    atendimentoMensagem.departamento.id = atendimento.departamento.id;
    atendimentoMensagem.recebido = false;
    atendimentoMensagem.dataHora = new Date();
    atendimentoMensagem.formato = formatoMensagemEnum.arquivo;
    atendimentoMensagem.conteudo = JSON.stringify(contentMedia);

    const metadata = {
        "#wa.filename": originalName,
        "#file.filename": originalName
    };

    const resSendBlip = await blipApiService.sendMedia(atendimento.contato.blipId, contentMedia, metadata);

    if (resSendBlip.code == httpCodeEnum.OK || resSendBlip.code == httpCodeEnum.ACCEPTED) {
        atendimentoMensagem.blipId = resSendBlip.blipId;
        atendimentoMensagem.status = statusAtendimentoMesangemEnum.processado;

        const responseHttp = await addAtendimentoMensagem(atendimentoMensagem);

        if (responseHttp.httpCode == httpCodeEnum.OK)
            notificationService.sendAll(io, "SENDFILE", atendimento.id);

        return responseHttp;
    } else {
        return new ResponseHttp(httpCodeEnum.NOT_FOUND, "Ocorreu um erro ao enviar o arquivo.");
    }
}

async function sendMensagemAudio(io, atendimentoId, atendenteId, audio) {
    let atendimentoMensagem = new AtendimentoMensagem();
    let atendimento = await atendimentoRepository.getById(atendimentoId);
    let atendente = await atendenteRepository.get(atendenteId);
    let contato = await contatoRepository.get(atendimento.contato.id);

    const contentMediaToSend = {
        "type": audio.mimetype || "audio/ogg",
        "uri": audio.uri,
        "size": audio.size
    };

    // Mantemos o prefixo voice para o Desk renderizar como nota de voz apenas quando o mimetype começar com audio/.
    const normalizedType = contentMediaToSend.type || "";
    const contentMediaToStore = {
        ...contentMediaToSend,
        "type": normalizedType.startsWith("audio/")
            ? normalizedType.replace("audio/", "voice/")
            : normalizedType
    };

    atendimento.atendente = atendente;
    atendimento.contato = contato;

    atendimentoMensagem.atendimento.id = atendimento.id;
    atendimentoMensagem.atendente.id = atendimento.atendente.id;
    atendimentoMensagem.equipe.id = atendimento.equipe.id;
    atendimentoMensagem.departamento.id = atendimento.departamento.id;
    atendimentoMensagem.recebido = false;
    atendimentoMensagem.dataHora = new Date();
    atendimentoMensagem.formato = formatoMensagemEnum.arquivo;
    atendimentoMensagem.conteudo = JSON.stringify(contentMediaToStore);

    const resSendBlip = await blipApiService.sendMedia(
        atendimento.contato.blipId,
        contentMediaToSend,
        {
            "#wa.media.type": "ptt"
        }
    );

    if (resSendBlip.code == httpCodeEnum.OK || resSendBlip.code == httpCodeEnum.ACCEPTED) {
        atendimentoMensagem.blipId = resSendBlip.blipId;
        atendimentoMensagem.status = statusAtendimentoMesangemEnum.processado;

        const responseHttp = await addAtendimentoMensagem(atendimentoMensagem);

        if (responseHttp.httpCode == httpCodeEnum.OK)
            notificationService.sendAll(io, "SENDAUDIO", atendimento.id);

        return responseHttp;
    } else {
        return new ResponseHttp(httpCodeEnum.NOT_FOUND, "Ocorreu um erro ao enviar a mensagem de aúdio.");
    }
}

async function getByAtendimento(atendimento) {
    let mensagens = await atendimentoMensagemRepository.getByAtendimentoId(atendimento.id);

    mensagens = await preparaMensagens(atendimento, mensagens);
    // mensagens.sort(ordenaMensages);

    return mensagens;
}

function getQuantidadeMensagensNaoRespondidas(mensagens) {
    let quantidadequantidadeMensagensNaoRespondidas = 0;

    if (mensagens && mensagens.length > 0) {
        const temMensagemEnviadas = mensagens.findIndex((m) => !m.recebido) >= 0;

        mensagens.reverse();

        if (!temMensagemEnviadas) {
            quantidadequantidadeMensagensNaoRespondidas = mensagens.length;
        } else {
            for (let i = 0; i < mensagens.length; i++) {
                let mensagem = mensagens[i];

                if (!mensagem.recebido)
                    break;

                quantidadequantidadeMensagensNaoRespondidas += 1;
            }
        }

        mensagens.reverse();
    }

    return quantidadequantidadeMensagensNaoRespondidas;
}

function getDataHoraUltimaMensagem(atendimento) {
    let dataUltimaMensagem = new Date(1, 1, 1, 0, 0, 0, 0);
    const mensagens = atendimento.mensagens;

    if (mensagens && mensagens.length > 0) {
        dataUltimaMensagem = mensagens[mensagens.length - 1].dataHora;
    }

    return dataUltimaMensagem;
}

function getDataHoraUltimaMensagemRecebida(atendimento) {
    let dataUltimaMensagem = new Date(1, 1, 1, 0, 0, 0, 0);
    const mensagens = atendimento.mensagens;

    if (mensagens && mensagens.length > 0) {
        const temMensagemRecebidas = mensagens.findIndex((m) => m.recebido) >= 0;

        mensagens.reverse();

        if (!temMensagemRecebidas) {
            dataUltimaMensagem = getDataHoraUltimaMensagem(mensagens);
        } else {
            for (let i = 0; i < mensagens.length; i++) {
                if (mensagens[i].recebido) {
                    dataUltimaMensagem = mensagens[i].dataHora;
                    break;
                }
            }
        }

        mensagens.reverse();
    }

    return dataUltimaMensagem;
}

async function addAtendimentoMensagem(atendimentoMensagem) {
    try {
        const atendimentoMensagemDb = await atendimentoMensagemRepository.getByBlipId(atendimentoMensagem.blipId)
        const mensagemNaoRegistrada = (!atendimentoMensagem.blipId || atendimentoMensagemDb.id === 0);

        if (mensagemNaoRegistrada) {
            const response = await atendimentoMensagemRepository.add(atendimentoMensagem);

            if (response.type === responseTypeEnum.success) {
                atendimentoMensagem.id = response.content.insertId;

                if (atendimentoMensagem.processarArquivo) {
                    processaConteudoMultimidiaAsync(atendimentoMensagem);
                }

                if (shouldRecoverTextContent(atendimentoMensagem)) {
                    scheduleTextContentRecovery(atendimentoMensagem);
                }

                return new ResponseHttp(httpCodeEnum.OK, "Mensagem registrada.");
            }
        }

        return new ResponseHttp(httpCodeEnum.BAD_REQUEST, "Mensagem não registrada.");

    } catch (error) {
        logService.log(error);

        if (atendimentoMensagem.blipId && ehFormatoValido(atendimentoMensagem.formato)
            && atendimentoMensagem.conteudo
            && atendimentoMensagem.dataHora
            && atendimentoMensagem.recebido
            && atendimentoMensagem.atendimento) {
            atendimentoMensagem.status = statusAtendimentoMesangemEnum.erro;
            atendimentoMensagem.conteudo = atendimentoMensagem.conteudo ? atendimentoMensagem.conteudo : '';

            return new ResponseHttp(httpCodeEnum.OK, "Mensagem registrada com erro.");
        }

        return new ResponseHttp(httpCodeEnum.BAD_REQUEST, "Mensagem não registrada.");
    }
}

/**
 * Valida se o formato da mensagem é válido
 * @param formato {{id: number, idString: string}}
 * @returns {boolean}
 */
function ehFormatoValido(formato) {
    switch (formato) {
        case formatoMensagemEnum.texto:
        case formatoMensagemEnum.arquivo:
        case formatoMensagemEnum.resposta:
            return true;
        default:
            return false;
    }
}

/** Adiciona a mensagem no banco de dados a partir de uma notificação ativa
 * @param atendimentoMensagem {AtendimentoMensagem} - Mensagem a ser registrada
 * @returns {Promise<ResponseHttp>}
 */
async function addNotificacaoAtiva(atendimento, contato, atendenteId, modeloId, conteudo) {
    const atendimentoMensagem = new AtendimentoMensagem();

    atendimentoMensagem.blipId = null;
    atendimentoMensagem.atendimento = atendimento;
    atendimentoMensagem.atendente.id = atendenteId;
    atendimentoMensagem.recebido = false;
    atendimentoMensagem.equipe = atendimento.equipe;
    atendimentoMensagem.departamento = atendimento.departamento;
    atendimentoMensagem.dataHora = new Date();
    atendimentoMensagem.formato = formatoMensagemEnum.texto;
    atendimentoMensagem.conteudo = conteudo;
    atendimentoMensagem.modeloId = modeloId;
    atendimentoMensagem.status = statusAtendimentoMesangemEnum.processado;

    const response = await atendimentoMensagemRepository.add(atendimentoMensagem);
    if (response.type === responseTypeEnum.success) {
        atendimentoMensagem.id = response.content.insertId;
        return new ResponseHttp(httpCodeEnum.OK, "Mensagem registrada.", atendimentoMensagem);
    }

    return new ResponseHttp(httpCodeEnum.BAD_REQUEST, "Mensagem não registrada.", atendimentoMensagem);
}

async function createAtendimentoMensagemWebHook(body) {
    console.log("createAtendimentoMensagemWebHook")
    const atendimentoMensagem = new AtendimentoMensagem();
    try {
        const ticketId = getTicketIdFromBody(body);
        const atendimento = await atendimentoRepository.getByTicketId(ticketId);
        const tipoMensagem = resolveFormatoMensagem(body.type, body.content);
        const isContext = body.id.includes(":context");
        aplicarNomeOriginalArquivo(body);
        registrarDepuracaoArquivo("webhook", body, tipoMensagem);

        console.log("formato da mensagem recebida: " + tipoMensagem.idString)

        if (!isContext) {
            atendimentoMensagem.atendimento = atendimento;
            atendimentoMensagem.blipId = body.id.replace("fwd:fwd:", "");
            atendimentoMensagem.formato = tipoMensagem;
            atendimentoMensagem.conteudo = getConteudo(tipoMensagem, body.content);
            atendimentoMensagem.ticketId = ticketId;
            atendimentoMensagem.messageMetadata = body.metadata || {};
            atendimentoMensagem.dataHora = new Date();
            atendimentoMensagem.recebido = true;

            atendimentoMensagem.status = tipoMensagem === formatoMensagemEnum.naoDefinido
                ? statusAtendimentoMesangemEnum.erro
                : statusAtendimentoMesangemEnum.processado;
            console.log("atendimentoMensagem.status", atendimentoMensagem.status);

            if (atendimentoMensagem.status === statusAtendimentoMesangemEnum.erro) {
                console.log("status verificado como erro")
                console.log("atendimentoMensagem.conteudo", atendimentoMensagem.conteudo);
                atendimentoMensagem.conteudo = JSON.stringify(body);
                return atendimentoMensagem;
            }

            console.log(JSON.stringify(body));
            if (tipoMensagem.id !== formatoMensagemEnum.texto.id) {
                if (tipoMensagem.id === formatoMensagemEnum.resposta.id) {
                    if (body.content.replied && body.content.replied.value) {
                        atendimentoMensagem.conteudo = normalizeTextContent(body.content.replied.value);
                        atendimentoMensagem.respostaPara = {
                            blipId: body.content.inReplyTo.id
                        }
                    }
                } else {
                    atendimentoMensagem.conteudo = JSON.stringify(body.content);
                    atendimentoMensagem.processarArquivo = {
                        atendimentoId: atendimento.id,
                        content: body.content,
                        metadata: body.metadata
                    };
                }
            } else {
                await ensureTextContentFromDesk(ticketId, atendimentoMensagem, body);
            }
        }
        return atendimentoMensagem;
    } catch (error) {
        logService.log(error);
        return trataErroMensagemRecebida(atendimentoMensagem);
    }
}

function getConteudo(tipoMensagem, content) {
    switch (tipoMensagem.id) {
        case formatoMensagemEnum.arquivo.id:
            return JSON.stringify(content);
        default:
            return normalizeTextContent(content);
    }
}

const TEXT_CONTENT_FALLBACK_KEYS = [
    "text",
    "plainText",
    "displayText",
    "caption",
    "title",
    "name",
    "label",
    "body",
    "description",
    "fallbackText",
    "value"
];

const NESTED_TEXT_PATHS = [
    ["customerInput", "value"],
    ["resource", "value"],
    ["document", "value"],
    ["payload", "value"],
    ["payload", "text"],
    ["content", "value"],
    ["content", "text"],
    ["data", "text"]
];

const ELAPSED_TIME_REGEX = /^\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
const DESK_MESSAGES_PAGE_SIZE = 50;

function normalizeTextContent(content) {
    if (typeof content === "string") {
        return content;
    }

    if (content === null || typeof content === "undefined") {
        return "";
    }

    if (typeof content === "number" || typeof content === "bigint" || typeof content === "boolean") {
        return String(content);
    }

    if (Buffer.isBuffer(content)) {
        return content.toString("utf8");
    }

    if (Array.isArray(content)) {
        return content
            .map((item) => normalizeTextContent(item))
            .filter((value) => typeof value === "string" && value.trim().length > 0)
            .join(" ");
    }

    if (typeof content === "object") {
        for (const key of TEXT_CONTENT_FALLBACK_KEYS) {
            if (typeof content[key] === "string" && content[key].trim().length > 0) {
                return content[key];
            }
        }

        const nestedValue = resolveNestedTextContent(content);
        if (nestedValue) {
            return nestedValue;
        }

        try {
            return JSON.stringify(content);
        } catch (error) {
            return String(content);
        }
    }

    return String(content);
}

function resolveNestedTextContent(content) {
    if (!content || typeof content !== "object") {
        return "";
    }

    for (const path of NESTED_TEXT_PATHS) {
        let current = content;
        let validPath = true;

        for (const segment of path) {
            if (!current || typeof current !== "object") {
                validPath = false;
                break;
            }

            current = current[segment];
        }

        if (validPath && typeof current === "string" && current.trim().length > 0) {
            return current;
        }
    }

    return "";
}

function isElapsedTimePlaceholder(value) {
    if (typeof value !== "string") {
        return false;
    }

    return ELAPSED_TIME_REGEX.test(value.trim());
}

function getTicketIdFromBody(body = {}) {
    if (!body || !body.from) {
        return "";
    }

    return body.from.split("@")[0] || "";
}

function resolveFormatoMensagem(messageType, content) {
    let tipo = formatoMensagemProvider.getByType(messageType);

    if (tipo !== formatoMensagemEnum.naoDefinido) {
        return tipo;
    }

    const contentType = content && typeof content.type === "string"
        ? content.type
        : null;

    if (contentType) {
        tipo = formatoMensagemProvider.getByType(contentType);
        if (tipo !== formatoMensagemEnum.naoDefinido) {
            return tipo;
        }
    }

    if (conteudoEhTexto(content)) {
        return formatoMensagemEnum.texto;
    }

    return formatoMensagemEnum.naoDefinido;
}

function conteudoEhTexto(content) {
    if (typeof content === "string") {
        return true;
    }

    if (!content || typeof content !== "object") {
        return false;
    }

    const candidates = [
        content.text,
        content.plainText,
        content.displayText,
        content.caption,
        content.title,
        content.name,
        content.label,
        content.body,
        content.description,
        content.fallbackText,
        content.value
    ];

    return candidates.some((candidate) => typeof candidate === "string" && candidate.trim().length > 0);
}

async function createAtendimentoMensagem(atendimento, message) {
    console.log("createAtendimentoMensagem")
    const atendimentoMensagem = new AtendimentoMensagem();
    try {
        const tipoMensagem = resolveFormatoMensagem(message.type, message.content);
        const novaMensagem = typeContentRequestProvider.get(message.type, message.content) === "new-message";
        const atendimentoMensagemDb = await atendimentoMensagemRepository.getByBlipId(message.id);
        const mensagemNaoRegistrada = atendimentoMensagemDb.id === 0;
        aplicarNomeOriginalArquivo(message);
        registrarDepuracaoArquivo("history", message, tipoMensagem);

        console.log("formato da mensagem recebida: " + tipoMensagem.idString)

        if (novaMensagem && mensagemNaoRegistrada) {
            atendimentoMensagem.blipId = message.id;
            atendimentoMensagem.atendimento = atendimento;
            atendimentoMensagem.atendente.id = 0;
            atendimentoMensagem.recebido = (message.direction === "received");
            atendimentoMensagem.dataHora = new Date();
            atendimentoMensagem.formato = tipoMensagem;
            atendimentoMensagem.conteudo = normalizeTextContent(message.content);

            atendimentoMensagem.status = tipoMensagem === formatoMensagemEnum.naoDefinido
                ? statusAtendimentoMesangemEnum.erro
                : statusAtendimentoMesangemEnum.processado;
            console.log("atendimentoMensagem.status", atendimentoMensagem.status);

            if (atendimentoMensagem.status === statusAtendimentoMesangemEnum.erro) {
                console.log("status verificado como erro")
                console.log("atendimentoMensagem.conteudo", atendimentoMensagem.conteudo);
                atendimentoMensagem.conteudo = JSON.stringify(message);
                return atendimentoMensagem;
            }

            console.log(JSON.stringify(message));
            if (tipoMensagem.id !== formatoMensagemEnum.texto.id) {
                if (tipoMensagem.id === formatoMensagemEnum.resposta.id) {
                    if (message.content.replied && message.content.replied.value) {
                        atendimentoMensagem.conteudo = normalizeTextContent(message.content.replied.value);
                        atendimentoMensagem.respostaPara = {
                            blipId: message.content.inReplyTo.id
                        }
                    }
                } else {
                    // Armazena o conteúdo original imediatamente para renderizar rápido e processa upload em background
                    atendimentoMensagem.conteudo = JSON.stringify(message.content);
                    atendimentoMensagem.processarArquivo = {
                        atendimentoId: atendimento.id,
                        content: message.content,
                        metadata: message.metadata
                    };
                }
            }

            return atendimentoMensagem;
        }
    } catch (error) {
        logService.log(error);
        return trataErroMensagemRecebida(atendimentoMensagem);
    }
}

/**
 *
 * @param atendimentoMensagem {AtendimentoMensagem}
 * @returns {AtendimentoMensagem | null}
 */
function trataErroMensagemRecebida(atendimentoMensagem) {
    if (atendimentoMensagem.blipId && ehFormatoValido(atendimentoMensagem.formato)
        && atendimentoMensagem.conteudo
        && atendimentoMensagem.dataHora
        && atendimentoMensagem.recebido
        && atendimentoMensagem.atendimento) {
        atendimentoMensagem.status = statusAtendimentoMesangemEnum.erro;
        atendimentoMensagem.conteudo = atendimentoMensagem.conteudo ? atendimentoMensagem.conteudo : '';
        return atendimentoMensagem;
    }
    return null;
}

async function ensureTextContentFromDesk(ticketId, atendimentoMensagem, body) {
    if (!atendimentoMensagem
        || !atendimentoMensagem.formato
        || atendimentoMensagem.formato.id !== formatoMensagemEnum.texto.id
        || !isElapsedTimePlaceholder(atendimentoMensagem.conteudo)) {
        return;
    }

    const metadata = body && body.metadata ? body.metadata : null;
    const resolvedContent = await fetchMessageTextFromDesk(ticketId, atendimentoMensagem.blipId, metadata);

    if (resolvedContent && !isElapsedTimePlaceholder(resolvedContent)) {
        atendimentoMensagem.conteudo = resolvedContent;
        atendimentoMensagem.needsTextRecovery = false;
    } else {
        atendimentoMensagem.needsTextRecovery = true;
    }
}

async function fetchMessageTextFromDesk(ticketId, messageId, metadata) {
    if (!ticketId || !messageId) {
        return null;
    }

    try {
        const response = await blipApiService.getMessages(ticketId, 0, DESK_MESSAGES_PAGE_SIZE);

        if (!response || response.code !== httpCodeEnum.OK) {
            return null;
        }

        const items = (((response.data || {}).resource || {}).items) || [];
        const normalizedMessageId = normalizeMessageId(messageId);

        const found = items.find((message) => {
            const sameId = normalizeMessageId(message.id) === normalizedMessageId;
            if (sameId) {
                return true;
            }

            return metadataMatches(message.metadata, metadata);
        });

        if (!found) {
            return null;
        }

        return normalizeTextContent(found.content);
    } catch (error) {
        logService.log(error);
        return null;
    }
}

function metadataMatches(messageMetadata = {}, referenceMetadata = {}) {
    if (!messageMetadata || !referenceMetadata) {
        return false;
    }

    const keysToCompare = ["#uniqueId", "#messageId", "$internalId"];
    return keysToCompare.some((key) => {
        return messageMetadata[key] && referenceMetadata[key] && messageMetadata[key] === referenceMetadata[key];
    });
}

function normalizeMessageId(messageId = "") {
    if (!messageId) {
        return "";
    }

    return messageId.replace(/^fwd:fwd:/, "");
}

function processaConteudoMultimidiaAsync(atendimentoMensagem) {
    const dadosArquivo = atendimentoMensagem.processarArquivo;

    if (!dadosArquivo || !dadosArquivo.content) {
        return;
    }

    setImmediate(async () => {
        try {
            const conteudoOriginal = aplicarNomeOriginalProcessado(dadosArquivo.content, dadosArquivo.metadata);
            const arquivoProcessado = await fileService.downloadAndSendS3(
                dadosArquivo.atendimentoId,
                conteudoOriginal
            );

            if (!arquivoProcessado || !arquivoProcessado.uri) {
                return;
            }

            arquivoProcessado.type = definirTipoArquivo(conteudoOriginal.type, arquivoProcessado.type);
            arquivoProcessado.title = conteudoOriginal.title
                || conteudoOriginal.filename
                || conteudoOriginal.fileName
                || conteudoOriginal.name
                || arquivoProcessado.title;
            arquivoProcessado.name = conteudoOriginal.name
                || arquivoProcessado.name
                || arquivoProcessado.title;

            await atendimentoMensagemRepository.updateConteudo(
                atendimentoMensagem.id,
                atendimentoMensagem.formato.id,
                JSON.stringify(arquivoProcessado)
            );
        } catch (error) {
            logService.log(error);
        }
    });
}

function shouldRecoverTextContent(atendimentoMensagem) {
    if (!atendimentoMensagem
        || !atendimentoMensagem.blipId
        || !atendimentoMensagem.formato
        || atendimentoMensagem.formato.id !== formatoMensagemEnum.texto.id) {
        return false;
    }

    return isElapsedTimePlaceholder(atendimentoMensagem.conteudo);
}

function scheduleTextContentRecovery(atendimentoMensagem) {
    const ticketId = atendimentoMensagem.ticketId
        || (atendimentoMensagem.atendimento && atendimentoMensagem.atendimento.blipAtendimentoId);

    if (!ticketId || !atendimentoMensagem.blipId) {
        return;
    }

    const metadata = atendimentoMensagem.messageMetadata || null;

    setImmediate(async () => {
        try {
            const recoveredContent = await fetchMessageTextFromDesk(ticketId, atendimentoMensagem.blipId, metadata);

            if (recoveredContent && !isElapsedTimePlaceholder(recoveredContent)) {
                await atendimentoMensagemRepository.updateConteudo(
                    atendimentoMensagem.id,
                    atendimentoMensagem.formato.id,
                    recoveredContent
                );
            }
        } catch (error) {
            logService.log(error);
        }
    });
}

function aplicarNomeOriginalArquivo(message) {
    if (!message || !message.content) {
        return;
    }

    const originalName = extrairNomeArquivo(message.content, message.metadata);
    if (!originalName) {
        return;
    }

    message.content = {
        ...message.content
    };

    definirCamposNomeArquivo(message.content, originalName);
}

function aplicarNomeOriginalProcessado(content, metadata) {
    if (!content) {
        return content;
    }

    const contentClone = {
        ...content
    };

    const originalName = extrairNomeArquivo(contentClone, metadata);
    if (originalName) {
        definirCamposNomeArquivo(contentClone, originalName);
    }

    return contentClone;
}

function extrairNomeArquivo(content = {}, metadata = {}) {
    const metadataName = obterNomePorMetadata(metadata);
    if (metadataName) {
        return metadataName;
    }

    const candidates = [
        content.name,
        content.title,
        content.filename,
        content.fileName,
        content.caption,
        extrairNomePossivelDeTexto(content.text),
        extrairNomePossivelDeTexto(content.caption)
    ];

    for (const candidate of candidates) {
        if (candidate && !nomeGeradoAutomaticamente(candidate)) {
            return candidate;
        }
    }

    const uriName = obterNomeAPartirDaUri(content.uri);
    if (uriName && !nomeGeradoAutomaticamente(uriName)) {
        return uriName;
    }

    return null;
}

function obterNomePorMetadata(metadata = {}) {
    if (!metadata) {
        return null;
    }

    const metadataKeys = [
        "#wa.filename",
        "#wa.fileName",
        "#wa.originalFilename",
        "#wa.document.filename",
        "#wa.document.name",
        "#wa.media.filename",
        "#wa.media.name",
        "#file.filename",
        "#file.fileName",
        "#file.name",
        "#file.originalName",
        "filename",
        "fileName",
        "originalFilename",
        "originalName",
        "#document.filename",
        "#document.fileName",
        "#document.name",
        "#document.originalFilename",
        "#media.filename",
        "#media.name",
        "#media.originalFilename",
        "#content.filename",
        "#content.name",
        "documentName",
        "documentFilename"
    ];

    for (const key of metadataKeys) {
        if (!metadata[key])
            continue;

        const nomeExtraido = extrairNomeDeValorMetadata(metadata[key]);
        if (nomeExtraido) {
            return nomeExtraido;
        }
    }

    // Fallback: tenta encontrar estruturas aninhadas
    for (const value of Object.values(metadata)) {
        const nomeExtraido = extrairNomeDeValorMetadata(value);
        if (nomeExtraido) {
            return nomeExtraido;
        }
    }

    return null;
}

function extrairNomeDeValorMetadata(value) {
    if (!value) return null;

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (!trimmed.length) {
            return null;
        }

        const isJsonLike = (trimmed.startsWith("{") && trimmed.endsWith("}"))
            || (trimmed.startsWith("[") && trimmed.endsWith("]"));

        if (isJsonLike) {
            try {
                const parsed = JSON.parse(trimmed);
                return extrairNomeDeValorMetadata(parsed);
            } catch (error) {
                return trimmed;
            }
        }

        return trimmed;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const nome = extrairNomeDeValorMetadata(item);
            if (nome) return nome;
        }
        return null;
    }

    if (typeof value === "object") {
        const candidateKeys = [
            "filename",
            "fileName",
            "name",
            "originalFilename",
            "originalName",
            "title",
            "caption",
            "documentName"
        ];

        for (const key of candidateKeys) {
            if (value[key]) {
                return value[key];
            }
        }

        for (const child of Object.values(value)) {
            const nome = extrairNomeDeValorMetadata(child);
            if (nome) {
                return nome;
            }
        }
    }

    return null;
}

function extrairNomePossivelDeTexto(textValue) {
    if (!textValue || typeof textValue !== "string") {
        return null;
    }

    const trimmed = textValue.trim();
    if (!trimmed.length) {
        return null;
    }

    const regex = /([\wÀ-ÿ0-9_-]+\.[A-Za-z0-9]{2,10})/gi;
    const match = regex.exec(trimmed);
    if (match && match[1]) {
        return match[1];
    }

    return null;
}

function definirTipoArquivo(tipoOriginal, tipoDownload) {
    if (tipoDownload && tipoDownload.length > 0) {
        if (!tipoOriginal || tipoOriginal === "text/plain" || tipoOriginal === "application/octet-stream") {
            return tipoDownload;
        }
    }

    return tipoOriginal || tipoDownload || "application/octet-stream";
}

function definirCamposNomeArquivo(content, originalName) {
    content.originalName = originalName;
    content.name = originalName;
    content.filename = originalName;
    content.fileName = originalName;

    if (!content.title || nomeGeradoAutomaticamente(content.title)) {
        content.title = originalName;
    }
}

function nomeGeradoAutomaticamente(name) {
    if (!name) return false;

    const normalized = name.trim();
    const semExtensao = normalized.split('.').slice(0, -1).join('.') || normalized;
    const compact = semExtensao.replace(/\s+/g, '');
    const azureMediaPattern = /^media[_-]\d+/i;
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const longHexPattern = /^[0-9a-f-]{24,}$/i;

    if (azureMediaPattern.test(compact)) return true;
    if (guidPattern.test(compact)) return true;
    if (longHexPattern.test(compact)) return true;

    return false;
}

function obterNomeAPartirDaUri(uri = "") {
    if (!uri) {
        return null;
    }

    try {
        const parsed = new URL(uri);
        const filenameParam = parsed.searchParams.get("filename") || parsed.searchParams.get("file") || parsed.searchParams.get("name");
        if (filenameParam) {
            return decodeURIComponent(filenameParam);
        }

        const lastSegment = parsed.pathname.split('/').pop();
        return decodeURIComponent(lastSegment || "");
    } catch (error) {
        const segments = uri.split('/');
        return decodeURIComponent(segments.pop() || "");
    }
}

function registrarDepuracaoArquivo(origem, message, tipoMensagem) {
    try {
        if (!message || !tipoMensagem || tipoMensagem.id !== formatoMensagemEnum.arquivo.id) {
            return;
        }

        const metadataKeys = Object.keys(message.metadata || {});
        const contentKeys = Object.keys(message.content || {});
        logService.log2(`[FILE_DEBUG][${origem}] type=${message.type} metadataKeys=${metadataKeys.join(",")} contentKeys=${contentKeys.join(",")}`);
    } catch (error) {
        logService.log(error);
    }
}

async function verificaMensagensRedirecionamento(io, atendimento, atendimentoMensagens) {
    let mensagemRedirecionamento = await getMensagemRedirecionamento(atendimentoMensagens);

    if (mensagemRedirecionamento) {
        await processaMensagensRedirecionamento(io, atendimento, mensagemRedirecionamento);
    }
}

async function getMensagemRedirecionamento(atendimentoMensagens) {
    const mensagensOrdenanadas = atendimentoMensagens.sort((a, b) => a.dataHora - b.dataHora);
    let mensagemRedirecionamento = null;

    for (let i = 0; i < mensagensOrdenanadas.length; i++) {
        const atendimentoMensagem = mensagensOrdenanadas[i];

        if (atendimentoMensagem.formato === formatoMensagemEnum.texto) {
            let mensagem = await redirecionamentoService.get(atendimentoMensagem.conteudo);

            if (mensagem && mensagem.id > 0) {
                mensagemRedirecionamento = mensagem
                break;
            }
        }
    }

    return mensagemRedirecionamento;
}

async function processaMensagensRedirecionamento(io, atendimento, mensagemRedirecionamento) {
    await atendimentoService.redireciona(io, {
        atendimentoId: atendimento.id,
        equipeId: mensagemRedirecionamento.equipe.id,
        departamentoId: mensagemRedirecionamento.departamento.id,
        atendenteId: mensagemRedirecionamento.atendente.id
    });
}

async function preparaMensagens(atendimento, mensagens) {
    let mensagensRetorno = new Array();

    for (let i = 0; i < mensagens.length; i++) {
        let mensagem = mensagens[i];
        let conteudo = mensagem.conteudo;

        if (mensagem.formato === formatoMensagemEnum.arquivo) {
            const canal = atendimento && atendimento.contato ? atendimento.contato.canal : null;
            conteudo = parseConteudoArquivo(conteudo, mensagem);

            if (!conteudo) {
                const textoFallback = canal
                    ? getConteudoString(canal, normalizeTextContent(mensagem.conteudo))
                    : normalizeTextContent(mensagem.conteudo);

                mensagem.formato = formatoMensagemEnum.texto;
                mensagem.conteudo = textoFallback;
            } else {
                if (conteudo && conteudo.text) {
                    conteudo.text = canal ? getConteudoString(canal, conteudo.text) : conteudo.text;
                }

                mensagem.conteudo = conteudo;
                mensagem.formato = {
                    id: 0,
                    idString: formatoMensagemProvider.getByTypeReponse(conteudo.type)
                };
            }
        } else if (mensagem.formato.id === formatoMensagemEnum.resposta.id) {
            const conteudoResposta = parseReplyContent(conteudo);
            mensagem.conteudo = conteudoResposta;

            if (typeof mensagem.conteudo === "string") {
                const canal = atendimento && atendimento.contato ? atendimento.contato.canal : null;
                mensagem.conteudo = getConteudoString(canal, mensagem.conteudo);
            }

            if (mensagem.respostaPara && mensagem.respostaPara.blipId) {
                const mensagemRespondida = mensagens.find(m => m.blipId === mensagem.respostaPara.blipId);
                if (mensagemRespondida) {
                    const formatoRespondido = mensagemRespondida.formato || {};
                    const formatoRespondidoId = typeof formatoRespondido.id === "number" ? formatoRespondido.id : null;

                    if (formatoRespondidoId === null ||
                        (formatoRespondidoId !== formatoMensagemEnum.texto.id &&
                            formatoRespondidoId !== formatoMensagemEnum.resposta.id)) {
                        mensagem.respostaPara.mensagem = "Arquivo";
                        mensagem.respostaPara.id = mensagemRespondida.id;
                    } else {
                        let conteudoRespondido = mensagemRespondida.conteudo ? mensagemRespondida.conteudo : "";
                        if (typeof conteudoRespondido === "object") {
                            let stringified;
                            try {
                                stringified = JSON.stringify(conteudoRespondido);
                            } catch (e) {
                                stringified = String(conteudoRespondido);
                            }
                            conteudoRespondido = conteudoRespondido.text || conteudoRespondido.caption || stringified;
                        } else if (typeof conteudoRespondido !== "string") {
                            conteudoRespondido = String(conteudoRespondido);
                        }
                        const conteudoReduzido = conteudoRespondido.substring(0, 100);
                        mensagem.respostaPara.mensagem = conteudoReduzido + (conteudoRespondido.length > 100 ? "..." : "");
                        mensagem.respostaPara.id = mensagemRespondida.id;
                    }

                    const preview = buildRespostaPreview(mensagemRespondida);
                    if (preview) {
                        mensagem.respostaPara.preview = preview;

                        if (preview.nome && mensagem.respostaPara.mensagem === "Arquivo") {
                            mensagem.respostaPara.mensagem = preview.nome;
                        }
                    }
                }
            }
        } else {
            if (mensagem.formato.id === formatoMensagemEnum.texto.id && isElapsedTimePlaceholder(conteudo)) {
                const ticketId = atendimento && atendimento.blipAtendimentoId ? atendimento.blipAtendimentoId : "";
                const recoveredContent = await fetchMessageTextFromDesk(ticketId, mensagem.blipId);

                if (recoveredContent && !isElapsedTimePlaceholder(recoveredContent)) {
                    conteudo = recoveredContent;
                    await atendimentoMensagemRepository.updateConteudo(
                        mensagem.id,
                        mensagem.formato.id,
                        recoveredContent
                    );
                } else {
                    scheduleTextContentRecovery({
                        ...mensagem,
                        ticketId,
                        messageMetadata: mensagem.messageMetadata || {}
                    });
                }
            }

            mensagem.conteudo = getConteudoString(atendimento.contato.canal, conteudo);
        }

        mensagensRetorno.push(mensagem)
    }

    return mensagensRetorno;
}

function parseReplyContent(conteudo) {
    if (conteudo === null || typeof conteudo === "undefined") {
        return "";
    }

    if (typeof conteudo === "object") {
        return conteudo;
    }

    if (typeof conteudo !== "string") {
        return conteudo;
    }

    const trimmed = conteudo.trim();

    if (!trimmed.length) {
        return "";
    }

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            return JSON.parse(trimmed);
        } catch (error) {
            return conteudo;
        }
    }

    return conteudo;
}

function buildRespostaPreview(mensagemRespondida) {
    if (!mensagemRespondida) {
        return null;
    }

    const conteudo = mensagemRespondida.conteudo;
    if (!conteudo || typeof conteudo !== "object") {
        return null;
    }

    if (!conteudo.uri && !conteudo.url) {
        return null;
    }

    const previewContent = sanitizePreviewContent(conteudo);
    const tipo = resolvePreviewType(previewContent, mensagemRespondida);
    const nome = getPreviewFileName(previewContent);

    return {
        tipo,
        conteudo: previewContent,
        nome
    };
}

function sanitizePreviewContent(conteudo) {
    return {
        uri: conteudo.uri || conteudo.url || "",
        type: conteudo.type || conteudo.mimeType || "",
        name: conteudo.name || "",
        title: conteudo.title || "",
        originalName: conteudo.originalName || "",
        filename: conteudo.filename || conteudo.fileName || "",
        caption: conteudo.caption || "",
        text: conteudo.text || "",
        size: conteudo.size || 0
    };
}

function resolvePreviewType(conteudo, mensagemRespondida) {
    if (conteudo && conteudo.type) {
        return formatoMensagemProvider.getByTypeReponse(conteudo.type);
    }

    const formato = mensagemRespondida && mensagemRespondida.formato ? mensagemRespondida.formato : null;
    if (formato && formato.idString) {
        return formato.idString;
    }

    if (conteudo && conteudo.uri) {
        return guessPreviewTypeByExtension(conteudo.uri);
    }

    return "arquivo";
}

function guessPreviewTypeByExtension(uri) {
    if (!uri || typeof uri !== "string") {
        return "arquivo";
    }

    const normalized = uri.split('?')[0];
    const lastSegment = normalized.split('.').pop();

    if (!lastSegment) {
        return "arquivo";
    }

    const extension = lastSegment.toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
        return "imagem";
    }

    if (["mp3", "wav", "ogg", "aac", "m4a"].includes(extension)) {
        return "audio";
    }

    return "arquivo";
}

function getPreviewFileName(conteudo) {
    if (!conteudo) {
        return "";
    }

    const candidates = [
        conteudo.originalName,
        conteudo.name,
        conteudo.title,
        conteudo.filename,
        conteudo.caption,
        conteudo.text,
        conteudo.uri
    ].filter(Boolean);

    for (let i = 0; i < candidates.length; i++) {
        const value = candidates[i];
        if (!value) {
            continue;
        }

        const trimmed = value.trim();
        if (!trimmed) {
            continue;
        }

        if (trimmed.startsWith("http")) {
            const fallback = extractPreviewFileNameFromUri(trimmed);
            if (fallback) {
                return fallback;
            }
        } else {
            return trimmed;
        }
    }

    return "";
}

function extractPreviewFileNameFromUri(uri) {
    if (!uri || typeof uri !== "string") {
        return "";
    }

    try {
        const parsed = new URL(uri);
        const filenameParam = parsed.searchParams.get("filename") || parsed.searchParams.get("file") || parsed.searchParams.get("name");
        if (filenameParam) {
            return decodeURIComponent(filenameParam);
        }

        const pathname = parsed.pathname || "";
        const lastSegment = pathname.split('/').pop();
        return decodeURIComponent(lastSegment || "");
    } catch (error) {
        const segments = uri.split('/');
        return segments.length ? decodeURIComponent(segments.pop()) : "";
    }
}

function parseConteudoArquivo(rawConteudo, mensagem) {
    if (!rawConteudo) {
        return null;
    }

    if (typeof rawConteudo === "object") {
        return rawConteudo;
    }

    if (typeof rawConteudo !== "string") {
        return null;
    }

    const trimmed = rawConteudo.trim();
    if (!trimmed.length) {
        return null;
    }

    const normalized = normalizarConteudoJsonArquivo(trimmed);
    if (!normalized) {
        return null;
    }

    try {
        return JSON.parse(normalized);
    } catch (error) {
        const mensagemId = mensagem && mensagem.id ? mensagem.id : 0;
        const blipId = mensagem && mensagem.blipId ? mensagem.blipId : "";
        logService.log(`[PARSE_ARQUIVO_CONTEUDO_ERRO] mensagemId=${mensagemId} blipId=${blipId} erro=${error.message}`);
        return null;
    }
}

function normalizarConteudoJsonArquivo(value) {
    if (!value) {
        return null;
    }

    let candidate = value.trim();
    if (!candidate.length) {
        return null;
    }

    const startsEscaped = candidate.startsWith("\\{") || candidate.startsWith("\\[");
    if (startsEscaped) {
        candidate = candidate.replace(/^\\+/, "");
    }

    if (candidate[0] !== "{" && candidate[0] !== "[") {
        return null;
    }

    if (candidate.includes('\\"')) {
        candidate = candidate.replace(/\\"/g, '"');
    }

    if (candidate.endsWith("\\")) {
        candidate = candidate.replace(/\\+$/, "");
    }

    return candidate;
}

function getConteudoString(canal, conteudo) {
    let novoConteudo = stringService.decodeMarkDown(canal, conteudo);
    novoConteudo = stringService.transformTagLink(novoConteudo);
    novoConteudo = stringService.decodeOwnerTags(novoConteudo);

    return novoConteudo;
}

function getStateId(message) {
    if (!message.metadata)
        return null;

    if (!message.metadata["#stateId"])
        return null;

    return message.metadata["#stateId"]
}

function getPosicaoUltimaMensagem(messages) {
    let iBase = 0;
    let idUltimaMensagem = messages.length;

    let posMensagemBoasVindas = messages.findIndex(m => getStateId(m) == process.env.BLIP_BOASVINDAS_STATEID);
    let posMensagemSolicitaNome = messages.findIndex(m => getStateId(m) == process.env.BLIP_SOLICITANOME_STATEID);
    let difPos = (posMensagemSolicitaNome - posMensagemBoasVindas);

    if (posMensagemSolicitaNome >= 1 &&
        posMensagemSolicitaNome > posMensagemBoasVindas &&
        difPos <= 5
    ) {
        iBase = posMensagemSolicitaNome;
    } else {
        iBase = posMensagemBoasVindas;
    }

    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const stateId = getStateId(message);
        const mensagemDoBot = (message.direction == "sent" && stateId != null);

        if (i > iBase && mensagemDoBot) {
            idUltimaMensagem = i;
            break;
        }
    }

    if (idUltimaMensagem > 0) {
        idUltimaMensagem = idUltimaMensagem - 1;
    }

    return idUltimaMensagem
}
