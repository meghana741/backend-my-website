const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Fixed Admin Credentials as required
const FIXED_ADMIN_EMAIL = 'admin@ecocycle.com';
const FIXED_ADMIN_PASSWORD = 'EcoAdmin@2026';

/**
 * Register a new Citizen account (Saved to SQL Server Users table)
 * POST /api/auth/register or POST /api/auth/citizen/register
 */
async function register(req, res, next) {
  try {
    const { name, email, phone, password, confirmPassword, address, city, pincode } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Prevent registering with admin email
    if (cleanEmail === FIXED_ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'This email is reserved for system administrators.'
      });
    }

    // Check if citizen already exists
    const existing = await query('SELECT id FROM Users WHERE email = @email', { email: cleanEmail });
    if (existing.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please sign in.'
      });
    }

    // 2. Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Security Rule: ALWAYS assign role 'citizen'. Never trust role supplied by frontend!
    const citizenRole = 'citizen';

    const insertResult = await query(`
      INSERT INTO Users (name, email, phone, password, role, address, city, pincode, createdAt, updatedAt)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.address, INSERTED.city, INSERTED.pincode, INSERTED.createdAt
      VALUES (@name, @email, @phone, @password, @role, @address, @city, @pincode, GETDATE(), GETDATE())
    `, {
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      password: hashedPassword,
      role: citizenRole,
      address: address ? address.trim() : null,
      city: city ? city.trim() : null,
      pincode: pincode ? pincode.trim() : null
    });

    const newCitizen = insertResult.recordset[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: newCitizen.id, email: newCitizen.email, role: 'citizen', name: newCitizen.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Create a welcome notification in SQL Server
    await query(`
      INSERT INTO Notifications (userId, title, message, type, isRead, createdAt)
      VALUES (@userId, 'Welcome to EcoCycle!', 'Thank you for joining our mission to responsibly collect and recycle electronic waste.', 'info', 0, GETDATE())
    `, { userId: newCitizen.id });

    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully! You may now sign in.',
      token,
      user: {
        id: newCitizen.id,
        name: newCitizen.name,
        email: newCitizen.email,
        phone: newCitizen.phone,
        role: 'citizen',
        address: newCitizen.address,
        city: newCitizen.city,
        pincode: newCitizen.pincode,
        createdAt: newCitizen.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Dedicated Admin Login (Validates fixed credentials)
 * POST /api/auth/admin/login
 */
async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both admin email and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify against fixed admin credentials
    if (cleanEmail !== FIXED_ADMIN_EMAIL.toLowerCase() || password !== FIXED_ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials. Access restricted to authorized personnel.'
      });
    }

    // Lookup or ensure admin record in database
    let adminRecord = null;
    const dbAdmin = await query('SELECT id, name, email, role, phone FROM Users WHERE email = @email', { email: cleanEmail });
    
    if (dbAdmin.recordset.length > 0) {
      adminRecord = dbAdmin.recordset[0];
      // Ensure role is admin in DB
      if (adminRecord.role !== 'admin') {
        await query('UPDATE Users SET role = \'admin\' WHERE id = @id', { id: adminRecord.id });
        adminRecord.role = 'admin';
      }
    } else {
      // Create admin record in DB if not present
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(FIXED_ADMIN_PASSWORD, salt);
      const inserted = await query(`
        INSERT INTO Users (name, email, password, role, createdAt, updatedAt)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role
        VALUES ('Admin Director', @email, @password, 'admin', GETDATE(), GETDATE())
      `, { email: FIXED_ADMIN_EMAIL, password: hash });
      adminRecord = inserted.recordset[0];
    }

    // Issue JWT with role 'admin'
    const token = jwt.sign(
      { id: adminRecord.id, email: adminRecord.email, role: 'admin', name: adminRecord.name || 'Admin Director' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful!',
      token,
      user: {
        id: adminRecord.id,
        name: adminRecord.name || 'Admin Director',
        email: FIXED_ADMIN_EMAIL,
        role: 'admin'
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Dedicated Citizen Login
 * POST /api/auth/citizen/login
 */
async function citizenLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both citizen email and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Look up citizen in SQL Server
    const result = await query(
      'SELECT id, name, email, phone, password, role, address, city, pincode FROM Users WHERE email = @email',
      { email: cleanEmail }
    );

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'No citizen account found with this email. Please register first.'
      });
    }

    const user = result.recordset[0];

    // Check role - if it's admin, prompt to use admin login
    if (user.role === 'admin' || cleanEmail === FIXED_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'This is an Admin account. Please use the Admin Login option.'
      });
    }

    // Compare bcrypt password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check your credentials.'
      });
    }

    // Issue JWT token with role 'citizen'
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'citizen', name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Citizen login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'citizen',
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
 * Universal Login (supports portalType or auto-detects Admin vs Citizen)
 * POST /api/auth/login
 */
async function login(req, res, next) {
  const { email, password, portalType } = req.body;

  if (portalType === 'admin' || (email && email.toLowerCase().trim() === FIXED_ADMIN_EMAIL.toLowerCase())) {
    return adminLogin(req, res, next);
  }

  return citizenLogin(req, res, next);
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
        message: 'User profile not found.'
      });
    }

    const user = result.recordset[0];
    const normalizedRole = user.role === 'user' ? 'citizen' : user.role;

    res.status(200).json({
      success: true,
      user: {
        ...user,
        role: normalizedRole
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update citizen profile
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
      name: name ? name.trim() : null,
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
      city: city ? city.trim() : null,
      pincode: pincode ? pincode.trim() : null
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
  adminLogin,
  citizenLogin,
  login,
  getCurrentUser,
  updateProfile,
  FIXED_ADMIN_EMAIL,
  FIXED_ADMIN_PASSWORD
};
