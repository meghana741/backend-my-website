const { query } = require('../config/db');

/**
 * Get notifications for logged-in user
 * GET /api/notifications
 */
async function getUserNotifications(req, res, next) {
  try {
    const result = await query(`
      SELECT n.*, r.trackingNumber as requestTrackingNumber, r.itemName as requestItemName
      FROM Notifications n
      LEFT JOIN PickupRequests r ON n.relatedRequestId = r.id
      WHERE n.userId = @userId
      ORDER BY n.createdAt DESC
    `, { userId: req.user.id });

    const unreadCount = result.recordset.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      unreadCount,
      count: result.recordset.length,
      notifications: result.recordset
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark a single notification as read
 * PUT /api/notifications/:id/read
 */
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE Notifications
      SET isRead = 1
      OUTPUT INSERTED.*
      WHERE id = @id AND userId = @userId
    `, {
      id,
      userId: req.user.id
    });

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification: result.recordset[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark all notifications as read for current user
 * PUT /api/notifications/read-all
 */
async function markAllAsRead(req, res, next) {
  try {
    await query(`
      UPDATE Notifications
      SET isRead = 1
      WHERE userId = @userId
    `, { userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;

    await query(`
      DELETE FROM Notifications
      WHERE id = @id AND userId = @userId
    `, {
      id,
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Notification removed.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
