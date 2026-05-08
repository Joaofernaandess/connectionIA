const httpCodeEnum = require('../../enums/httpCodeEnum');

const userService = require('../../services/external_access/userService'); 

exports.getAllUsers = (req, res) => getAllUsers(req, res);

module.exports = exports;

function getAllUsers(req, res) {
    res.status(httpCodeEnum.OK);
    res.send(userService.getUsers());
}