const httpCodeEnum = require('../../enums/httpCodeEnum');

const commonService = require('../../services/common/commonService');

const redirectService = require('../../services/external_access/redirectService');

exports.valid = (req, res) => valid(req, res);

module.exports = exports;

async function valid(req, res) {
    const message = commonService.isNull(req.headers["message"], "");
    
    const response = await redirectService.valid(message);

    res.status(httpCodeEnum.OK);
    res.send(response.httpCode == httpCodeEnum.OK ? true : false);
}