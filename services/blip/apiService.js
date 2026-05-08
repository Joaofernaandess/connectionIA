const axios = require('axios');
const uuid = require('uuid');
const moment = require('moment');

const logService = require('../common/logService');

exports.validateWhatsappAccount = async (phoneNumber) => validateWhatsappAccount(phoneNumber);
exports.sendWhatsappActiveMessage= async (to, messageTemplateName, components) => sendWhatsappActiveMessage(to, messageTemplateName, components);
exports.getContactIdentifierByTunnel = async (tunnel) => getContactIdentifierByTunnel(tunnel);

exports.createContactInRouter = async (contact) => createContactInRouter(contact);
exports.getContact = async (id, isRouter) => getContact(id, isRouter);
exports.updateContact = async (contact, isRouter) => updateContact(contact, isRouter);

exports.assignTicketToAnAgent = async (ticketId, agentIdentity, status) => assignTicketToAnAgent(ticketId, agentIdentity, status);

exports.changeStatus = async (ticketId, status) => changeStatus(ticketId, status);

exports.getMessages = async (ticketId, skip, take) => getMessages(ticketId, skip, take);
exports.sendMessage = async (customerIdentity, message) => sendMessage(customerIdentity, message);
exports.sendMedia = async (customerIdentity, content, metadata) => sendMedia(customerIdentity, content, metadata);

exports.sendFullCampaign = async (name, flowId, stateId, messageTemplate, audiences, scheduledDate) => sendFullCampaign(name, flowId, stateId, messageTemplate, audiences, scheduledDate);

module.exports = exports;

async function validateWhatsappAccount(phoneNumber) {
    const uri = `lime://wa.gw.msging.net/accounts/${phoneNumber}/`;

    return await apiBase(null, {
        "id": getId(),
        "to": "postmaster@wa.gw.msging.net",
        "method": "get",
        "uri": uri
    }, true);
}

/**
 *
 * @param to {string}
 * @param messageTemplateName {string}
 * @param components {Components[]}
 * @returns {Promise<ApiBaseResponse | null>}
 */
async function sendWhatsappActiveMessage(to, messageTemplateName, components) {
    const data = {
        "to": to,
        "type": "application/json",
        "content": {
            "type": "template",
            "template": {
                "name": messageTemplateName,
                "language":{
                    "code":"pt_BR",
                    "policy":"deterministic"
                },
                "components": components
            }
        }
    };

    return await apiBase(process.env.BLIP_API_URL_MESSAGES, data, true);
}

async function createContactInRouter(contact) {
    const uri = `/contacts`;

    return await apiBase(null, {
        "id": getId(),
        "method": "set",
        "uri": uri,
        "type": "application/vnd.lime.contact+json",
        "resource": contact
    }, true);
}

/**
 * Consulta identificador original do contato pelo tunnel do Atendimento Humano na API do Blip.
 * @param {string} tunnel - Tunnel do Atendimento Humano ou do Router.
 * @param  isRouter {boolean} - Se true, consulta na API do Router, se false, consulta na API do Atendimento Humano.
 * @returns {Promise<{code: number, data: {resource: {originator: string}}} | null>}
 */
async function getContactIdentifierByTunnel(tunnel) {
    const uri = `/tunnels/${tunnel}`;

    return await apiBase(null, {
        "id": getId(),
        "to": "postmaster@tunnel.msging.net",
        "method": "get",
        "uri": uri
    }, true);
}

async function getContact(id, isRouter = false) {
    const uri = `/contacts/${id}`;
    return await apiBase(null, {
        "id": getId(),
        "method": "get",
        "uri": uri
    }, isRouter);
}

async function updateContact(contact, isRouter = false) {
    const uri = `/contacts`;

    return await apiBase(null, {
        "id": getId(),
        "method": "set",
        "uri": uri,
        "type": "application/vnd.lime.contact+json",
        "resource": contact
    }, isRouter);
}

async function assignTicketToAnAgent(ticketId, agentIdentity, status) {
    return await apiBase(null, {
        "id": getId(),
        "to": "postmaster@desk.msging.net",
        "method": "set",
        "uri": "/tickets/change-status",
        "type": "application/vnd.iris.ticket+json",
        "resource": {
            "id": `${ticketId}`,
            "status": `${status}`,
            "agentIdentity": `${agentIdentity}`
        }
    });
}

async function changeStatus(ticketId, status) {
    return await apiBase(null, {
        "id": getId(),
        "to": "postmaster@desk.msging.net",
        "method": "set",
        "uri": "/tickets/change-status",
        "type": "application/vnd.iris.ticket+json",
        "resource": {
            "id": `${ticketId}`,
            "status": `${status}`
        }
    });
}

async function getMessages(ticketId, skip = 0, take = 100) {
    return await apiBase(null, {
        "id": getId(),
        "to": "postmaster@desk.msging.net",
        "method": "get",
        "uri": `/tickets/${ticketId}/messages?$take=${take}&getFromOwnerIfTunnel=true`,
    });
}

async function sendMessage(customerIdentity, message) {
    let id = getId();
    let res = await apiBase(process.env.BLIP_API_URL_MESSAGES, {
        "id": id,
        "to": customerIdentity,
        "type": "text/plain",
        "content": `${message}`
    });

    res["blipId"] = id;

    return res;
}

async function sendMedia(customerIdentity, content, metadata = null) {
    let id = getId();
    const message = {
        "id": id,
        "to": customerIdentity,
        "type": "application/vnd.lime.media-link+json",
        "content": content
    };

    if (metadata
        && typeof metadata === 'object'
        && !Array.isArray(metadata)
        && Object.keys(metadata).length > 0) {
        message["metadata"] = metadata;
    }

    let res = await apiBase(process.env.BLIP_API_URL_MESSAGES, message);

    res["blipId"] = id;

    return res;
}

/**
 * Envia uma campanha completa (criação + audiência + disparo) em uma única chamada
 * Utiliza o endpoint /campaign/full conforme documentação oficial do Blip
 * @param {string} name - Nome da campanha
 * @param {string} flowId - ID do fluxo no Builder
 * @param {string} stateId - ID do bloco/estado no Builder
 * @param {string} messageTemplate - Nome do template aprovado no WhatsApp
 * @param {Array} audiences - Lista de destinatários com recipient e messageParams
 * @returns {Promise<ApiBaseResponse|null>}
 */
async function sendFullCampaign(name, flowId, stateId, messageTemplate, audiences, scheduledDate) {
    const campaign = {
        "name": name,
        "campaignType": "Batch",
        "channelType": "WhatsApp"
    };

    // scheduledDate opcional — formato ISO 8601 UTC
    if (scheduledDate) campaign.scheduled = scheduledDate.replace(' ', 'T') + ':00Z';

    // flowId e stateId são opcionais — apenas incluir se informados
    if (flowId) campaign.flowId = flowId;
    if (stateId) {
        campaign.stateId = stateId;
        campaign.masterState = "masterstate@msging.net";
    }

    // Declarar todas as chaves de parâmetros do template (header "0" + body "1", "2", "3")
    const bodyParamKeys = audiences.length > 0 && audiences[0].messageParams
        ? Object.keys(audiences[0].messageParams)
        : [];

    const payload = {
        "id": getId(),
        "to": "postmaster@activecampaign.msging.net",
        "method": "set",
        "uri": "/campaign/full",
        "type": "application/vnd.iris.activecampaign.full-campaign+json",
        "resource": {
            "campaign": campaign,
            "audiences": audiences,
            "message": {
                "messageTemplate": messageTemplate,
                "messageParams": bodyParamKeys,
                "channelType": "WhatsApp"
            }
        }
    };

    console.log('[sendFullCampaign] campaign payload:', JSON.stringify(payload.resource, null, 2));
    return await apiBase(null, payload, true);
}

/**
 * @typedef {{code: number, mensagem: string, data: any}} ApiBaseResponse
 */

/**
 *
 * @param url {string}
 * @param data {string}
 * @param useRouterKey {boolean}
 * @returns {Promise<ApiBaseResponse | null>}
 */
async function apiBase(url, data, useRouterKey = false) {
    const activeLog = false;

    url = url ? url : process.env.BLIP_API_URL_COMMANDS;

    let responseApiBase = null;
    let blipAuthKey = useRouterKey ? process.env.BLIP_ROUTER_API_KEY : process.env.BLIP_API_KEY;
    let config = {
        method: 'post',
        timeout: 2 * 60 * 1000,
        url: `${url}`,
        headers: {
            'Authorization': `Key ${blipAuthKey}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(data)
    };

    if (activeLog) {
        const now = new moment();
        const idRequest = now.format("x");
        logService.log(`BLIPAPI REQUEST - ${idRequest} - ${url} - ${JSON.stringify(data)}`);
    }

    await axios(config)
        .then(function (res) {
            if (res.status === 200 && res.data.status && res.data.status !== "success") {
                res.status = 401;
            }

            responseApiBase = {
                code: res.status,
                mensagem: "",
                data: res.data
            };
        })
        .catch(function (error) {
            if (error.response) {
                responseApiBase = {
                    code: error.response.status,
                    mensagem: error.response.data
                }
            } else if (error.request) {
                responseApiBase = {
                    code: 400,
                    mensagem: error.request
                }
            } else {
                responseApiBase = {
                    code: 400,
                    mensagem: error.message
                }
            }
        });

    if (activeLog) {
        try {
            logService.log(`BLIPAPI RESPONSE - ${idRequest} - ${JSON.stringify(responseApiBase)}`);
        } catch (error) {
            logService.log(`BLIPAPI RESPONSE - ${idRequest} - OCORREU UM ERRO NA CONVERSÃO DO RETORNO`);
        }
    }

    return responseApiBase;
}

function getId() {
    return uuid.v1();
}
