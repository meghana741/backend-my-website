const { query } = require('../config/db');

/**
 * Generate unique recycling batch number, e.g. BATCH-REC-2026-1049
 */
function generateBatchNumber(itemType) {
  const prefix = itemType === 'Reusable' ? 'REUSE' : itemType === 'Hazardous' ? 'HAZ' : 'REC';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `BATCH-${prefix}-${new Date().getFullYear()}-${randomSuffix}`;
}

/**
 * Get all recycling batches
 * GET /api/recycling
 */
async function getBatches(req, res, next) {
  try {
    const { itemType, status, facility } = req.query;

    let sqlText = `
      SELECT b.*, r.trackingNumber as requestTrackingNumber
      FROM RecyclingBatches b
      LEFT JOIN PickupRequests r ON b.requestId = r.id
      WHERE 1=1
    `;
    const params = {};

    if (itemType && itemType !== 'All') {
      sqlText += ' AND b.itemType = @itemType';
      params.itemType = itemType;
    }

    if (status && status !== 'All') {
      sqlText += ' AND b.status = @status';
      params.status = status;
    }

    if (facility && facility !== 'All') {
      sqlText += ' AND b.recyclerFacility LIKE \'%\' + @facility + \'%\'';
      params.facility = facility;
    }

    sqlText += ' ORDER BY b.createdAt DESC';

    const result = await query(sqlText, params);

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      batches: result.recordset
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get recycling batch by ID
 * GET /api/recycling/:id
 */
async function getBatchById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT b.*, r.trackingNumber as requestTrackingNumber, r.itemName as sourceItemName
      FROM RecyclingBatches b
      LEFT JOIN PickupRequests r ON b.requestId = r.id
      WHERE b.id = @id
    `, { id });

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recycling batch not found.'
      });
    }

    res.status(200).json({
      success: true,
      batch: result.recordset[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new recycling batch / segregated item
 * POST /api/recycling
 */
async function createBatch(req, res, next) {
  try {
    const {
      requestId,
      itemType, // 'Reusable', 'Recyclable', 'Hazardous'
      itemName,
      categoryName,
      weight,
      recyclerFacility,
      recyclerContact,
      status = 'Under Inspection',
      recoveryRate = 0,
      hazardousComponents,
      disposalMethod,
      notes
    } = req.body;

    if (!itemType || !itemName || !weight || !recyclerFacility) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemType (Reusable/Recyclable/Hazardous), itemName, weight, and recyclerFacility.'
      });
    }

    const batchNumber = generateBatchNumber(itemType);

    const insertResult = await query(`
      INSERT INTO RecyclingBatches (
        batchNumber, requestId, itemType, itemName, categoryName,
        weight, recyclerFacility, recyclerContact, status,
        recoveryRate, hazardousComponents, disposalMethod, notes,
        createdAt, updatedAt
      )
      OUTPUT INSERTED.*
      VALUES (
        @batchNumber, @requestId, @itemType, @itemName, @categoryName,
        @weight, @recyclerFacility, @recyclerContact, @status,
        @recoveryRate, @hazardousComponents, @disposalMethod, @notes,
        GETDATE(), GETDATE()
      )
    `, {
      batchNumber,
      requestId: requestId || null,
      itemType,
      itemName,
      categoryName: categoryName || 'Mixed Electronics',
      weight: parseFloat(weight),
      recyclerFacility,
      recyclerContact: recyclerContact || null,
      status,
      recoveryRate: parseFloat(recoveryRate) || 0,
      hazardousComponents: hazardousComponents || null,
      disposalMethod: disposalMethod || null,
      notes: notes || null
    });

    res.status(201).json({
      success: true,
      message: 'Recycling batch registered successfully!',
      batch: insertResult.recordset[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update recycling batch status, recovery metrics, or assigned recycler
 * PUT /api/recycling/:id
 */
async function updateBatch(req, res, next) {
  try {
    const { id } = req.params;
    const {
      status,
      recoveryRate,
      recyclerFacility,
      recyclerContact,
      hazardousComponents,
      disposalMethod,
      notes,
      completed
    } = req.body;

    const check = await query('SELECT * FROM RecyclingBatches WHERE id = @id', { id });
    if (check.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recycling batch not found.'
      });
    }

    const completedAtValue = completed || status === 'Completed' || status === 'Safely Disposed' || status === 'Refurbished'
      ? 'GETDATE()'
      : 'NULL';

    const updateResult = await query(`
      UPDATE RecyclingBatches
      SET 
        status = COALESCE(@status, status),
        recoveryRate = COALESCE(@recoveryRate, recoveryRate),
        recyclerFacility = COALESCE(@recyclerFacility, recyclerFacility),
        recyclerContact = COALESCE(@recyclerContact, recyclerContact),
        hazardousComponents = COALESCE(@hazardousComponents, hazardousComponents),
        disposalMethod = COALESCE(@disposalMethod, disposalMethod),
        notes = COALESCE(@notes, notes),
        completedAt = CASE WHEN @status IN ('Completed', 'Refurbished', 'Safely Disposed') THEN GETDATE() ELSE completedAt END,
        updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `, {
      id,
      status: status || null,
      recoveryRate: recoveryRate !== undefined ? parseFloat(recoveryRate) : null,
      recyclerFacility: recyclerFacility || null,
      recyclerContact: recyclerContact || null,
      hazardousComponents: hazardousComponents || null,
      disposalMethod: disposalMethod || null,
      notes: notes || null
    });

    res.status(200).json({
      success: true,
      message: 'Recycling batch updated successfully!',
      batch: updateResult.recordset[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get certified recycling facilities list
 * GET /api/recycling/centers
 */
async function getRecyclingCenters(req, res, next) {
  try {
    const result = await query(`
      SELECT * FROM RecyclingCenters
      WHERE isActive = 1
      ORDER BY rating DESC, name ASC
    `);

    res.status(200).json({
      success: true,
      centers: result.recordset
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  getRecyclingCenters
};
