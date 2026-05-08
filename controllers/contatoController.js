const httpCodeEnum = require('../enums/httpCodeEnum');

const contatoService = require('../services/contatoService');

exports.update = (req, res) => update(req, res);

module.exports = exports;

async function update(req, res) {        
    const contato = req.body;
    const response = await contatoService.update(contato);
    
    res.status(response.httpCode);
    res.json({
        "mensagem": response.message,
        "contato": response.data
    });
}