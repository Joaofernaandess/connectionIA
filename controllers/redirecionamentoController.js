const redirecionamentoService = require('../services/redirecionamentoService');

exports.add = (req, res) => add(req, res);
exports.update = (req, res) => update(req, res);

module.exports = exports;

async function add(req, res) {
    const redirecionamento = req.body;

    const response = await redirecionamentoService.add(redirecionamento);
    
    res.status(response.httpCode);
    res.json({
        "mensagem": response.message
    });
}

async function update(req, res) {
    const redirecionamentoId = req.params.id;
    const redirecionamento = req.body;

    const response = await redirecionamentoService.update(redirecionamentoId, redirecionamento);
    
    res.status(response.httpCode);
    res.json({
        "mensagem": response.message
    });
}