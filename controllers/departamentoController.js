const url = require('url');

const httpCodeEnum = require('../enums/httpCodeEnum');

const departamentoMap = require('../maps/departamentoMap');

const departamentoService = require('../services/departamentoService');

exports.getList = (req, res) => getList(req, res);

module.exports = exports;

async function getList(req, res) {     
    const params = url.parse(req.url, true).query;

    let departamentos = await departamentoService.getList(params.equipeId, params.atendenteId);
    
    const selectOptions = departamentoMap.departamentosToSelectOptions(departamentos)
    
    res.status(httpCodeEnum.OK);
    res.json({
        departamentos: selectOptions
    });
}