const express = require('express');
const router = express.Router();

const usersController = require('../../controllers/external_access/usersController');

router.get('/', usersController.getAllUsers);

module.exports = router;