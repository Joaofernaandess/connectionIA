const Falha = require('../entities/falha');
const falhaRepository = require('../repositories/falhaRepository');
const tipoFalhaEnum = require('../enums/tipoFalhaEnum');
const tipoFalhaProvider = require('../providers/tipoFalhaProvider');
const atendenteRepository = require('../repositories/atendenteRepository');
const commonService = require('../services/common/commonService');

exports.addFalhaVerificacaoWhatsApp = (atendenteId) => addFalhaVerificacaoWhatsApp(atendenteId);
exports.atendentePodeVerificarWhatsapp = (atendenteId) => atendentePodeVerificarWhatsapp(atendenteId);

module.exports = exports;

/**
 * Adiciona uma falha de verificação de whatsapp para o atendente
 * @param atendenteId {number}
 * @returns {Promise<{mensagem: string, sucesso: boolean}|{erro: string, mensagem: string, sucesso: boolean}>}
 */
async function addFalhaVerificacaoWhatsApp(atendenteId) {
    const atendente = await atendenteRepository.get(atendenteId);
    if (!atendente) {
        return {
            sucesso: false,
            erro: 'ATENDENTE_NAO_ENCONTRADO',
            mensagem: 'Atendente não encontrado'
        }
    }

    const falha = new Falha();
    falha.atendente.id = atendenteId;
    falha.dataHora = new Date();
    falha.tipo = tipoFalhaEnum.whatsappInvalido

    const falhaAdicionada = await falhaRepository.add(falha);
    if (!falhaAdicionada || !falhaAdicionada.id) {
        return {
            sucesso: false,
            erro: 'FALHA_NAO_ADICIONADA',
            mensagem: 'Falha não adicionada'
        }
    }

    return {
        sucesso: true,
        mensagem: 'Falha adicionada com sucesso'
    }
}

/**
 * Verifica se o atendente pode verificar o whatsapp
 * @param atendenteId {number}
 * @returns {Promise<{podeVerificar: boolean, minutosRestantes?: number}>}
 */
async function atendentePodeVerificarWhatsapp(atendenteId) {
    const falhasDoAtendente = await falhaRepository.getFalhasPorAtendente(atendenteId);

    if (falhasDoAtendente.length === 0) return {
        podeVerificar: true
    };

    const horaAtual = new Date();
    let falhasEmTresHorasCount = 0;
    let ultimaFalha = null;

    falhasDoAtendente.forEach(falha => {
        if (falha.tipo === tipoFalhaEnum.whatsappInvalido.id) {
            const diferencaEmHoras = commonService.getDiferencaEmHoras(falha.dataHora, horaAtual);
            if (diferencaEmHoras <= 3) {
                falhasEmTresHorasCount++;
                ultimaFalha = falha;
            }
        }
    });

    if (falhasEmTresHorasCount < 3) return {
        podeVerificar: true
    };

    const podeVerificar = commonService.getDiferencaEmHoras(ultimaFalha.dataHora, horaAtual) >= 3;
    if (!podeVerificar) return {
        podeVerificar,
        minutosRestantes: 180 - commonService.getDiferencaEmMinutos(ultimaFalha.dataHora, horaAtual)
    };

    return {
        podeVerificar
    };
}