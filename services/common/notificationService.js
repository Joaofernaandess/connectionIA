exports.sendAll = (io, local, atendimentoId) => sendAll(io, local, atendimentoId);
exports.sendIndividual = (io, socketId, local, atendimentoId) => sendIndividual(io, socketId, local, atendimentoId);
exports.sendNewEvent = (io, socketId, event, conteudo) => sendNewEvent(io, socketId, event, conteudo);

module.exports = exports;

function sendAll(io, local, atendimentoId) {
    io.emit('update-tickets-message', {
        atendimentoId: atendimentoId,
        local: local
    });
}

function sendIndividual(io, socketId, local, atendimentoId) {
    io.to(socketId).emit('update-tickets-message', {
        atendimentoId: atendimentoId,
        local: local
    });
}

function sendNewEvent(io, socketId, event, conteudo) {
    io.to(socketId).emit(event, conteudo);
}