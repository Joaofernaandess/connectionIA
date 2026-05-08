const Atendimento = require('../entities/atendimento');
const AtendimentoMensagem = require('../entities/atendimentoMensagem');

const commonService = require('../services/common/commonService');

exports.atendimentosToAtendimentosVM = (atendimentos) => atendimentosToAtendimentosVM(atendimentos);
exports.atendimentoToAtendimentoVM = (atendimento) => atendimentoToAtendimentoVM(atendimento);

module.exports = exports;

async function atendimentosToAtendimentosVM(atendimentos) {
    let atendimentosVM = new Array();

    for (let i = 0; i < atendimentos.length; i++) {
        atendimentosVM.push(atendimentoToAtendimentoVM(atendimentos[i]));
    }

    return atendimentosVM;
}

function atendimentoToAtendimentoVM(atendimento) {
    let atendimentoVM = new Atendimento();

    atendimentoVM.id = atendimento.id;
    atendimentoVM.atendente = atendimento.atendente;
    atendimentoVM.contato = atendimento.contato;
    atendimentoVM.equipe = atendimento.equipe;
    atendimentoVM.departamento = atendimento.departamento;
    atendimentoVM.dataHora = atendimento.dataHora;
    atendimentoVM.status = atendimento.status;
    atendimentoVM.quantidadeMensagensNaoRespondidas = atendimento.quantidadeMensagensNaoRespondidas;
    atendimentoVM.dataUltimaMensagem = commonService.formatoDataAtendimento(atendimento.dataUltimaMensagem);
    atendimentoVM.mensagens = atendimentoMensagensToAtendimentoMensagensVM(atendimento.mensagens);
    atendimentoVM.desabilitaChatRegraWhatsApp = atendimento.desabilitaChatRegraWhatsApp;
    atendimentoVM.desabilitaChatRegraAtendente = atendimento.desabilitaChatRegraAtendente;
    atendimentoVM.permiteAtender = atendimento.permiteAtender;
    atendimentoVM.habilitaTransferencia = atendimento.habilitaTransferencia;
    
    return atendimentoVM;
}

function atendimentoMensagensToAtendimentoMensagensVM(mensagens) {
    let atendimentoMensagensVM = new Array();

    if (!mensagens)
        return atendimentoMensagensVM;

    for (let i = 0; i < mensagens.length; i++) {
        const atendimentoMensagem = mensagens[i];
        let atendimentoMensagemVM = new AtendimentoMensagem();

        atendimentoMensagemVM.id = atendimentoMensagem.id;
        atendimentoMensagemVM.atendimento = null;
        atendimentoMensagemVM.atendente = null;
        atendimentoMensagemVM.equipe = null;
        atendimentoMensagemVM.recebido = atendimentoMensagem.recebido;
        atendimentoMensagemVM.formato = atendimentoMensagem.formato;
        atendimentoMensagemVM.conteudo = atendimentoMensagem.conteudo;
        atendimentoMensagemVM.dataHora = commonService.formatoDataMensagens(atendimentoMensagem.dataHora);
        atendimentoMensagemVM.status = atendimentoMensagem.status.id;

        if (atendimentoMensagem.respostaPara) {
            atendimentoMensagemVM.respostaPara = {
                id: atendimentoMensagem.respostaPara.id,
                mensagem: atendimentoMensagem.respostaPara.mensagem,
                preview: atendimentoMensagem.respostaPara.preview
            };
        } else {
            atendimentoMensagemVM.respostaPara = null;
        }

        atendimentoMensagensVM.push(atendimentoMensagemVM);
    }

    return atendimentoMensagensVM;
}
