const httpCodeEnum = require('../../enums/httpCodeEnum');

exports.health = (req, res) => health(req, res);

module.exports = exports;

async function health(req, res) {    
    res.status(httpCodeEnum.OK);
    res.send(true);
}