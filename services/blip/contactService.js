const blipApiService = require('./apiService');

exports.createInRouter = async (contact) => createInRouter(contact);
exports.get = async (id, isRouter) => get(id, isRouter);
exports.update = async (contact, isRouter) => update(contact, isRouter);
exports.getContactIdentifierByTunnel = async (tunnel) => getContactIdentifierByTunnel(tunnel);

module.exports = exports;

async function get(id, isRouter = false) {
    const response = await blipApiService.getContact(id, isRouter);

    if (response.code === 200) {
        return response.data.resource;
    } else {
        return [];
    }
}

async function update(contact, isRouter = false) {
    const response = await blipApiService.updateContact(contact, isRouter);
    return response.code === 200;
}

async function createInRouter(contact) {
    const response = await blipApiService.createContactInRouter(contact);
    return response.code === 200;
}

/**
 *  Get contact identifier by tunnel using the Router API Key
 * @param tunnel {string} - Tunnel
 * @returns {Promise<string|null>}
 */
async function getContactIdentifierByTunnel(tunnel) {
    const response = await blipApiService.getContactIdentifierByTunnel(tunnel);
    return response.code === 200 ? response.data.resource.originator : null;
}