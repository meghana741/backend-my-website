const { query } = require('../config/db');

/**
 * Get all users with search and role filters (Admin only)
 * GET /api/users
 */
async function getAllUsers(req, res, next) {
  try {
    const { role, search } = req.query;

    let sqlText = `
      SELECT id, name, email, phone, role, address, city, pincode, createdAt
      FROM Users
      WHERE 1=1
    `;
    const params = {};

    if (role && role !== 'All') {
      sqlText += ' AND role = @role';
      params.role = role;
    }

    if (search) {
      sqlText += ` AND (
        name LIKE '%' + @search + '%' OR
        email LIKE '%' + @search + '%' OR
        phone LIKE '%' + @search + '%' OR
        city LIKE '%' + @search + '%'
      )`;
      params.search = search;
    }

    sqlText += ' ORDER BY createdAt DESC';

    const result = await query(sqlText, params);

    res.status(200).json({
      success: true,
      total: result.recordset.length,
      users: result.recordset
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get list of collection agents for assignment dropdowns
 * GET /api/users/agents
 */
async function getAgents(req, res, next) {
  try {
    const result = await query(`
      SELECT id, name, email, phone, city
      FROM Users
      WHERE role = 'agent' OR role = 'admin'
      ORDER BY name ASC
    `);

    res.status(200).json({
      success: true,
      agents: result.recordset
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update user role (Admin only)
 * PUT /api/users/:id/role
 */
async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'admin', 'agent', 'recycler'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const result = await query(`
      UPDATE Users
      SET role = @role, updatedAt = GETDATE()
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role
      WHERE id = @id
    `, { id, role });

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: `User role successfully updated to "${role}".`,
      user: result.recordset[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a user (Admin only)
 * DELETE /api/users/:id
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.'
      });
    }

    const result = await query('DELETE FROM Users OUTPUT DELETED.id, DELETED.email WHERE id = @id', { id });

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllUsers,
  getAgents,
  updateUserRole,
  deleteUser
};
