const express = require('express');
const router = express.Router();
const recyclingController = require('../controllers/recyclingController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public or Authenticated: list certified recycling centers
router.get('/centers', recyclingController.getRecyclingCenters);

// Authenticated (Admin / Recycler): list recycling batches
router.get('/', authenticateToken, requireRole('admin', 'recycler', 'agent'), recyclingController.getBatches);

// Single batch details
router.get('/:id', authenticateToken, requireRole('admin', 'recycler', 'agent'), recyclingController.getBatchById);

// Admin / Recycler: create recycling batch
router.post('/', authenticateToken, requireRole('admin', 'recycler'), recyclingController.createBatch);

// Admin / Recycler: update recycling batch
router.put('/:id', authenticateToken, requireRole('admin', 'recycler'), recyclingController.updateBatch);

module.exports = router;
