const url = require('url');
const notificaoAtivaService = require('../services/notificacaoAtivaService');

exports.enviaNotificacaoAtivaWhatsapp = (req, res) => enviaNotificacaoAtivaWhatsapp(req, res);
exports.enviaNotificacaoEmMassaWhatsapp = (req, res) => enviaNotificacaoEmMassaWhatsapp(req, res);
exports.getModelos = (req, res) => getModelos(req, res);
exports.getContatos = (req, res) => getContatos(req, res);
exports.getAtendentePermissoes = (req, res) => getAtendentePermissoes(req, res);

/**
 * Envia notificação ativa para o whatsapp
 * @param req {Request} - Objeto com os dados da requisição
 * @param res {Response} - Objeto com os dados da resposta
 * @returns {ResponseHttp} - Objeto com os dados da resposta
 */
async function enviaNotificacaoAtivaWhatsapp(req, res) {
    const request = req.body.request;
    const atendenteLogado = JSON.parse(req.headers["atendente"]);

    // Extrai o PDF base64 se existir
    if (req.body.pdfBase64) {
        request.pdfBase64 = req.body.pdfBase64;
    }

    // Extrai o nome original do arquivo PDF se existir
    if (req.body.pdfFileName) {
        request.pdfFileName = req.body.pdfFileName;
    }

    if (!request) {
        res.status(400);
        await res.json({
            message: 'Request obrigatório.'
        });
        return;
    }

    const response = await notificaoAtivaService.enviaNotificacaoAtivaWhatsapp(request, atendenteLogado);

    res.status(response.httpCode);
    await res.json({
        message: response.message
    });
}

/**
 * Envia notificação em massa para o whatsapp via campanha Active Campaign Growth
 * @param req {Request} - Objeto com os dados da requisição
 * @param res {Response} - Objeto com os dados da resposta
 */
async function enviaNotificacaoEmMassaWhatsapp(req, res) {
    try {
        // Validar origem da requisição
        const origin = req.get('origin');
        if (!origin) {
            res.status(400);
            await res.json({ processo: "Falhou", mensagem: "Origin ausente" });
            return;
        }
        const ehSommusGestor = origin.includes("sommusgestor.com");
        if (!ehSommusGestor) {
            res.status(403);
            await res.json({ processo: "Falhou", mensagem: "Origin não permitido" });
            return;
        }

        const request = req.body.request;

        if (!request) {
            res.status(400);
            await res.json({ message: 'Request obrigatório.' });
            return;
        }

        const response = await notificaoAtivaService.enviaNotificacaoEmMassaWhatsapp(request);

        res.status(response.httpCode);
        await res.json({
            message: response.message,
            data: response.data
        });
    } catch (error) {
        res.status(500);
        await res.json({ message: error.message || 'Ocorreu um erro inesperado ao enviar a notificação em massa.' });
    }
}

/**
 * Retorna os modelos de notificação ativa
 * @param req {Request} - Objeto com os dados da requisição
 * @param res {Response} - Objeto com os dados da resposta
 * @returns {Promise<void>}
 */
async function getModelos(req, res) {
    try {
        const params = url.parse(req.url, true).query;
        const modeloId = params.id ? params.id : 0;
        const comParametros = params.comParametros;

        if (modeloId) {
            const response = await notificaoAtivaService.getModelo(modeloId, comParametros);

            res.status(response.httpCode);
            await res.json({
                message: response.message,
                modelos: [response.data]
            });
        } else {
            const response = await notificaoAtivaService.getModelos(comParametros);

            res.status(response.httpCode);
            await res.json({
                message: response.message,
                modelos: response.data
            });
        }
    } catch (error) {
        console.log(error);
    }
}

async function getContatos(req, res) {
    const response = await notificaoAtivaService.getContatos();

    res.status(response.httpCode);
    await res.json({
        message: response.message,
        contatos: response.data
    });
}


async function getAtendentePermissoes(req, res) {
    const atendenteLogado = JSON.parse(req.headers["atendente"]);
    const response = await notificaoAtivaService.getAtendentePermissoes(atendenteLogado);

    res.status(response.httpCode);
    await res.json({
        message: response.message,
        permissoes: response.data
    });
}