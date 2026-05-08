const httpCodeEnum = require('../enums/httpCodeEnum');

const canalMap = require('../maps/canalMap');
const canalService = require('../services/canalService');

exports.getAll = (req, res) => getAll(req, res);

module.exports = exports;

async function getAll(req, res) {        
    let canais = await canalService.getAll();
    const selectOptions = canalMap.canaisToSelectOptions(canais);
    
    res.status(httpCodeEnum.OK);
    res.json({
        canais: selectOptions
    });
}