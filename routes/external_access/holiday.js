const express = require('express');
const router = express.Router();

const holidayController = require('../../controllers/external_access/holidayController');

router.get('/', holidayController.isHoliday);

module.exports = router;