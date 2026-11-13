// backend/config/db.js
// VyayamAI — PostgreSQL/Supabase connection (env-only, no hardcoded credentials)

require('dotenv').config();

const { executeMockQuery } = require('./mockDbEngine');

let Pool = null;
try {
  Pool = require('pg').Pool;
} catch (e) {
  console.warn('[DB] pg module not installed — using mock datastore');
}

// Build pool config from env only
function buildPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      max: 10,
    };
  }
  if (!process.env.DB_HOST) {
    console.warn('[DB] No DATABASE_URL or DB_HOST set — using mock datastore');
    return null;
  }
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '6543'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    max: 10,
  };
}

const poolConfig = buildPoolConfig();
let pool = null;
let useFallback = !Pool || !poolConfig;

if (Pool && poolConfig) {
  try {
    pool = new Pool(poolConfig);
    pool.on('error', (err) => {
      console.warn('[DB] Pool error:', err.message, '— falling back to mock store');
      useFallback = true;
    });
  } catch (e) {
    console.warn('[DB] Pool init failed:', e.message, '— using mock store');
    useFallback = true;
  }
}

// Convert MySQL-style '?' placeholders to PostgreSQL '$1, $2...'
function convertPlaceholders(sql) {
  let idx = 1;
  return sql.replace(/\?/g, () => `$${idx++}`);
}

// Global query — returns [rows, result] like mysql2
const query = async (sql, params = []) => {
  if (!useFallback && pool) {
    try {
      let pgSql = convertPlaceholders(sql);
      if (/^\s*INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }
      const result = await pool.query(pgSql, params);
      const rows = result.rows || [];
      if (rows.length > 0 && rows[0].id !== undefined) rows.insertId = rows[0].id;
      return [rows, result];
    } catch (err) {
      console.warn(`[DB] Query failed (${err.message}) — using mock store`);
      return executeMockQuery(sql, params);
    }
  }
  return executeMockQuery(sql, params);
};

// Transaction connection wrapper
const getConnection = async () => {
  if (!useFallback && pool) {
    try {
      const client = await pool.connect();
      const clientQuery = async (sql, params = []) => {
        let pgSql = convertPlaceholders(sql);
        if (/^\s*INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) pgSql += ' RETURNING id';
        const result = await client.query(pgSql, params);
        const rows = result.rows || [];
        if (rows.length > 0 && rows[0].id !== undefined) rows.insertId = rows[0].id;
        return [rows, result];
      };
      return {
        query: clientQuery,
        beginTransaction: () => client.query('BEGIN'),
        commit: () => client.query('COMMIT'),
        rollback: () => client.query('ROLLBACK'),
        release: () => client.release(),
      };
    } catch (e) {
      console.warn('[DB] Transaction fallback:', e.message);
    }
  }
  return {
    query: async (sql, params) => executeMockQuery(sql, params),
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };
};

module.exports = { pool, query, getConnection };
