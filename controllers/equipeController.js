const url = require('url');

const httpCodeEnum = require('../enums/httpCodeEnum');

const equipeMap = require('../maps/equipeMap');

const equipeService = require('../services/equipeService');

exports.getList = (req, res) => getList(req, res);

module.exports = exports;

async function getList(req, res) {
    const params = url.parse(req.url, true).query;

    let equipes = await equipeService.getList(params.departamentoId, params.atendenteId);    

    const selectOptions = equipeMap.equipesToSelectOptionsWithNone(equipes);
    
    res.status(httpCodeEnum.OK);
    res.json({
        equipes: selectOptions
    });
}