//#region Imports
const atendimentoRepository = require('../repositories/atendimentoRepository');
const atendenteRepository = require('../repositories/atendenteRepository');
const contatoRepository = require('../repositories/contatoRepository')
const departamentoAtendenteRepository = require("../repositories/departamentoAtendenteRepository");
const equipeAtendenteRepository = require("../repositories/equipeAtendenteRepository");
const equipeRepository = require("../repositories/equipeRepository");

const blipContactService = require('./blip/contactService');
const blipActiveMessagingService = require('./blip/activeNotificationService');
const blipStatusService = require('./blip/statusService');

const contatoService = require('./contatoService');
const atendimentoMensagemService = require('./atendimentoMensagemService');
const atendimentoAtividadeService = require('./atendimentoAtividadeService');
const modeloService = require('./modeloService');
const falhaService = require('./falhaService');

const userService = require('./external_access/userService');
const validationService = require('./common/validationService');
const propriedadeParametroProvider = require('../providers/propriedadeParametroProvider');
const httpCodeEnum = require('../enums/httpCodeEnum');

const contatoMap = require('../maps/contatoMap');
const statusEnum = require('../enums/statusEnum');
const blipStatusEnum = require('../enums/blip/statusEnum');
const responseTypeEnum = require("../enums/responseTypeEnum");
const statusCodesEnum = require("../enums/httpCodeEnum");
const atividadeEnum = require("../enums/atividadeEnum");
const propriedadeParametroEnum = require("../enums/propriedadeParametroEnum");

const Atendimento = require("../entities/atendimento");
const Contato = require("../entities/contato");
const Atendente = require("../entities/atendente");
const AtendimentoMensagem = require("../entities/atendimentoMensagem");
const ResponseHttp = require("../entities/responseHttp");
const commonService = require("./common/commonService");
const maskService = require("./common/maskService");
const s3Service = require("./common/s3Service");
const blipApiService = require("./blip/apiService");
const departamentoEnum = require("../enums/departamentoEnum");
const contactService = require("./blip/contactService");

//#endregion

exports.enviaNotificacaoAtivaWhatsapp = (request, atendenteLogado) =>
    enviaNotificacaoAtivaWhatsapp(request, atendenteLogado);
exports.enviaNotificacaoEmMassaWhatsapp = (request) =>
    enviaNotificacaoEmMassaWhatsapp(request);
exports.getModelos = (comParametros) => getModelos(comParametros);
exports.getModelo = (modeloId, comParametros) => getModelo(modeloId, comParametros);
exports.getContatos = () => getContatos();
exports.getAtendentePermissoes = (atendenteLogado) => getAtendentePermissoes(atendenteLogado);

module.exports = exports;

//#region Definição de tipos

/**
 * @typedef {{parametroId: number, nome: string, tipo: number, valor: string}} ParametroNotificacaoAtiva
 * @typedef {{contatoId?: number, contato?: Contato, modeloId: number, params: ParametroNotificacaoAtiva[], pdfBase64?: string, pdfFileName?: string}} RequestNotificacaoAtiva
 */

//#endregion

//#region Envio de Notificação Ativa

/** Envia uma notificação ativa para um contato pelo WhatsApp
 * @param { RequestNotificacaoAtiva } request - Dados para envio da notificação ativa pelo WhatsApp
 * @param { Atendente } atendenteLogado - Atendente que iniciou o pedido
 * @returns { ResponseHttp } - Resposta da requisição
 */
async function enviaNotificacaoAtivaWhatsapp(request, atendenteLogado) {
    const responsePreparaEnvio = await preparaEnvioNotificacaoAtiva(request, atendenteLogado);
    if (!responsePreparaEnvio.sucesso) return retornaBadRequest(responsePreparaEnvio.erro, responsePreparaEnvio.mensagem);
    const { atendente, modelo, conteudoPreenchido, contato, params, pdfBase64, pdfFileName } = responsePreparaEnvio;

    // Prepara headerParams se houver PDF
    let headerParams = null;
    if (pdfBase64) {
        try {
            // Usa o nome original do arquivo ou um nome padrão
            const fileName = pdfFileName || 'documento.pdf';

            // Faz upload do PDF para o S3 preservando o nome original
            const pdfUrl = await s3Service.uploadBase64ToS3(pdfBase64, fileName, 'application/pdf');

            // Gera URL pré-assinada para o Blip
            const presignedUrl = await s3Service.getPresignedUrl(pdfUrl);

            headerParams = [{
                tipo: 'document',
                link: presignedUrl,
                filename: fileName
            }];
        } catch (error) {
            console.error('Erro ao processar PDF:', error);
            return new ResponseHttp(httpCodeEnum.BAD_REQUEST,
                "Ocorreu um erro ao processar o arquivo PDF.");
        }
    }

    if (!await blipActiveMessagingService.sendWhatsappActiveMessage(modelo.nome, contato.blipRouterId, params, headerParams)) {
        return new ResponseHttp(httpCodeEnum.BAD_REQUEST,
            "Ocorreu um erro ao tentar enviar esta mensagem.");
    }

    const atendimento = await criarAtendimento(atendente, contato);
    if (!atendimento || !atendimento.id) {
        return new ResponseHttp(httpCodeEnum.BAD_REQUEST,
            "Ocorreu um erro ao tentar criar o atendimento. Mas a mensagem foi enviada com sucesso.");
    }

    const responseMensagem =
        await atendimentoMensagemService
            .addNotificacaoAtiva(atendimento, contato, atendente.id, modelo.id, conteudoPreenchido);

    if (responseMensagem.httpCode !== 200) {
        return new ResponseHttp(httpCodeEnum.BAD_REQUEST,
            `${responseMensagem.mensagem}. Mas a mensagem foi enviada com sucesso.`);
    }

    return new ResponseHttp(httpCodeEnum.OK,
        "Mensagem enviada com sucesso.");
}

/** Envia uma notificação em massa para múltiplos contatos pelo WhatsApp via API externa (SommusGestor)
 * @param { Object } request - Dados para envio em massa (contatos, modeloId, flowId, stateId, nomeCampanha)
 * @returns { ResponseHttp } - Resposta da requisição
 */
async function enviaNotificacaoEmMassaWhatsapp(request) {
    console.log('[enviaNotificacaoEmMassaWhatsapp] agendamento recebido:', request.agendamento);

    if (!request.contatos || !Array.isArray(request.contatos)) {
        return new ResponseHttp(httpCodeEnum.BAD_REQUEST, 'A lista de contatos é obrigatória e deve ser um array.', 'CONTATOS_INVALIDOS');
    }

    let audiences = [];

    // Mapeamento dos contatos para o formato exigido pelo Blip Active Campaign
    for (const contatoItem of request.contatos) {
        if (!contatoItem.whatsapp) continue;

        let whatsappNumero = maskService.removeMask(contatoItem.whatsapp);
        whatsappNumero = commonService.formatWhatsAppWithDDI(whatsappNumero);
        const ehWhatsappValido = validationService.isValidBrazilianCellphone(whatsappNumero);

        if (!ehWhatsappValido) continue;

        let messageParams = {};

        // Header de documento (PDF) — índice "0" para o header do template
        // Gera URL pré-assinada a partir da URL bruta recebida do SommusGestor
        if (contatoItem.documentoUrl) {
            messageParams["0"] = await s3Service.getPresignedUrl(contatoItem.documentoUrl);
        }

        // Parâmetros do body do template ({{1}}, {{2}}, {{3}})
        if (contatoItem.parametros && Array.isArray(contatoItem.parametros)) {
            for (const param of contatoItem.parametros) {
               messageParams[param.index.toString()] = param.valor;
            }
        }

        audiences.push({
            recipient: whatsappNumero,
            messageParams: messageParams
        });
    }

    if (audiences.length === 0) {
        return new ResponseHttp(httpCodeEnum.BAD_REQUEST, 'Nenhum contato válido foi formatado para a campanha.', 'SEM_CONTATOS_VALIDOS');
    }

    const campaignName = request.nomeCampanha || `Campanha - ${new Date().toISOString()}`;

    let agendamentoUtc = null;
    if (request.agendamento) {
        // Interpreta o horário como horário de Brasília (UTC-3) e converte para UTC
        const [datePart, timePart] = request.agendamento.split(' ');
        const localDate = new Date(`${datePart}T${timePart}:00-03:00`);
        const pad = (n) => String(n).padStart(2, '0');
        agendamentoUtc = `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())} ${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}`;
        console.log(`[enviaNotificacaoEmMassaWhatsapp] agendamento local: ${request.agendamento} → UTC: ${agendamentoUtc}`);
    }

    const result = await blipActiveMessagingService.sendWhatsappMassCampaign(
        campaignName,
        request.flowId,
        request.stateId,
        'enviar_boleto_04',
        audiences,
        agendamentoUtc
    );

    if (!result.success) {
        return new ResponseHttp(httpCodeEnum.BAD_REQUEST, result.message, result.details);
    }

    return new ResponseHttp(httpCodeEnum.OK, result.message, { campaignId: result.campaignId });
}

/**
 * Prepara os dados para envio da notificação ativa pelo WhatsApp
 * @param request {RequestNotificacaoAtiva} - Dados para envio da notificação ativa pelo WhatsApp
 * @param atendenteLogado {Atendente} - Atendente que iniciou o pedido
 * @returns {Promise<{atendente: *, conteudoPreencido: string, params: ActiveNotificationParameter[], sucesso: boolean, modelo: Modelo, contato: Contato}|{erro: string, mensagem: (*|(function(): string)), sucesso: boolean}|{erro: string, mensagem: string, sucesso: boolean}|{erro: string, mensagem: *, sucesso: boolean}|{erro: string, mensagem: (null|string|*), sucesso: boolean}>}
 */
async function preparaEnvioNotificacaoAtiva(request, atendenteLogado) {
    const responseAtendente = await getAtendente(atendenteLogado.id);
    if (!responseAtendente.sucesso) return { sucesso: false, erro: responseAtendente.erro, mensagem: responseAtendente.mensagem };
    const atendente = responseAtendente.atendente;

    const responseModelo = await modeloService.getModeloById(request.modeloId, true);
    if (!responseModelo.success) return { sucesso: false, erro: 'MODELO_NAO_ENCONTRADO', mensagem: responseModelo.mensagem }
    const modelo = responseModelo.data;

    // Valida se o modelo exige anexo (tipo > 1) e se foi anexado
    if (modelo.tipo > 1 && !request.pdfBase64) {
        const tipoAnexo = getNomeTipoAnexo(modelo.tipo);
        return { 
            sucesso: false, 
            erro: 'ANEXO_OBRIGATORIO', 
            mensagem: `Este modelo exige um arquivo ${tipoAnexo} anexado.` 
        };
    }

    let conteudo = modelo.conteudo;
    const validacaoParametros = validaParametros(request, modelo);
    if (!validacaoParametros.sucesso) return { sucesso: false, erro: validacaoParametros.erro, mensagem: validacaoParametros.mensagem };

    const responseValidaContato = await validaContato(request, atendenteLogado);
    if (!responseValidaContato.sucesso) return { sucesso: false, erro: responseValidaContato.erro, mensagem: responseValidaContato.mensagem };
    const contato = responseValidaContato.contato;

    const responsePreparaParametros = preparaParametrosDoModelo(request, modelo, conteudo, contato);
    if (responsePreparaParametros.erro) return { sucesso: false, erro: responsePreparaParametros.erro.id, mensagem: responsePreparaParametros.erro.mensagem }
    const { conteudoPreenchido, params } = responsePreparaParametros;

    return {
        sucesso: true,
        atendente,
        modelo,
        conteudoPreenchido,
        contato,
        params: params,
        pdfBase64: request.pdfBase64 || null,
        pdfFileName: request.pdfFileName || null
    }
}


//#region Atendimento
/**
 *  Cria um atendimento
 * @param atendente {Atendente}
 * @param contato {Contato}
 * @returns {Promise<Atendimento>}
 */
async function criarAtendimento(atendente, contato) {
    const atendimento = await createAtendimento(atendente, contato);
    return await addAtendimento(atendimento);
}

/**
 *  Instancia um atendimento
 * @param atendente {Atendente}
 * @param contato {Contato}
 * @returns {Promise<Atendimento>}
 */
async function createAtendimento(atendente, contato) {
    let atendimento = new Atendimento()

    atendimento.blipAtendimentoId = null;
    atendimento.atendente = atendente;
    atendimento.contato = contato;
    atendimento.equipe.id = atendente.equipePrincipalId;
    atendimento.dataHora = new Date();
    atendimento.departamento.id = atendente.departamentoPrincipalId;
    atendimento.status = blipStatusEnum.pending;

    return atendimento;
}

/**
 * Adiciona um atendimento
 * @param atendimento {Atendimento}
 * @returns {Promise<Atendimento>}
 */
async function addAtendimento(atendimento) {
    const responseAdd = await atendimentoRepository.add(atendimento);
    if (responseAdd.type === responseTypeEnum.success) {
        atendimento.id = responseAdd.content.insertId;
    }
    return atendimento;
}

//#endregion

//#region Contato
/**
 * Valida o contato
 * @param request {RequestNotificacaoAtiva} - Dados para envio da notificação ativa pelo WhatsApp
 * @param atendenteLogado {Atendente} - Atendente que iniciou o pedido
 * @returns {Promise<{sucesso: boolean, contato: Contato}|{erro: string, mensagem: null, sucesso: boolean}|{erro: string, mensagem: string, sucesso: boolean}>}
 */
async function validaContato(request, atendenteLogado) {
    if (!request.contato && !request.contatoId) {
        return {
            sucesso: false,
            erro: "CONTATO_NAO_INFORMADO",
            mensagem: "O contato não foi informado."
        }
    }

    let contatoDb = null;
    if (request.contatoId) {
        contatoDb = await contatoService.getById(request.contatoId);
        contatoDb.whatsapp = commonService.formatWhatsAppWithDDI(contatoDb.whatsapp);
        if (!contatoDb.blipRouterId) {
            const res = await contactService.getContactIdentifierByTunnel(contatoDb.blipId);
            if (res) {
                contatoDb.blipRouterId = res;
                await contatoRepository.update(contatoDb);
            }
        }
        const atendimentosAbertos = await atendimentoRepository.getNaoFinalizadosPorContatoId(contatoDb.id);
        if (atendimentosAbertos && atendimentosAbertos.length > 0) {
            return {
                sucesso: false,
                erro: "CONTATO_POSSUI_ATENDIMENTO_ABERTO",
                mensagem: "O contato já possui um atendimento aberto."
            }
        }

        const atendimentosFinalizadosSemNota = await atendimentoRepository.getFinalizadosSemNotaPorContatoId(contatoDb.id);
        if (atendimentosFinalizadosSemNota && atendimentosFinalizadosSemNota.length > 0) {
            return {
                sucesso: false,
                erro: "CONTATO_POSSUI_ATENDIMENTO_FINALIZADO_RECENTEMENTE_SEM_NOTA",
                mensagem: "O último atendimento finalizado deste contato ainda está aguardando avaliação."
            }
        }
    } else if (request.contato) {
        request.contato.whatsapp = maskService.removeMask(request.contato.whatsapp);
        request.contato.whatsapp = commonService.formatWhatsAppWithDDI(request.contato.whatsapp);
        const ehWhatsappValido = validationService.isValidBrazilianCellphone(request.contato.whatsapp);
        if (!ehWhatsappValido) {
            return {
                sucesso: false,
                erro: "WHATSAPP_INVALIDO",
                mensagem: "O número de WhatsApp não é um número de celular válido no Brasil."
            }
        }

        request.contato.whatsapp = commonService.formatWhatsAppWithDDI(maskService.removeMask(maskService.whatsapp(request.contato.whatsapp)));
        contatoDb = await contatoRepository.getPorNumeroWhatsapp(request.contato.whatsapp);

        if (contatoDb && contatoDb.id) {
            return {
                sucesso: false,
                erro: 'CONTATO_JA_EXISTE',
                mensagem: "Não é possível criar um novo contato pois já existe um contato com o número de WhatsApp informado."
            };
        } else {
            const podeVerificar = await validaSeAtendentePodeVerificarWhatsapp(atendenteLogado.id);
            if (!podeVerificar.sucesso) {
                return {
                    sucesso: false,
                    erro: podeVerificar.erro,
                    mensagem: podeVerificar.mensagem
                }
            }

            const responseCriarContato = await contatoService.createWhatsAppContact(request.contato, atendenteLogado);
            if (responseCriarContato.httpCode !== 200) {
                return {
                    sucesso: false,
                    erro: 'ERRO_CRIAR_CONTATO',
                    mensagem: responseCriarContato.message
                };
            }

            contatoDb = await contatoService.getById(responseCriarContato.data);
            contatoDb.whatsapp = commonService.formatWhatsAppWithDDI(contatoDb.whatsapp);
        }
    }

    let contato = new Contato();
    if (!contatoDb || !contatoDb.id || !contatoDb.blipRouterId) {
        return {
            sucesso: false,
            erro: "CONTATO_NAO_ENCONTRADO",
            mensagem: "Ocorreu um erro ao tentar recuperar o contato."
        }
    } else {
        contato = contatoDb;
    }

    return {
        sucesso: true,
        contato
    };
}

/**
 *  Verifica se o atendente pode verificar o whatsapp
 * @param atendenteId {number}
 * @returns {Promise<{sucesso: boolean}|{erro: string, mensagem: string, sucesso: boolean}>}
 */
async function validaSeAtendentePodeVerificarWhatsapp(atendenteId) {
    const { podeVerificar, minutosRestantes } = await falhaService.atendentePodeVerificarWhatsapp(atendenteId);
    if (!podeVerificar) {
        const horaMinutos = minutosRestantes > 60
            ? `${Math.floor(minutosRestantes / 60)} hora(s) e ${minutosRestantes % 60} minuto(s)`
            : `${minutosRestantes} minuto(s).`;
        return {
            sucesso: false,
            erro: "ATENDENTE_NAO_PODE_VERIFICAR_WHATSAPP",
            mensagem: "O atendente não pode verificar o WhatsApp. Tente novamente em " + horaMinutos
        }
    }
    return {
        sucesso: true
    };
}
//#endregion

//#region Atendente
/**
 * Recupera o atendente
 * @param atendenteId {number} - Id do atendente
 * @returns {Promise<{erro: string, mensagem: *, sucesso: boolean}|{atendente: *, sucesso: boolean}>}
 */
async function getAtendente(atendenteId) {
    const atendente = await atendenteRepository.get(atendenteId);
    const atendenteDepartamentos = await departamentoAtendenteRepository.getByAtendenteId(atendenteId)
    const atendenteEquipes = await equipeAtendenteRepository.getByAtendenteId(atendenteId)

    const departamentoPrincipal = atendenteDepartamentos.find(d => d.principal);
    const equipePrincipal = atendenteEquipes.find(e => e.principal);

    if (!departamentoPrincipal || !equipePrincipal) {
        return {
            sucesso: false,
            erro: "ATENDENTE_INVALIDO",
            mensagem: "O atendente não possui um departamento ou equipe principal configurado."
        };
    }

    atendente.departamentoPrincipalId = departamentoPrincipal.departamento.id;
    atendente.equipePrincipalId = equipePrincipal.equipe.id;

    const atendenteValidacaoResultado = await validaAtendente(atendente);
    console.log(atendenteValidacaoResultado)
    if (!atendenteValidacaoResultado.isValid) {
        return {
            sucesso: false,
            erro: "ATENDENTE_INVALIDO",
            mensagem: atendenteValidacaoResultado.message
        }
    }
    return {
        sucesso: true,
        atendente
    };
}

/**
 * Valida o atendente
 * @param atendente {Atendente} - Atendente que iniciou o pedido
 * @returns {{isValid: boolean}|{message: string, isValid: boolean}}
 */
async function validaAtendente(atendente) {
    if (!atendente) return {
        isValid: false,
        message: "Atendente não encontrado.",
    };

    if (!atendenteOnline(atendente)) return {
        isValid: false,
        message: "Atendente que iniciou o pedido não está logado.",
    };

    return {
        isValid: true
    }
}

/**
 * Verifica se o atendente está online
 * @param atendente {Atendente} - Atendente que iniciou o pedido
 * @returns {boolean} - Retorna true se o atendente estiver online
 */
function atendenteOnline(atendente) {
    const user = userService.getUserByEmail(atendente.email);
    let status = false;

    if (user && user.length > 0) {
        status = true;
    }

    return status;
}
//#endregion

//#region Modelo e Parametros
/**
 * Valida se os parâmetros do modelo foram informados
 * @param request {RequestNotificacaoAtiva} - Dados para envio da notificação ativa pelo WhatsApp
 * @param modelo {Modelo} - Modelo da notificação ativa
 * @returns {{sucesso: boolean}|{erro: string, mensagem: (*|(function(): string)), sucesso: boolean}}
 */
function validaParametros(request, modelo) {
    let erroParametro = [];
    if (modelo.parametros && modelo.parametros.length > 0) {
        modelo.parametros.forEach(param => {
            if (request.params.findIndex(p => p.parametroId === param.id) === -1) {
                erroParametro.push({
                    mensagem: `O parâmetro {{${param.nome}}} não foi informado.`,
                    parametro: param.nome
                });
            }
        });

        if (erroParametro.length > 0) {
            return {
                sucesso: false,
                erro: "PARAMETRO_NAO_INFORMADO",
                mensagem: erroParametro.length === 1 ? erroParametro[0].mensagem : () => {
                    let mensagem = "Os parâmetros a seguir não foram informados: ";
                    erroParametro.forEach(erro => {
                        mensagem += `${erro.parametro}, `;
                    });
                    mensagem = mensagem.substring(0, mensagem.length - 2);
                    return mensagem;
                }
            };
        }

        return {
            sucesso: true
        }
    }
}

/**
 *  Prepara os parâmetros do modelo para serem enviados na notificação ativa
 * @param request {RequestNotificacaoAtiva} - Dados para envio da notificação ativa pelo WhatsApp
 * @param modelo {Modelo} - Modelo da notificação ativa
 * @param conteudo {string} - Conteúdo do modelo
 * @param contato {Contato} - Contato que receberá a notificação ativa
 * @returns {{conteudoPreenchido: string, params: ActiveNotificationParameter[]} | {erro: {id:string, mensagem:string}}}
 */
function preparaParametrosDoModelo(request, modelo, conteudo, contato) {
    let params = [];
    if (request.params && request.params.length > 0) {
        for (const param of request.params) {
            const modeloParametro = modelo.parametros.find(p => p.id === param.parametroId);
            if (modeloParametro) {
                if (modeloParametro.propriedade) {
                    const propriedade = propriedadeParametroProvider.getById(modeloParametro.propriedade)
                    if (!propriedade) {
                        return {
                            erro: {
                                id: "PROPRIEDADE_PARAMETRO_NAO_ENCONTRADA",
                                mensagem: `Propriedade do parâmetro ${modeloParametro.ordem} não encontrada`
                            }
                        };
                    }
                    switch (propriedade.id) {
                        case propriedadeParametroEnum.nome.id:
                            conteudo = conteudo.replace(`{{${modeloParametro.ordem}}}`, contato.nome);
                            param.valor = contato.nome;
                            break;
                        case propriedadeParametroEnum.cidade.id:
                            conteudo = conteudo.replace(`{{${modeloParametro.ordem}}}`, contato.cidade);
                            param.valor = contato.cidade;
                            break;
                        case propriedadeParametroEnum.empresa.id:
                            conteudo = conteudo.replace(`{{${modeloParametro.ordem}}}`, contato.empresa);
                            param.valor = contato.empresa;
                            break;
                    }
                } else {
                    conteudo = conteudo.replace(`{{${modeloParametro.ordem}}}`, param.valor);
                }
                params.push({
                    index: modeloParametro.ordem,
                    name: modeloParametro.nome,
                    text: param.valor
                });
            } else {
                return {
                    erro: {
                        id: "PARAMETRO_MODELO_NAO_ENCONTRADO",
                        mensagem: `Parâmetro ${param.parametroId} não encontrado no modelo ${request.modeloId}`
                    }
                }
            }
        }
    }
    return {
        conteudoPreenchido: conteudo,
        params
    };
}
//#endregion

//#endregion

//#region Modelo

async function getModelo(modeloId, comParametros) {
    const responseModelo = await modeloService.getModeloById(modeloId, comParametros);
    if (!responseModelo.success) return new ResponseHttp(httpCodeEnum.BAD_REQUEST, responseModelo.message);
    return new ResponseHttp(httpCodeEnum.OK, responseModelo.message, responseModelo.data);
}

async function getModelos(comParametros) {
    const responseModelo = await modeloService.getModelos(comParametros);
    if (!responseModelo.success) return new ResponseHttp(httpCodeEnum.BAD_REQUEST, responseModelo.message, []);
    return new ResponseHttp(httpCodeEnum.OK, responseModelo.message, responseModelo.data);
}

//#endregion

//#region Contato

async function getContatos() {
    const contatosValidos = await contatoRepository.getValidosParaEnvioNotificacaoAtivaWhatsapp();
    if (!contatosValidos || contatosValidos.length === 0)
        return new ResponseHttp(httpCodeEnum.NOT_FOUND,
            "Não há contatos válidos para iniciar novo atendimento via whatsapp", []);
    return new ResponseHttp(httpCodeEnum.OK, 'Contatos recuperados com sucesso!', contatosValidos);
}

//#endregion

/**
 * Retorna o nome legível do tipo de anexo baseado no tipo do modelo
 * @param {number} tipo - 1=texto, 2=imagem, 3=documento, 4=video
 * @returns {string} Nome do tipo de anexo
 */
function getNomeTipoAnexo(tipo) {
    const tipoModeloEnum = require('../enums/tipoModeloEnum');
    switch (tipo) {
        case tipoModeloEnum.imagem.id: return 'imagem';
        case tipoModeloEnum.documento.id: return 'PDF';
        case tipoModeloEnum.video.id: return 'vídeo';
        default: return 'arquivo';
    }
}

/**
 * Retorna um ResponseHttp com status 400
 * @param erro {string} - Código do erro
 * @param mensagem {string} - Mensagem de erro
 * @returns {ResponseHttp} - Resposta da requisição
 */
function retornaBadRequest(erro, mensagem) {
    return new ResponseHttp(httpCodeEnum.BAD_REQUEST, mensagem, erro);
}


/**
 * Retorna as permissões do atendente logado
 * @param {Atendente} atendenteLogado 
 * @returns {Promise<ResponseHttp>} - Resposta da requisição
 */
async function getAtendentePermissoes(atendenteLogado) {
    try {
        const atendente = await atendenteRepository.get(atendenteLogado.id);
        if (!atendente) {
            return new ResponseHttp(httpCodeEnum.NOT_FOUND, "Atendente não encontrado");
        }

        const permissoes = {
            podeEnviarNotificacaoAtiva: true
        }

        return new ResponseHttp(httpCodeEnum.OK, "Permissões recuperadas com sucesso", permissoes);
    } catch (error) {
        return new ResponseHttp(httpCodeEnum.INTERNAL_SERVER_ERROR, "Erro interno", error);
    }
}