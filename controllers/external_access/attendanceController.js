const httpCodeEnum = require('../../enums/httpCodeEnum');

const commonService = require('../../services/common/commonService');
const logService = require('../../services/common/logService');

const attendanceService = require('../../services/external_access/attendanceService');

exports.index = (req, res) => index(req, res);
exports.evaluation = (req, res) => evaluation(req, res);
exports.expired = (req, res) => expired(req, res);
exports.waiting = (req, res) => waiting(req, res);

module.exports = exports;

function index(req, res) {
    res.status(httpCodeEnum.OK);
    res.send("Attendance");
}

async function evaluation(req, res) {
    const contactIdentity = commonService.isNull(req.headers["contact"], "");
    const score = commonService.isNull(req.headers["score"], null);

    logService.log(`ATTENDANCE REQUEST - ${contactIdentity} - ${score}`);
    
    await attendanceService.evaluation(req.io, contactIdentity, score);
    
    res.status(httpCodeEnum.OK);
    res.send("");
}

async function expired(req, res) {
    const contactIdentity = commonService.isNull(req.headers["contact"], "");

    logService.log(`EXPIRED REQUEST - ${contactIdentity}`);    
    const expired = await attendanceService.expired(contactIdentity);
    logService.log(`EXPIRED RESPONSE - ${contactIdentity} - ${!expired ? "NÃO EXPIRADO" : "EXPIRADO"}`);
    
    res.status(httpCodeEnum.OK);
    res.send(expired);
}

async function waiting(req, res) {
    const contactIdentity = commonService.isNull(req.headers["contact"], "");

    logService.log(`WAITING REQUEST - ${contactIdentity}`);
    const responseHttp = await attendanceService.waiting(contactIdentity);
    logService.log(`WAITING RESPONSE - ${contactIdentity} - ${!waiting ? "NÃO EM ESPERA" : "EM ESPERA"}`);

    res.status(responseHttp.httpCode ? responseHttp.httpCode : 500);
    res.send(responseHttp.data ? `${responseHttp.data}` : "0" );
}