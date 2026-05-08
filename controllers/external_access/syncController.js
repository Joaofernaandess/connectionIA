const httpCodeEnum = require('../../enums/httpCodeEnum');

const syncService = require('../../services/external_access/syncService');

exports.sync = (req, res) => sync(req, res);
exports.status = (req, res) => status(req, res);

module.exports = exports;

async function sync(req, res) {
    const origin = req.get('origin');

    if (!origin) {
        res.status(httpCodeEnum.BAD_REQUEST);
        return res.send({ processo: "Falhou", mensagem: "Origin ausente" });
    }

    const ehSommusGestor = origin.includes("sommusgestor.com");
    if (!ehSommusGestor) {
        res.status(httpCodeEnum.FORBIDDEN);
        return res.send({ processo: "Falhou", mensagem: "Origin não permitido" });
    }

    if (String(req.query.wait || "") === "1") {
        const ok = await syncService.processar();
        res.status(ok ? httpCodeEnum.OK : httpCodeEnum.INTERNAL_SERVER_ERROR);
        return res.send({ processo: ok ? "Ok" : "Falhou" });
    }

    const result = syncService.start();

    if (result.disabled) {
        res.status(httpCodeEnum.FORBIDDEN);
        return res.send({ processo: "Falhou", mensagem: "Sync desabilitado", status: result.status });
    }

    res.status(httpCodeEnum.OK);
    return res.send({
        processo: "Ok",
        mensagem: result.started ? "Sync iniciado" : "Sync já em andamento",
        status: result.status
    });
}

function status(req, res) {
    res.status(httpCodeEnum.OK);
    return res.send(syncService.status());
}
