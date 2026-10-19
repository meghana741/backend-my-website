const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');

// Public tracking lookup by tracking number
router.get('/track/:trackingNumber', optionalAuth, requestController.trackRequest);

// User: View user's own requests
router.get('/my-requests', authenticateToken, requestController.getUserRequests);

// Create a new request (Authenticated user)
router.post('/', authenticateToken, requestController.createRequest);

// Admin / Agent: View all requests with filtering
router.get('/', authenticateToken, requireRole('admin', 'agent'), requestController.getAllRequests);

// Single request details by ID
router.get('/:id', authenticateToken, requestController.getRequestById);

// Admin / Agent: Update request status
router.put('/:id/status', authenticateToken, requireRole('admin', 'agent'), requestController.updateRequestStatus);

// Admin: Schedule pickup date and assign agent
router.put('/:id/schedule', authenticateToken, requireRole('admin'), requestController.schedulePickup);

// Cancel request
router.delete('/:id', authenticateToken, requestController.cancelRequest);

module.exports = router;
