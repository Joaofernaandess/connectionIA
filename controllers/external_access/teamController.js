const httpCodeEnum = require('../../enums/httpCodeEnum');

const logService = require('../../services/common/logService');

const teamService = require('../../services/external_access/teamService');

exports.getOnline = (req, res) => getOnline(req, res);

module.exports = exports;

async function getOnline(req, res) {
    const teamName = decodeURI(req.headers["team"]);
    
    logService.log(`TEAMS REQUEST - ${teamName}`);

    var online = await teamService.getOnline(teamName);

    logService.log(`TEAMS RESPONSE - ${teamName} - ${online ? "ONLINE" : "OFFLINE"}`);

    res.status(httpCodeEnum.OK);
    res.send(online);
}