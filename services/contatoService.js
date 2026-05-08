const Contato = require('../entities/contato');

const ResponseHttp = require('../entities/responseHttp');

const responseTypeEnum = require('../enums/responseTypeEnum');

const contatoMap = require('../maps/contatoMap');

const contatoRepository = require('../repositories/contatoRepository')

const canalEnum = require("../enums/blip/canalEnum");
const fileService = require('./common/fileService');
const blipContactService = require('./blip/contactService');
const httpCodeEnum = require('../enums/httpCodeEnum');

const falhaService = require("./falhaService");
const commonService = require("./common/commonService");
const blipActiveMessagingService = require("./blip/activeNotificationService");
const contactService = require("./blip/contactService");
const logService = require("./common/logService");
const maskService = require("./common/maskService");

exports.get = (blipContatoId) => get(blipContatoId);
exports.getById = (id) => getById(id);
exports.update = (contato) => update(contato);
exports.createWhatsAppContact = (contato, atendente) => createWhatsAppContact(contato, atendente);

module.exports = exports;

/**
 * Cria novo contato de WhatsApp no Blip e no banco de dados.
 * @param {Contato} contato
 * @param {Atendente} atendente
 * @returns {Promise<ResponseHttp>}
 */
async function createWhatsAppContact(contato, atendente) {
    const newContactResponse = await getNewWhatsAppContact(contato, atendente)
    if (!newContactResponse.success) {
        return new ResponseHttp(httpCodeEnum.BAD_REQUEST,
            newContactResponse.message);
    }

    const contact = newContactResponse.contact;
    const res = await blipContactService.createInRouter(contact);

    if (res) {
        const contatoDb = await contatoRepository.getBlipContatoRoteadorId(contact.identity);

        if (contatoDb.id === 0) {
            contato.blipId = "";
            contato.blipRouterId = contact.identity;
            contato.whatsapp = contact.extras.whatsapp;
            const responseContatoDb = await contatoRepository.add({
                blipId: contato.blipId,
                blipRouterId: contato.blipRouterId,
                nome: contato.nome,
                whatsapp: contato.whatsapp,
                cidade: contato.cidade ? contato.cidade : "",
                telefone: contato.telefone ? contato.telefone : "",
                email: contato.email ? contato.email : "",
                empresa: contato.empresa ? contato.empresa : "",
                canal: canalEnum.whatsapp,
                urlFoto: contato.urlFoto ? contato.urlFoto : "",
                ativo: true
            });

            if (responseContatoDb.type === responseTypeEnum.success) {
                contato.id = responseContatoDb.content.insertId;
            }

            return new ResponseHttp(httpCodeEnum.OK, "Contato criado com sucesso", contato.id);
        } else {
            return new ResponseHttp(httpCodeEnum.OK, "Contato já existe", contatoDb.id);
        }
    } else {
        return new ResponseHttp(httpCodeEnum.BAD_REQUEST,
            "Ocorreu um erro ao criar o contato de WhatsApp no Blip.");
    }
}

/**
 * Valida o número de WhatsApp e mapeia o contato para o formato do Blip.
 * @param {Contato} contato
 * @param {Atendente} atendente
 * @returns {Promise<{success: boolean, contact: {phoneNumber: *, city: *, identity: *, name: *, extras: {whatsapp: (string|*), company: *}, source, email: *}, message: string}|{success: boolean, contact: null, message: string}>}
 */
async function getNewWhatsAppContact(contato, atendente) {
    contato.whatsapp = maskService.removeMask(maskService.whatsapp(contato.whatsapp));
    const whatsapp = commonService.formatWhatsAppWithDDI(contato.whatsapp);
    const numeroWhatsappComMais = (whatsapp && whatsapp.substring(0,1) === '+') ? whatsapp :  '+' + whatsapp;
    const blipResponse = await blipActiveMessagingService.isValidWhatsappAccount(numeroWhatsappComMais);

    if (!blipResponse) {
        await falhaService.addFalhaVerificacaoWhatsApp(atendente.id);
        return {
            success: false,
            message: "Não foi possível validar o número de WhatsApp.",
            contact: null
        }
    }

    const whatsappIdentifier = blipResponse.alternativeAccount;
    return {
        success: true,
        message: "Número de WhatsApp validado com sucesso.",
        contact: {
            identity: whatsappIdentifier,
            name: commonService.isNull(contato.nome, ""),
            email: commonService.isNull(contato.email, ""),
            phoneNumber: commonService.isNull(contato.telefone, ""),
            source: canalEnum.whatsapp.name,
            city: commonService.isNull(contato.cidade, ""),
            extras: {
                company: commonService.isNull(contato.empresa, ""),
                whatsapp: commonService.isNull(contato.whatsapp, "") === ""
                    ? ""
                    : commonService.formatWhatsAppWithDDI(contato.whatsapp)
            }
        }
    }
}

/**
 *  Busca contato no banco de dados e no Blip.
 * @param blipContatoId {string} - Identificador do contato no Blip.
 * @returns {Promise<*|Contato>}
 */
async function get(blipContatoId) {
    let contactIdentifier = "";
    let ehRouterId = false;

    if (blipContatoId.includes("@tunnel")) {
        const res = await contactService.getContactIdentifierByTunnel(blipContatoId)
        if (res) {
            contactIdentifier = res;
        }   
    } else {
        ehRouterId = true;
        contactIdentifier = blipContatoId;
    }

    let contatoDb = new Contato();
    if (ehRouterId) {
        contatoDb = await contatoRepository.getBlipContatoRoteadorId(contactIdentifier);
    } else {
        contatoDb = await contatoRepository.getBlipContatoId(blipContatoId);
        if (contatoDb.id === 0) {
            contatoDb = await contatoRepository.getBlipContatoRoteadorId(contactIdentifier);
        }
    }

    const blipContact = await blipContactService.get(blipContatoId, ehRouterId);
    const contato = contatoMap.contactToContato(blipContact);
    if (!contato || contato.blipId === "")
        return new Contato();

    if (contatoDb.id === 0) {
        contato.blipRouterId = contactIdentifier;
        contato.urlFoto = await sendPhoto(contato);
        contato.ativo = true;
        const responseContatoDb = await contatoRepository.add(contato);
        if (responseContatoDb.type === responseTypeEnum.success) {
            contato.id = responseContatoDb.content.insertId;
            await inativaOutrosContatosComMesmoWhatsApp(contato);
        }
        contato.whatsapp = maskService.removeMask(maskService.whatsapp(contato.whatsapp))

        return contato;
    } else {
        contato.id = contatoDb.id;
        contato.blipRouterId = contactIdentifier;
        contato.urlFoto = await sendPhoto(contato);
        contato.ativo = contatoDb.ativo;
        if (contatoDb.urlFoto !== "" && contato.urlFoto === "")
            contato.urlFoto = contatoDb.urlFoto;
        if (contato.id > 0) {
            await contatoRepository.update(contato);
        }
        contato.whatsapp = maskService.removeMask(maskService.whatsapp(contatoDb.whatsapp))
        return contato;
    }
}

async function inativaOutrosContatosComMesmoWhatsApp(contato) {
    if (contato.whatsapp && contato.whatsapp.length > 9 && contato.whatsapp.length < 14) {
        const ultimosOitoDigitos = contato.whatsapp.substring(contato.whatsapp.length - 8);
        const result = await contatoRepository.desativaContatos(ultimosOitoDigitos, contato.blipId);
        if (result.type !== responseTypeEnum.success) {
            logService.log("Erro ao desativar contatos com os mesmos últimos oito digitos no WhatsApp: " + ultimosOitoDigitos);
        }
    }
}

async function getById(id) {
    const contatoDb = await contatoRepository.get(id);
    contatoDb.telefone = maskService.removeMask(maskService.whatsapp(contatoDb.telefone))
    contatoDb.whatsapp = maskService.removeMask(maskService.whatsapp(contatoDb.whatsapp))
    return contatoDb;
}

async function update(contato) {
    const contatoNoBancoDados = await contatoRepository.get(contato.id);
    
    const contactBlip = await blipContactService.get(
        contatoNoBancoDados.blipRouterId || contatoNoBancoDados.blipId, 
        contatoNoBancoDados.blipRouterId !== "");

    const contact = contatoMap.contatoToContact(contato, contatoNoBancoDados, contactBlip);
    const routerContact = contatoMap.contatoToContact(contato, contatoNoBancoDados, contactBlip, true);

    if (contact) {
        const res = await blipContactService.update(contact);
        
        try {
            await blipContactService.update(routerContact, true);
        } catch (err) {
            logService.log("Erro ao atualizar contato no roteador: " + err);      
        }

        if (res) {
            const contatoAtualizadoNoBancoDados = await get(contatoNoBancoDados.blipId);

            return new ResponseHttp(httpCodeEnum.OK,
                "Contato atualizado com sucesso.",
                contatoAtualizadoNoBancoDados);
        } else {
            return new ResponseHttp(httpCodeEnum.BAD_REQUEST,
                "Ocorreu um erro ao atualizar o contato no Blip.");
        }
    }

    return new ResponseHttp(httpCodeEnum.NOT_FOUND,
        "Ocorreu um erro ao converter o contato.");
}

async function sendPhoto(contato) {
    if (contato.urlFoto) {
        const conteudo = await fileService.downloadAndSendS3(`${contato.id}`, {
            uri: contato.urlFoto,
            fileName: `${contato.nome}`,
            title: `Foto de perfil ${contato.nome}`
        }, "contatos");

        return conteudo.uri;
    }

    return "";
}