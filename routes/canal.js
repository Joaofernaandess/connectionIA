const express = require('express');
const router = express.Router();

const canalController = require('../controllers/canalController');

router.get('/', canalController.getAll);

module.exports = router;