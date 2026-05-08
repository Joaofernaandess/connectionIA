exports.validaParametros = (req, res, next) => validaParametros(req, res, next);
exports.validaHeaders = (req, res, next) => validaHeaders(req, res, next);

module.exports = exports;

function validaParametros(req, res, next) {
    if (req.query.username == "undefined" || req.query.password == "undefined") {
        res.status(401);
        res.json({
            "mensagem": "Por favor informe usuário e senha."
        });
    } else {
        next();
    }
}

function validaHeaders(req, res, next) {
    const authorization = req.headers["authorization"];

    if (!authorization) {
        res.status(401);
        res.json({
            "mensagem": "Authorization não informado."
        });
    } else {
        next();
    }
}