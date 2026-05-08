const logService = require('../common/logService');

const mcache = require('memory-cache');
const timeOut = 60 * 60 * 1000;
const cacheKey = '__blip__socketsusers_webhook';

exports.setUser = (socket) => setUser(socket);
exports.removeUser = (socket) => removeUser(socket);
exports.getUserByEmail = (email) => getUserByEmail(email);
exports.getUsers = () => getUsers();

module.exports = exports;

function setUser(socket) {
    let users = getUsers();
    let user = createUser(socket);
    let existUsers = users && users.length > 0;

    if (existUsers) 
        users = removeUsers(users, getUserByEmail(user.email));

    users.push(user);
    saveInCache(users);
}

function getUsers() {
    let users = mcache.get(cacheKey);

    if (!users)
        users = new Array();

    return users;
}

function getUserByEmail(email) {
    let users = getUsers();
    let usersFinded = new Array();

    for (let i = 0; i < users.length; i++) {
        const user = users[i];

        if (user.email == email) {
            usersFinded.push(user)
        }
    }

    return usersFinded;
}

function getUserBySocketId(socketId) {
    let users = getUsers();
    let usersFinded = new Array();

    for (let i = 0; i < users.length; i++) {
        const user = users[i];

        if (user.socketId == socketId) {
            usersFinded.push(user)
        }
    }

    return usersFinded;
}

function createUser(socket) {
    return {
        socketId: socket.id,
        email: socket.handshake.query.usuario
    }
}

function removeUser(socket) {
    let users = getUsers();        
    users = removeUsers(users, getUserBySocketId(socket.id));
    saveInCache(users);
}

function removeUsers(users, usersAtRemove) {
    var newUsers = new Array();

    for (let i = 0; i < users.length; i++) {
        const user = users[i];

        if (!usersAtRemove.find(u => u.email == user.email))
            newUsers.push(user);
    }

    return newUsers;
}

function saveInCache(users) {
    if (users && users.length == 1)
        logService.log(`CACHE CRIADO - ${cacheKey}`);

    mcache.put(cacheKey, users, timeOut, () => {
        logService.log(`CACHE EXPIRADO - ${cacheKey}`);
    });
}