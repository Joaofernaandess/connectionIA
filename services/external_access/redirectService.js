const ResponseHttp = require('../../entities/responseHttp');
const httpCodeEnum = require('../../enums/httpCodeEnum');

const redirecionamentoService = require('../redirecionamentoService');

exports.valid = (message) => valid(message);

module.exports = exports;

async function valid(message) {
    const redirectMessage = await redirecionamentoService.get(message);
    
    if (redirectMessage && redirectMessage.id > 0) {
        return new ResponseHttp(httpCodeEnum.OK, "", redirectMessage.mensagemRetorno);
    } else {
        return new ResponseHttp(httpCodeEnum.NOT_FOUND);
    }
}