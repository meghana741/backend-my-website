const { query } = require('../config/db');

/**
 * Generate unique human-readable tracking number, e.g. EW-2026-8492
 */
function generateTrackingNumber() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `EW-${year}-${randomSuffix}`;
}

/**
 * Create a new e-waste pickup request
 * POST /api/requests
 */
async function createRequest(req, res, next) {
  try {
    const {
      itemName,
      categoryId,
      quantity = 1,
      condition,
      estimatedWeight,
      pickupAddress,
      city,
      pincode,
      preferredPickupDate,
      preferredTimeSlot = 'Morning (9 AM - 12 PM)',
      contactPhone,
      userNotes
    } = req.body;

    if (!itemName || !categoryId || !condition || !estimatedWeight || !pickupAddress || !city || !pincode || !preferredPickupDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: itemName, categoryId, condition, estimatedWeight, pickupAddress, city, pincode, preferredPickupDate.'
      });
    }

    // Lookup Category
    const catResult = await query('SELECT id, name FROM Categories WHERE id = @categoryId', { categoryId });
    if (catResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid categoryId. Category not found.'
      });
    }
    const categoryName = catResult.recordset[0].name;

    // Generate unique tracking number
    let trackingNumber = generateTrackingNumber();
    let isUnique = false;
    while (!isUnique) {
      const check = await query('SELECT id FROM PickupRequests WHERE trackingNumber = @trackingNumber', { trackingNumber });
      if (check.recordset.length === 0) {
        isUnique = true;
      } else {
        trackingNumber = generateTrackingNumber();
      }
    }

    // Insert Pickup Request
    const insertResult = await query(`
      INSERT INTO PickupRequests (
        trackingNumber, userId, itemName, categoryId, categoryName,
        quantity, condition, estimatedWeight, pickupAddress, city,
        pincode, preferredPickupDate, preferredTimeSlot, contactPhone,
        status, userNotes, createdAt, updatedAt
      )
      OUTPUT INSERTED.*
      VALUES (
        @trackingNumber, @userId, @itemName, @categoryId, @categoryName,
        @quantity, @condition, @estimatedWeight, @pickupAddress, @city,
        @pincode, @preferredPickupDate, @preferredTimeSlot, @contactPhone,
        'Pending', @userNotes, GETDATE(), GETDATE()
      )
    `, {
      trackingNumber,
      userId: req.user.id,
      itemName,
      categoryId,
      categoryName,
      quantity: parseInt(quantity, 10) || 1,
      condition,
      estimatedWeight: parseFloat(estimatedWeight) || 1.0,
      pickupAddress,
      city,
      pincode,
      preferredPickupDate,
      preferredTimeSlot,
      contactPhone: contactPhone || req.user.phone || null,
      userNotes: userNotes || null
    });

    const newRequest = insertResult.recordset[0];

    // Add initial entry in RequestTrackingHistory
    await query(`
      INSERT INTO RequestTrackingHistory (requestId, status, description, updatedBy, timestamp)
      VALUES (@requestId, 'Pending', 'E-waste pickup request registered and waiting for review', @updatedBy, GETDATE())
    `, {
      requestId: newRequest.id,
      updatedBy: req.user.name || 'User'
    });

    // Create user notification
    await query(`
      INSERT INTO Notifications (userId, title, message, type, relatedRequestId, isRead, createdAt)
      VALUES (@userId, 'Pickup Request Submitted', @message, 'info', @requestId, 0, GETDATE())
    `, {
      userId: req.user.id,
      message: `Your pickup request for "${itemName}" has been submitted with tracking ID: ${trackingNumber}.`,
      requestId: newRequest.id
    });

    res.status(201).json({
      success: true,
      message: 'E-waste pickup request created successfully!',
      request: newRequest
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all requests for the currently logged-in user
 * GET /api/requests/my-requests
 */
async function getUserRequests(req, res, next) {
  try {
    const { status } = req.query;

    let sqlText = `
      SELECT r.*, c.icon as categoryIcon, c.co2SavedPerKg
      FROM PickupRequests r
      LEFT JOIN Categories c ON r.categoryId = c.id
      WHERE r.userId = @userId
    `;
    const params = { userId: req.user.id };

    if (status && status !== 'All') {
      sqlText += ' AND r.status = @status';
      params.status = status;
    }

    sqlText += ' ORDER BY r.createdAt DESC';

    const result = await query(sqlText, params);

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      requests: result.recordset
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all requests (Admin / Agent view)
 * GET /api/requests
 */
async function getAllRequests(req, res, next) {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;

    let sqlText = `
      SELECT r.*, u.name as userName, u.email as userEmail, u.phone as userPhone, c.icon as categoryIcon
      FROM PickupRequests r
      JOIN Users u ON r.userId = u.id
      LEFT JOIN Categories c ON r.categoryId = c.id
      WHERE 1=1
    `;
    const params = {};

    if (status && status !== 'All') {
      sqlText += ' AND r.status = @status';
      params.status = status;
    }

    if (category && category !== 'All') {
      sqlText += ' AND r.categoryName = @category';
      params.category = category;
    }

    if (search) {
      sqlText += ` AND (
        r.trackingNumber LIKE '%' + @search + '%' OR
        r.itemName LIKE '%' + @search + '%' OR
        u.name LIKE '%' + @search + '%' OR
        u.email LIKE '%' + @search + '%' OR
        r.city LIKE '%' + @search + '%'
      )`;
      params.search = search;
    }

    sqlText += ' ORDER BY r.createdAt DESC';

    const result = await query(sqlText, params);

    res.status(200).json({
      success: true,
      total: result.recordset.length,
      requests: result.recordset
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single request details by ID with complete tracking timeline
 * GET /api/requests/:id
 */
async function getRequestById(req, res, next) {
  try {
    const { id } = req.params;

    const reqResult = await query(`
      SELECT r.*, u.name as userName, u.email as userEmail, u.phone as userPhone, c.icon as categoryIcon, c.co2SavedPerKg
      FROM PickupRequests r
      JOIN Users u ON r.userId = u.id
      LEFT JOIN Categories c ON r.categoryId = c.id
      WHERE r.id = @id
    `, { id });

    if (reqResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found.'
      });
    }

    const request = reqResult.recordset[0];

    // Check authorization: standard users can only view their own requests
    if (req.user && req.user.role === 'user' && request.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own pickup requests.'
      });
    }

    // Get tracking timeline
    const historyResult = await query(`
      SELECT id, status, description, updatedBy, timestamp
      FROM RequestTrackingHistory
      WHERE requestId = @requestId
      ORDER BY timestamp ASC
    `, { requestId: id });

    res.status(200).json({
      success: true,
      request: {
        ...request,
        timeline: historyResult.recordset
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Track request by Tracking Number (Public or Logged-in)
 * GET /api/requests/track/:trackingNumber
 */
async function trackRequest(req, res, next) {
  try {
    const { trackingNumber } = req.params;

    const result = await query(`
      SELECT r.*, c.icon as categoryIcon, c.co2SavedPerKg
      FROM PickupRequests r
      LEFT JOIN Categories c ON r.categoryId = c.id
      WHERE r.trackingNumber = @trackingNumber OR CAST(r.id AS NVARCHAR(50)) = @trackingNumber
    `, { trackingNumber: trackingNumber.trim() });

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No pickup request found with tracking number: ${trackingNumber}`
      });
    }

    const request = result.recordset[0];

    // Fetch tracking timeline
    const historyResult = await query(`
      SELECT id, status, description, updatedBy, timestamp
      FROM RequestTrackingHistory
      WHERE requestId = @requestId
      ORDER BY timestamp ASC
    `, { requestId: request.id });

    res.status(200).json({
      success: true,
      request: {
        id: request.id,
        trackingNumber: request.trackingNumber,
        itemName: request.itemName,
        categoryName: request.categoryName,
        quantity: request.quantity,
        condition: request.condition,
        estimatedWeight: request.estimatedWeight,
        actualWeight: request.actualWeight,
        city: request.city,
        pickupAddress: request.pickupAddress,
        status: request.status,
        scheduledDate: request.scheduledDate,
        assignedAgentName: request.assignedAgentName,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        timeline: historyResult.recordset
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update request status (Admin / Agent)
 * PUT /api/requests/:id/status
 */
async function updateRequestStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes, actualWeight, rejectionReason } = req.body;

    const validStatuses = [
      'Pending',
      'Approved',
      'Rejected',
      'Pickup Scheduled',
      'Collected',
      'Sent for Recycling',
      'Recycling Completed'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const check = await query('SELECT * FROM PickupRequests WHERE id = @id', { id });
    if (check.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found.'
      });
    }

    const currentReq = check.recordset[0];

    // Update query
    const updateResult = await query(`
      UPDATE PickupRequests
      SET 
        status = @status,
        actualWeight = COALESCE(@actualWeight, actualWeight),
        rejectionReason = COALESCE(@rejectionReason, rejectionReason),
        adminNotes = COALESCE(@notes, adminNotes),
        updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `, {
      id,
      status,
      actualWeight: actualWeight !== undefined ? parseFloat(actualWeight) : null,
      rejectionReason: rejectionReason || null,
      notes: notes || null
    });

    const updated = updateResult.recordset[0];

    // Add entry in tracking history
    const description = notes || `Status updated to "${status}" by operations team`;
    await query(`
      INSERT INTO RequestTrackingHistory (requestId, status, description, updatedBy, timestamp)
      VALUES (@requestId, @status, @description, @updatedBy, GETDATE())
    `, {
      requestId: id,
      status,
      description,
      updatedBy: req.user.name || req.user.role || 'Admin'
    });

    // Notify user
    let notifTitle = `Pickup Request Update: ${status}`;
    let notifMsg = `Your request ${updated.trackingNumber} status has changed to "${status}".`;
    if (status === 'Approved') {
      notifMsg = `Great news! Your pickup request ${updated.trackingNumber} for "${updated.itemName}" has been approved.`;
    } else if (status === 'Collected') {
      notifMsg = `Your e-waste items for ${updated.trackingNumber} have been successfully collected.`;
    } else if (status === 'Recycling Completed') {
      notifMsg = `Recycling completed for ${updated.trackingNumber}! Thank you for contributing to a cleaner planet.`;
    } else if (status === 'Rejected') {
      notifMsg = `Your pickup request ${updated.trackingNumber} was not approved. Reason: ${rejectionReason || 'Item not compliant with collection criteria.'}`;
    }

    await query(`
      INSERT INTO Notifications (userId, title, message, type, relatedRequestId, isRead, createdAt)
      VALUES (@userId, @title, @message, @type, @relatedRequestId, 0, GETDATE())
    `, {
      userId: updated.userId,
      title: notifTitle,
      message: notifMsg,
      type: status === 'Rejected' ? 'warning' : 'status_update',
      relatedRequestId: id
    });

    res.status(200).json({
      success: true,
      message: `Request status successfully updated to "${status}".`,
      request: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Schedule pickup and assign collection agent (Admin)
 * PUT /api/requests/:id/schedule
 */
async function schedulePickup(req, res, next) {
  try {
    const { id } = req.params;
    const { scheduledDate, assignedAgentId, assignedAgentName, timeSlot, notes } = req.body;

    if (!scheduledDate || (!assignedAgentId && !assignedAgentName)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide scheduledDate and assigned agent details.'
      });
    }

    let agentName = assignedAgentName;
    if (assignedAgentId && !agentName) {
      const agentRes = await query('SELECT name FROM Users WHERE id = @id', { id: assignedAgentId });
      if (agentRes.recordset.length > 0) {
        agentName = agentRes.recordset[0].name;
      }
    }

    const updateRes = await query(`
      UPDATE PickupRequests
      SET 
        status = 'Pickup Scheduled',
        scheduledDate = @scheduledDate,
        assignedAgentId = @assignedAgentId,
        assignedAgentName = @assignedAgentName,
        preferredTimeSlot = COALESCE(@timeSlot, preferredTimeSlot),
        adminNotes = COALESCE(@notes, adminNotes),
        updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `, {
      id,
      scheduledDate,
      assignedAgentId: assignedAgentId || null,
      assignedAgentName: agentName,
      timeSlot: timeSlot || null,
      notes: notes || null
    });

    if (updateRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found.'
      });
    }

    const updated = updateRes.recordset[0];

    // Add to tracking timeline
    await query(`
      INSERT INTO RequestTrackingHistory (requestId, status, description, updatedBy, timestamp)
      VALUES (@requestId, 'Pickup Scheduled', @description, @updatedBy, GETDATE())
    `, {
      requestId: id,
      description: `Pickup scheduled for ${new Date(scheduledDate).toLocaleDateString()} with Collection Agent ${agentName}.`,
      updatedBy: req.user.name || 'Admin'
    });

    // Notify user
    await query(`
      INSERT INTO Notifications (userId, title, message, type, relatedRequestId, isRead, createdAt)
      VALUES (@userId, 'Pickup Scheduled!', @message, 'status_update', @relatedRequestId, 0, GETDATE())
    `, {
      userId: updated.userId,
      message: `Your pickup for ${updated.trackingNumber} has been scheduled for ${new Date(scheduledDate).toLocaleDateString()}. Agent ${agentName} will arrive to collect your items.`,
      relatedRequestId: id
    });

    res.status(200).json({
      success: true,
      message: 'Pickup successfully scheduled and agent assigned!',
      request: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel a pending request
 * DELETE /api/requests/:id
 */
async function cancelRequest(req, res, next) {
  try {
    const { id } = req.params;

    const check = await query('SELECT * FROM PickupRequests WHERE id = @id', { id });
    if (check.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    const current = check.recordset[0];

    // Standard user can only cancel their own pending request
    if (req.user.role === 'user') {
      if (current.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied.'
        });
      }
      if (current.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel a request that is already in "${current.status}" status. Please contact support.`
        });
      }
    }

    await query('DELETE FROM PickupRequests WHERE id = @id', { id });

    res.status(200).json({
      success: true,
      message: `Pickup request ${current.trackingNumber} has been cancelled successfully.`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRequest,
  getUserRequests,
  getAllRequests,
  getRequestById,
  trackRequest,
  updateRequestStatus,
  schedulePickup,
  cancelRequest
};
