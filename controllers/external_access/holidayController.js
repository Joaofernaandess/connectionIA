const httpCodeEnum = require('../../enums/httpCodeEnum');

const commonService = require('../../services/common/commonService');

const holidayService = require('../../services/external_access/holidayService');

exports.isHoliday = (req, res) => isHoliday(req, res);

module.exports = exports;

async function isHoliday(req, res) {
    const dateTime = commonService.isNull(req.headers["date"], "");
    const response = await holidayService.isHoliday(dateTime);
    
    res.status(httpCodeEnum.OK);
    res.send(response.httpCode == httpCodeEnum.OK ? true : false);
}