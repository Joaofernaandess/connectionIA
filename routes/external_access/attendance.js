const express = require('express');
const router = express.Router();

const attendanceController = require('../../controllers/external_access/attendanceController');

router.get('/', attendanceController.index);
router.get('/evaluation', attendanceController.evaluation);
router.get('/expired', attendanceController.expired);
router.get('/waiting', attendanceController.waiting);

module.exports = router;