const loginService = require('../services/loginService');

exports.autentica = (req, res) => autentica(req, res);
exports.valida = (req, res) => valida(req, res);

module.exports = exports;

async function autentica(req, res) {
    const username = req.query.email;
    const password = req.query.password;

    const response = await loginService.autentica(username, password);
    
    res.status(response.httpCode);
    res.json({
        "mensagem": response.message,
        "data": response.data
    });
}

async function valida(req, res) {
    const authorization = req.headers["authorization"];

    const response = await loginService.valida(authorization);

    res.status(response.httpCode);
    res.json({
        "mensagem": response.message
    });
}