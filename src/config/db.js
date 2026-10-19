require('dotenv').config();

let sql;
let pool = null;

const dbServer = process.env.DB_SERVER || 'localhost';
const dbName = process.env.DB_NAME || 'mywebsite';
const dbUser = process.env.DB_USER || '';
const dbPassword = process.env.DB_PASSWORD || '';
const dbPort = parseInt(process.env.DB_PORT || '1433', 10);

async function getPool() {
  if (pool && pool.connected) {
    return pool;
  }

  // 1. If SQL Server authentication credentials are provided
  if (dbUser && dbPassword) {
    sql = require('mssql');
    const sqlConfig = {
      user: dbUser,
      password: dbPassword,
      server: dbServer,
      port: dbPort,
      database: dbName,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
    try {
      console.log(`Connecting to SQL Server (${dbServer}/${dbName}) with SQL Authentication...`);
      pool = await new sql.ConnectionPool(sqlConfig).connect();
      console.log('Connected to SQL Server successfully (SQL Auth)');
      return pool;
    } catch (err) {
      console.error('SQL Authentication connection failed:', err.message);
      throw err;
    }
  }

  // 2. Windows Integrated Authentication (ODBC Driver 17 / msnodesqlv8)
  try {
    sql = require('mssql/msnodesqlv8');
    const connString = `Driver={ODBC Driver 17 for SQL Server};Server=${dbServer};Database=${dbName};Trusted_Connection=yes;TrustServerCertificate=yes;`;
    console.log(`Connecting to SQL Server (${dbServer}/${dbName}) via Windows Authentication (ODBC 17)...`);
    pool = await new sql.ConnectionPool({ connectionString: connString }).connect();
    console.log('Connected to SQL Server successfully (Windows Auth)');
    return pool;
  } catch (err) {
    console.warn('ODBC 17 connection attempt failed:', err.message);
    try {
      // Fallback to legacy SQL Server driver
      const fallbackConnString = `Driver={SQL Server};Server=${dbServer};Database=${dbName};Trusted_Connection=yes;`;
      console.log('Attempting connection with fallback Driver={SQL Server}...');
      pool = await new sql.ConnectionPool({ connectionString: fallbackConnString }).connect();
      console.log('Connected to SQL Server successfully (Fallback Driver)');
      return pool;
    } catch (fallbackErr) {
      console.error('All SQL Server connection attempts failed:', fallbackErr.message);
      throw fallbackErr;
    }
  }
}

/**
 * Execute a parameterized query safely
 * @param {string} text - SQL query text with @paramName placeholders
 * @param {object} params - Key-value map of parameters { name: value, ... }
 */
async function query(text, params = {}) {
  const currentPool = await getPool();
  const request = currentPool.request();

  if (params && typeof params === 'object') {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        request.input(key, value);
      }
    }
  }

  const result = await request.query(text);
  return result;
}

/**
 * Health check helper
 */
async function testConnection() {
  try {
    const res = await query('SELECT @@SERVERNAME as serverName, DB_NAME() as databaseName, GETDATE() as currentTime');
    return {
      connected: true,
      server: res.recordset[0]?.serverName,
      database: res.recordset[0]?.databaseName,
      currentTime: res.recordset[0]?.currentTime
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
}

module.exports = {
  getPool,
  query,
  testConnection
};
