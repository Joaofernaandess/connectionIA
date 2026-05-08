const express = require('express');
const router = express.Router();

const indexController = require('../controllers/indexController');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.ensureAuthenticated, indexController.dashboard);
router.get('/dados', authMiddleware.ensureAuthenticated, dashboardController.getMetrics);

module.exports = router;
