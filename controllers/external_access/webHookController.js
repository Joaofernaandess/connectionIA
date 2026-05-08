const httpCodeEnum = require('../../enums/httpCodeEnum');

const typeContentRequestProvider = require('../../providers/typeContentRequestProvider');

const logService = require('../../services/common/logService');
const webHookService = require('../../services/external_access/webHookService');

exports.main = (req, res) => main(req, res);
exports.index = (req, res) => index(req, res);

module.exports = exports;

async function main(req, res) {
    const body = req.body;
    const type = typeContentRequestProvider.get(body.type, body.content);

    // saveLog(body)

    switch (type) {
        case "new-ticket":
            logService.log(`WEBHOOK - ${type} - ${JSON.stringify(body)}`);

            res.status(httpCodeEnum.OK);
            res.send();

            const resNewTicket = await webHookService.newTicket(req.io, body);

            if (resNewTicket.httpCode == httpCodeEnum.OK) {
                await webHookService.assignTicketToAgentDefault(body);
                await webHookService.addOldMessages(req.io, resNewTicket.data);
                // await webHookService.assignTicketToAgentDefault(body); // Bot troca o atendente...
            }

            break;

        case "new-message":
            logService.log(`WEBHOOK - ${type} - ${JSON.stringify(body)}`);

            await webHookService.newMessage(req.io, body);

            res.status(httpCodeEnum.OK);
            res.send();
            break;

        default:
            res.status(httpCodeEnum.OK);
            res.send();
            break;
    }
}

function index(req, res) {
    res.status(httpCodeEnum.OK);
    res.send("Webhook");
}