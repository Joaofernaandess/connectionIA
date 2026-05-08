const httpCodeEnum = require('../enums/httpCodeEnum');
const dashboardService = require('../services/dashboardService');
const logService = require('../services/common/logService');

module.exports = {
    getMetrics
};

async function getMetrics(req, res) {
    try {
        const metrics = await dashboardService.getMetrics();
        res.status(httpCodeEnum.OK);
        res.json(metrics);
    } catch (error) {
        logService.log(error);
        res.status(httpCodeEnum.INTERNAL_SERVER_ERROR);
        res.json({
            mensagem: 'Não foi possível carregar os indicadores do dashboard.'
        });
    }
}
