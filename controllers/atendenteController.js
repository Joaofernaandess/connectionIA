const url = require('url');

const httpCodeEnum = require('../enums/httpCodeEnum');

const atendenteMap = require('../maps/atendenteMap');

const atendenteService = require('../services/atendenteService');

exports.getList = (req, res) => getList(req, res);

module.exports = exports;

async function getList(req, res) {
    const params = url.parse(req.url, true).query;

    let atendentes = await atendenteService.getList(params.equipeId, params.departamentoId);

    const selectOptions = atendenteMap.atendentesToSelectOptionsWithNone(atendentes)

    res.status(httpCodeEnum.OK);
    res.json({
        atendentes: selectOptions
    });
}