const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Available to admin to list agents for scheduling
router.get('/agents', authenticateToken, requireRole('admin'), userController.getAgents);

// Admin user management
router.get('/', authenticateToken, requireRole('admin'), userController.getAllUsers);
router.put('/:id/role', authenticateToken, requireRole('admin'), userController.updateUserRole);
router.delete('/:id', authenticateToken, requireRole('admin'), userController.deleteUser);

module.exports = router;
