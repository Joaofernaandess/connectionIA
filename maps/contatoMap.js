const Contato = require('../entities/contato');

const canalService = require('../services/canalService');

const commonService = require('../services/common/commonService');

exports.contactToContato = (contact) => contactToContato(contact);
exports.contatoToContact = (contato, contatoDb, contactBlip, isRouter) => contatoToContact(contato, contatoDb, contactBlip, isRouter);

module.exports = exports;

function contactToContato(contact) {
    let contato = new Contato();

    if (!contact || !contact.identity)
        return contato;

    contato.blipId = contact.identity;
    contato.nome = contact.name;
    contato.cidade = commonService.isNull(contact.city, "");
    contato.email = commonService.isNull(contact.email, "");
    contato.telefone = commonService.isNull(contact.phoneNumber, "");
    contato.empresa = commonService.isNull(contact.extras.company, "");
    contato.urlFoto = commonService.isNull(contact.photoUri, "");
    contato.whatsapp = commonService.isNull(contact.extras.whatsapp, "");
    contato.canal = canalService.getCanal(contact.identity.split("@")[1], contact.source);

    return contato;
}

function contatoToContact(contato, contatoDb, contactBlip, isRouter = false) {
    if (!contatoDb.blipId)
        return null;

    return {
        identity: isRouter ? contatoDb.blipRouterId : contatoDb.blipId,
        name: commonService.isNull(contato.nome, ""),
        email: commonService.isNull(contato.email, ""),
        phoneNumber: commonService.isNull(contato.telefone, ""),
        photoUri: commonService.isNull(contactBlip.photoUri, ""),
        source: commonService.isNull(contatoDb.canal.name, commonService.isNull(contactBlip.source, "")),
        city: commonService.isNull(contato.cidade, ""),
        extras: {
            company: commonService.isNull(contato.empresa, ""),
            whatsapp: commonService.isNull(contato.whatsapp, "") === "" ? "" : commonService.formatWhatsAppWithDDI(contato.whatsapp)
        }
    }
}