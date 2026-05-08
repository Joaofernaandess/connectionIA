const blipContactService = require('../blip/contactService');

const httpCodeEnum = require('../../enums/httpCodeEnum');
const logService = require('../common/logService');
const notificationService = require('../common/notificationService');

const atendimentoService = require('../atendimentoService');
const atendimentoMensagemService = require('../atendimentoMensagemService');
const equipeService = require('../equipeService');
const userService = require('./userService');

exports.newTicket = async (io, body) => newTicket(io, body);
exports.addOldMessages = async (io, atendimento) => addOldMessages(io, atendimento);
exports.assignTicketToAgentDefault = async (body) => assignTicketToAgentDefault(body);
exports.newMessage = async (io, body) => newMessage(io, body);

module.exports = exports;

async function newTicket(io, body) {
    sendNotificationNewTicket(io, body);

    return await atendimentoService.create(body);
}

async function assignTicketToAgentDefault(body) {
    await atendimentoService.setAtendimentoAoAtendentePadrao(body);
}

async function addOldMessages(io, atendimento) {
    await atendimentoMensagemService.addMensagensAnteriores(io, atendimento);
}

async function newMessage(io, body) {
    const response = await atendimentoMensagemService.create(body);

    if (response && response.httpCode === httpCodeEnum.OK) {
        sendNotificationNewMessage(io, body);
    } else {
        logService.log(`WEBHOOK - Falha ao registrar mensagem ${body.id}: ${response ? response.message : 'Sem resposta'}`);
    }
}

async function sendNotificationNewTicket(io, body) {
    let mensagem = await getMessageNewTicket(body.content);

    const sockets = await getSocketsByTeam(body.content.team);
    
    for (let i = 0; i < sockets.length; i++) {
        const socket = sockets[i];

        notificationService.sendNewEvent(io, socket.socketId, "new-ticket", {
            mensagem: mensagem,
            atendimento: body.content
        });
    }
}

async function getSocketsByTeam(team) {
    let sockets = new Array();
    let equipesAtendentes = await equipeService.getEquipeAtendentesByEquipeNome(team);

    let equipe = equipesAtendentes.equipe;
    let atendentes = equipesAtendentes.atendentes;
    let usuariosLogados = userService.getUsers();

    for (let a = 0; a < atendentes.length; a++) {
        const atendente = atendentes[a];
        const usuarioLogado = usuariosLogados.find(u => u.email == atendente.email);

        if (usuarioLogado) {
            sockets.push(usuarioLogado);
        }
    }

    return sockets;
}

async function getMessageNewTicket(content) {
    let customerName = "";
    const contact = await blipContactService.get(content.customerIdentity);

    if (contact.name != "") {
        customerName = contact.name;
    }

    if (content && customerName != "")
        return `${customerName} aguardando atendimento`;

    return "Novo usuário agurdando atendimento";
}

async function sendNotificationNewMessage(io, body) {
    let socketsDoAtendente = [];
    
    const ticketId = body.from.split("@")[0];
    const atendimento = await atendimentoService.getByTicketId(ticketId)
    const socketsTodos = userService.getUsers();

    if (atendimento.atendente && atendimento.atendente.email != "") {
        socketsDoAtendente = userService.getUserByEmail(decodeURI(atendimento.atendente.email)) || [];
        const titulo = (atendimento.contato.nome ? atendimento.contato.nome : "SommusBLiP ") + ` - Atendimento #${atendimento.id}`;

        for (let i = 0; i < socketsDoAtendente.length; i++) {
            const socket = socketsDoAtendente[i];

            notificationService.sendNewEvent(io, socket.socketId, "new-message", {
                atendimentoId: atendimento.id,
                titulo: titulo,
                mensagem: body.content
            });
        }
    }

    socketsTodos.forEach(socket => {
        if (!socketsDoAtendente.find(s => s.socketId == socket.socketId)) {
            notificationService.sendIndividual(io, socket.socketId, "WEBHOOK", atendimento.id);
        }
    });
}
