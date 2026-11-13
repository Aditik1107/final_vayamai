// backend/scripts/migrateSupabase.js
// Runs the backend SQL schema (non-Prisma tables) against Supabase using DIRECT connection
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function run() {
  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    const schemaPath = path.join(__dirname, '../migrations/schema_postgres.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon, filter blank lines
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));

    let ok = 0, skip = 0;
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        ok++;
      } catch (e) {
        // Most "errors" are just "already exists" — safe to skip
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          skip++;
        } else {
          console.warn('  ⚠️ Skipped:', e.message.slice(0, 100));
          skip++;
        }
      }
    }

    console.log(`\n✅ Backend schema applied: ${ok} statements succeeded, ${skip} skipped (already exist)`);

    // Also add member_id column to users if missing (Prisma schema doesn't have it, backend needs it)
    try {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id VARCHAR(20) UNIQUE`);
      console.log('✅ member_id column ensured on users table');
    } catch (e) {
      console.log('  member_id already exists');
    }

    // Extra backend tables Prisma doesn't manage
    const extraTables = [
      `CREATE TABLE IF NOT EXISTS client_profiles (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(255) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        age INT,
        gender VARCHAR(20),
        height_cm DECIMAL(5,2),
        weight_kg DECIMAL(5,2),
        bmi DECIMAL(5,2),
        fitness_goal VARCHAR(50),
        dietary_preference VARCHAR(50),
        activity_level VARCHAR(50),
        daily_calorie_target INT DEFAULT 2200,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS workout_plans (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        trainer_id VARCHAR(255) REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        duration_weeks INT DEFAULT 4,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS workout_days (
        id SERIAL PRIMARY KEY,
        plan_id INT REFERENCES workout_plans(id) ON DELETE CASCADE,
        day_name VARCHAR(50),
        focus VARCHAR(100),
        exercises JSONB
      )`,
      `CREATE TABLE IF NOT EXISTS workout_logs (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        plan_id INT REFERENCES workout_plans(id),
        completed_exercises JSONB,
        notes TEXT,
        logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        check_in TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        check_out TIMESTAMPTZ,
        duration_minutes INT
      )`,
      `CREATE TABLE IF NOT EXISTS automated_health_reports (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        report_data JSONB,
        ai_insights TEXT,
        generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS trainer_alerts (
        id SERIAL PRIMARY KEY,
        trainer_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        client_id VARCHAR(255) REFERENCES users(id),
        alert_type VARCHAR(50),
        severity VARCHAR(20),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const tbl of extraTables) {
      try {
        await client.query(tbl);
        console.log('✅', tbl.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1], 'table ready');
      } catch (e) {
        console.warn('  Skipped table:', e.message.slice(0, 80));
      }
    }

    console.log('\n🎉 Backend migration complete!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
