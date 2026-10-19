require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { testConnection } = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const recyclingRoutes = require('./routes/recyclingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching allowed origins
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for local pairing
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root API Information & Documentation
app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    name: 'EcoCycle E-Waste Management Portal API',
    version: '1.0.0',
    status: 'online',
    database: 'Microsoft SQL Server',
    endpoints: {
      health: 'GET /api/health',
      public: {
        categories: 'GET /api/public/categories',
        impactStats: 'GET /api/public/stats',
        impactCalculator: 'POST /api/public/calculate-impact',
        trackRequest: 'GET /api/requests/track/:trackingNumber'
      },
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/profile'
      },
      requests: {
        create: 'POST /api/requests',
        myRequests: 'GET /api/requests/my-requests',
        allRequests: 'GET /api/requests (Admin/Agent)',
        getById: 'GET /api/requests/:id',
        updateStatus: 'PUT /api/requests/:id/status (Admin/Agent)',
        schedule: 'PUT /api/requests/:id/schedule (Admin)',
        cancel: 'DELETE /api/requests/:id'
      },
      recycling: {
        centers: 'GET /api/recycling/centers',
        batches: 'GET /api/recycling',
        createBatch: 'POST /api/recycling (Admin/Recycler)',
        updateBatch: 'PUT /api/recycling/:id (Admin/Recycler)'
      },
      notifications: {
        list: 'GET /api/notifications',
        markRead: 'PUT /api/notifications/:id/read',
        markAllRead: 'PUT /api/notifications/read-all',
        delete: 'DELETE /api/notifications/:id'
      },
      reports: {
        summary: 'GET /api/reports/summary',
        monthly: 'GET /api/reports/monthly',
        categories: 'GET /api/reports/categories',
        userDashboard: 'GET /api/reports/user-dashboard'
      },
      users: {
        list: 'GET /api/users (Admin)',
        agents: 'GET /api/users/agents (Admin)',
        updateRole: 'PUT /api/users/:id/role (Admin)',
        deleteUser: 'DELETE /api/users/:id (Admin)'
      }
    }
  });
});

// Database Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const dbHealth = await testConnection();
  const statusCode = dbHealth.connected ? 200 : 503;
  res.status(statusCode).json({
    status: dbHealth.connected ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbHealth
  });
});

// Mount Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/recycling', recyclingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(` EcoCycle E-Waste Management API Server Running!`);
    console.log(` Port:    http://localhost:${PORT}`);
    console.log(` API Doc: http://localhost:${PORT}/api`);
    console.log(` Health:  http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);

    // Verify DB connection
    const health = await testConnection();
    if (health.connected) {
      console.log(` SQL Server Status: CONNECTED (${health.server} / DB: ${health.database})`);
    } else {
      console.warn(` SQL Server Status: WARNING - Not connected: ${health.error}`);
    }
  });
}

module.exports = app;
