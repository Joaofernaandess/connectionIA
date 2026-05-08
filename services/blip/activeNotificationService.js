const blipApiService = require('./apiService');

exports.isValidWhatsappAccount = (phoneNumber) => validateWhatsappAccount(phoneNumber);
exports.sendWhatsappActiveMessage = (templateName, to, params, headerParams) => sendWhatsappActiveMessage(templateName, to, params, headerParams);
exports.sendWhatsappMassCampaign = async (name, flowId, stateId, messageTemplate, audiences, scheduledDate) => sendWhatsappMassCampaign(name, flowId, stateId, messageTemplate, audiences, scheduledDate);

module.exports = exports;

async function validateWhatsappAccount(phoneNumber) {
    if (!phoneNumber.substring(0,1) === '+') {
        phoneNumber = '+' + phoneNumber;
    }

    const response = await blipApiService.validateWhatsappAccount(phoneNumber);

    if (response.code === 200) {
        return response.data.resource;
    } else {
        return null;
    }
}

/**
 * @typedef {{ index: number, name: string, text: string }} ActiveNotificationParameter
 */

/**
 * @typedef {{ tipo: string, link: string, filename?: string }} HeaderParameter
 */

/**
 * @param templateName {string}
 * @param {string} to
 * @param {ActiveNotificationParameter[]} params
 * @param {HeaderParameter[]} [headerParams]
 * @returns {Promise<boolean>}
 */
async function sendWhatsappActiveMessage(templateName, to, params, headerParams) {
    const components = getComponents(params, headerParams);
    const response = await blipApiService.sendWhatsappActiveMessage(
        to,
        templateName,
        components
    );

    return response.code === 202;
}

/**
 * Monta os componentes do template WhatsApp (header + body)
 * @param {ActiveNotificationParameter[]} params - Parâmetros do body
 * @param {HeaderParameter[]} [headerParams] - Parâmetros do header (documento, imagem, vídeo)
 * @returns {object[] | null}
 */
function getComponents(params, headerParams) {
    const components = [];

    if (headerParams && headerParams.length > 0) {
        const header = {
            "type": "header",
            "parameters": headerParams.map(hp => {
                if (hp.tipo === 'document') {
                    return {
                        "type": "document",
                        "document": {
                            "link": hp.link,
                            "filename": hp.filename || "documento.pdf"
                        }
                    };
                } else if (hp.tipo === 'image') {
                    return {
                        "type": "image",
                        "image": { "link": hp.link }
                    };
                } else if (hp.tipo === 'video') {
                    return {
                        "type": "video",
                        "video": { "link": hp.link }
                    };
                }
            })
        };
        components.push(header);
    }

    params = params ? params.sort((a, b) => a.index - b.index) : null;
    const body = {
        "type": "body",
        "parameters": params ? params.map((param) => ({
            "type": "text",
            "text": param.text
        })) : []
    };
    components.push(body);

    return components.length > 0 ? components : null;
}

/**
 * Envia uma campanha em massa do WhatsApp via Active Campaign (Growth)
 * Utiliza o endpoint /campaign/full para criar, popular e disparar em uma única chamada
 * @param {string} name 
 * @param {string} flowId 
 * @param {string} stateId 
 * @param {string} messageTemplate 
 * @param {any[]} audiences 
 * @returns {Promise<{success: boolean, message: string, campaignId?: string}>}
 */
async function sendWhatsappMassCampaign(name, flowId, stateId, messageTemplate, audiences, scheduledDate) {
    const response = await blipApiService.sendFullCampaign(name, flowId, stateId, messageTemplate, audiences, scheduledDate);
    
    if (!response || response.code >= 400 || !response.data || response.data.status !== 'success') {
        console.error("Erro ao enviar campanha completa: ", JSON.stringify(response, null, 2));
        let erroRetorno = 'Erro ao enviar campanha no Blip.';
        if (response && response.data && response.data.reason) {
            erroRetorno += ' Detalhe: ' + response.data.reason.description;
        }
        return { success: false, message: erroRetorno, details: response };
    }

    const campaignId = response.data.resource ? response.data.resource.id : null;
    return { success: true, message: 'Campanha enviada com sucesso.', campaignId };
}