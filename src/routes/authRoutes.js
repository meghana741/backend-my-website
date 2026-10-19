const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public Authentication Endpoints
// Dedicated Admin & Citizen Routes
router.post('/admin/login', authController.adminLogin);
router.post('/citizen/login', authController.citizenLogin);
router.post('/citizen/register', authController.register);

// Standard / Backward-Compatible Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Authenticated Endpoints
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;
