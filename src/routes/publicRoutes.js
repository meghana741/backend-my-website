const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/categories', publicController.getCategories);
router.get('/stats', publicController.getPublicStats);
router.post('/calculate-impact', publicController.calculateImpact);

module.exports = router;
