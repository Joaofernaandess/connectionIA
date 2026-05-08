const Contato = require('../entities/contato');

const responseTypeEnum = require('../enums/responseTypeEnum');

const canalProvider = require('../providers/canalProvider');

const databaseService = require('../services/common/databaseService');
const maskService = require('../services/common/maskService');

exports.add = (contato) => add(contato);
exports.update = (contato) => update(contato);
exports.getBlipContatoId = (blipContatoId) => getBlipContatoId(blipContatoId);
exports.getBlipContatoRoteadorId = (blipContatoId) => getBlipContatoRoteadorId(blipContatoId);
exports.get = (id) => get(id);
exports.getPorNumeroWhatsapp = (numeroWhatsapp) => getPorNumeroWhatsapp(numeroWhatsapp);
exports.getValidosParaEnvioNotificacaoAtivaWhatsapp = () => getValidosParaEnvioNotificacaoAtivaWhatsapp();
exports.desativaContatos = (ultimosOitoDigitosWhatsapp, blipIdExcecao) => desativaContatos(ultimosOitoDigitosWhatsapp, blipIdExcecao);

module.exports = exports;

async function add(contato) {
    const query = `
            INSERT INTO contato(
                blip_contato_id,
                blip_contato_roteador_id,
                nome,
                cidade,
                telefone,
                whatsapp,
                email,
                empresa,
                canal,
                url_foto,
                ativo
            ) VALUES (
                ${contato.blipId ? `'${contato.blipId}'` : "NULL"},
                ${contato.blipRouterId ? `'${contato.blipRouterId}'` : "NULL"},
                "${contato.nome}",
                "${contato.cidade}",
                "${maskService.removeMask(contato.telefone)}",
                "${maskService.removeMask(contato.whatsapp)}",
                "${contato.email}",
                "${contato.empresa}",
                ${contato.canal ? contato.canal.id : 0},
                "${contato.urlFoto}",
                ${contato.ativo ? 1 : 0}
            );
        `
    const queryResult = await databaseService.execute(query);

    return queryResult;
}

/**
 *  Atualiza um contato no banco de dados
 * @param contato {Contato} - Contato a ser atualizado
 * @returns {Promise<*>}
 */
async function update(contato) {
    console.log("iniciando update");
    console.log(contato);
    const query = `
        UPDATE contato

        SET blip_contato_id             = "${contato.blipId}",
            blip_contato_roteador_id    = ${contato.blipRouterId ? `"${contato.blipRouterId}"` : "NULL"},
            nome                        = "${contato.nome}",
            cidade                      = "${contato.cidade}",
            telefone                    = "${maskService.removeMask(contato.telefone)}",
            whatsapp                    = "${maskService.removeMask(contato.whatsapp)}",
            email                       = "${contato.email}",
            empresa                     = "${contato.empresa}",
            url_foto                    = "${contato.urlFoto}",
            ativo                       = ${contato.ativo ? 1 : 0}

        WHERE contato_id      = ${contato.id};
    `;

    const queryResult = await databaseService.execute(query);

    return queryResult;
}

async function getBlipContatoId(blipContatoId) {
    let contato = new Contato();

    const queryResult = await databaseService.execute(`
        SELECT contato_id,
               blip_contato_id,
               blip_contato_roteador_id,
               nome,
               cidade,
               telefone,
               whatsapp,
               email,
               empresa,
               canal,
               url_foto,
               ativo

          FROM contato

         WHERE blip_contato_id = "${blipContatoId}"
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        const contatoDb = queryResult.content[0];

        if (contatoDb) {
            contato.id = contatoDb.contato_id;
            contato.blipId = contatoDb.blip_contato_id;
            contato.blipRouterId = contatoDb.blip_contato_roteador_id;
            contato.nome = contatoDb.nome;
            contato.cidade = contatoDb.cidade;
            contato.telefone = maskService.removeMask(maskService.whatsapp(contatoDb.telefone));
            contato.whatsapp = maskService.removeMask(maskService.whatsapp(contatoDb.whatsapp));
            contato.email = contatoDb.email;
            contato.empresa = contatoDb.empresa;
            contato.canal = canalProvider.getById(contatoDb.canal);
            contato.urlFoto = contatoDb.url_foto;
            contato.ativo = contatoDb.ativo;
        }
    }

    return contato;
}

async function getBlipContatoRoteadorId(blipContatoRoteadorId) {
    let contato = new Contato();

    const queryResult = await databaseService.execute(`
        SELECT contato_id,
               blip_contato_id,
               blip_contato_roteador_id,
               nome,
               cidade,
               telefone,
               whatsapp,
               email,
               empresa,
               canal,
               url_foto,
               ativo

          FROM contato

         WHERE blip_contato_roteador_id = "${blipContatoRoteadorId}"
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        const contatoDb = queryResult.content[0];

        if (contatoDb) {
            contato.id = contatoDb.contato_id;
            contato.blipId = contatoDb.blip_contato_id;
            contato.blipRouterId = contatoDb.blip_contato_roteador_id;
            contato.nome = contatoDb.nome;
            contato.cidade = contatoDb.cidade;
            contato.telefone = maskService.removeMask(maskService.whatsapp(contatoDb.telefone));
            contato.whatsapp = maskService.removeMask(maskService.whatsapp(contatoDb.whatsapp));
            contato.email = contatoDb.email;
            contato.empresa = contatoDb.empresa;
            contato.canal = canalProvider.getById(contatoDb.canal);
            contato.urlFoto = contatoDb.url_foto;
            contato.ativo = contatoDb.ativo;
        }
    }

    return contato;
}

async function getPorNumeroWhatsapp(numeroWhatsapp) {
    let contato = new Contato();

    const queryResult = await databaseService.execute(`
        SELECT contato_id,
               blip_contato_id,
               blip_contato_roteador_id,
               nome,
               cidade,
               telefone,
               whatsapp,
               email,
               empresa,
               canal,
               url_foto,
               ativo

          FROM contato

         WHERE whatsapp = '${numeroWhatsapp}' AND ativo = 1
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        const contatoDb = queryResult.content[0];

        if (contatoDb) {
            contato.id = contatoDb.contato_id;
            contato.blipId = contatoDb.blip_contato_id;
            contato.blipRouterId = contatoDb.blip_contato_roteador_id;
            contato.nome = contatoDb.nome;
            contato.cidade = contatoDb.cidade;
            contato.telefone = maskService.removeMask(contatoDb.telefone);
            contato.whatsapp = maskService.removeMask(maskService.whatsapp(contatoDb.whatsapp));
            contato.email = contatoDb.email;
            contato.empresa = contatoDb.empresa;
            contato.canal = canalProvider.getById(contatoDb.canal);
            contato.urlFoto = contatoDb.url_foto;
            contato.ativo = contatoDb.ativo;
        }
    }

    return contato;
}


async function get(id) {
    let contato = new Contato();

    const queryResult = await databaseService.execute(`
        SELECT contato_id,
               blip_contato_id,
               blip_contato_roteador_id,
               nome,
               cidade,
               telefone,
               whatsapp,
               email,
               empresa,
               canal,
               url_foto,
               ativo
          FROM contato
         WHERE contato_id = "${id}"
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        const contatoDb = queryResult.content[0];

        if (contatoDb) {
            contato.id = contatoDb.contato_id;
            contato.blipId = contatoDb.blip_contato_id;
            contato.blipRouterId = contatoDb.blip_contato_roteador_id;
            contato.nome = contatoDb.nome;
            contato.cidade = contatoDb.cidade;
            contato.email = contatoDb.email;
            contato.empresa = contatoDb.empresa;
            contato.telefone = maskService.removeMask(maskService.whatsapp(contatoDb.telefone));
            contato.whatsapp = maskService.removeMask(maskService.whatsapp(contatoDb.whatsapp));
            contato.canal = canalProvider.getById(contatoDb.canal);
            contato.urlFoto = contatoDb.url_foto;
            contato.ativo = contatoDb.ativo;
        }
    }

    return contato;
}

/**
 * Retorna os contatos válidos para envio de notificação ativa via whatsapp
 * @returns {Promise<Contato[]>} - Lista de contatos válidos para envio de notificação ativa via whatsapp
 */
async function getValidosParaEnvioNotificacaoAtivaWhatsapp() {
    let contatos = [];

    const queryResult = await databaseService.execute(`
        SELECT contato_id,
               blip_contato_id,
               blip_contato_roteador_id,
               nome,
               cidade,
               telefone,
               whatsapp,
               email,
               empresa,
               canal,
               url_foto,
               ativo

          FROM contato

         WHERE canal = 1 AND ativo = 1
    `);

    if (queryResult.type === responseTypeEnum.success && queryResult.content.length > 0) {
        queryResult.content.forEach(contatoDb => {
            let contato = new Contato();

            if (contatoDb) {
                contato.id = contatoDb.contato_id;
                contato.blipId = contatoDb.blip_contato_id;
                contato.blipRouterId = contatoDb.blip_contato_roteador_id;
                contato.nome = contatoDb.nome;
                contato.cidade = contatoDb.cidade;
                contato.email = contatoDb.email;
                contato.empresa = contatoDb.empresa;
                contato.telefone = maskService.removeMask(maskService.whatsapp(contatoDb.telefone));
                contato.whatsapp = maskService.removeMask(maskService.whatsapp(contatoDb.whatsapp));
                contato.canal = canalProvider.getById(contatoDb.canal);
                contato.urlFoto = contatoDb.url_foto;
                contato.ativo = contatoDb.ativo;

                contatos.push(contato);
            }
        });
    }

    return contatos;
}

/**
 * Desativa todos os contatos ativos com o número de whatsapp informado, exceto o contato do blipId informado
 * @param ultimosOitoDigitosWhatsapp {string} - Últimos 8 dígitos do número de whatsapp a ser pesquisado
 * @param blipId {string} - Identificador do contato no Blip
 * @returns {Promise<*>}
 */
async function desativaContatos(ultimosOitoDigitosWhatsapp, blipIdExcecao) {
    const query = `
        UPDATE contato

        SET ativo = 0

        WHERE whatsapp like "%${ultimosOitoDigitosWhatsapp}"
          AND blip_contato_id <> "${blipIdExcecao}"
    `;

    const queryResult = await databaseService.execute(query);
    return queryResult;
}