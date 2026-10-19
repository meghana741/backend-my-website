const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, phone, password, role = 'user', address, city, pincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM Users WHERE email = @email', { email });
    if (existing.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const insertResult = await query(`
      INSERT INTO Users (name, email, phone, password, role, address, city, pincode, createdAt, updatedAt)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.address, INSERTED.city, INSERTED.pincode, INSERTED.createdAt
      VALUES (@name, @email, @phone, @password, @role, @address, @city, @pincode, GETDATE(), GETDATE())
    `, {
      name,
      email: email.toLowerCase().trim(),
      phone: phone || null,
      password: hashedPassword,
      role: ['admin', 'agent', 'recycler'].includes(role) ? role : 'user',
      address: address || null,
      city: city || null,
      pincode: pincode || null
    });

    const newUser = insertResult.recordset[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Create a welcome notification
    await query(`
      INSERT INTO Notifications (userId, title, message, type, isRead, createdAt)
      VALUES (@userId, 'Welcome to EcoCycle!', 'Thank you for joining our mission to responsibly collect and recycle electronic waste.', 'info', 0, GETDATE())
    `, { userId: newUser.id });

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        address: newUser.address,
        city: newUser.city,
        pincode: newUser.pincode,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Look up user
    const result = await query(
      'SELECT id, name, email, phone, password, role, address, city, pincode FROM Users WHERE email = @email',
      { email: email.toLowerCase().trim() }
    );

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = result.recordset[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        city: user.city,
        pincode: user.pincode
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
async function getCurrentUser(req, res, next) {
  try {
    const result = await query(`
      SELECT id, name, email, phone, role, address, city, pincode, createdAt, updatedAt
      FROM Users
      WHERE id = @id
    `, { id: req.user.id });

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      user: result.recordset[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update user profile
 * PUT /api/auth/profile
 */
async function updateProfile(req, res, next) {
  try {
    const { name, phone, address, city, pincode } = req.body;

    const result = await query(`
      UPDATE Users
      SET 
        name = COALESCE(@name, name),
        phone = COALESCE(@phone, phone),
        address = COALESCE(@address, address),
        city = COALESCE(@city, city),
        pincode = COALESCE(@pincode, pincode),
        updatedAt = GETDATE()
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.address, INSERTED.city, INSERTED.pincode, INSERTED.updatedAt
      WHERE id = @id
    `, {
      id: req.user.id,
      name: name || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      pincode: pincode || null
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: result.recordset[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile
};
