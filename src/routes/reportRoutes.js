const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// User-specific dashboard metrics
router.get('/user-dashboard', authenticateToken, reportController.getUserDashboard);

// Global summary reports (Admin / Agent or Authenticated)
router.get('/summary', authenticateToken, reportController.getSummary);
router.get('/monthly', authenticateToken, reportController.getMonthlyStats);
router.get('/categories', authenticateToken, reportController.getCategoryDistribution);

module.exports = router;
