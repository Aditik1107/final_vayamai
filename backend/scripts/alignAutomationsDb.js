// backend/scripts/alignAutomationsDb.js
require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.mdlpeualjuqgltlcsyey:Vyaym@1june2026@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase');

  // 1. Create table daily_nutrition_logs
  await client.query(`
    CREATE TABLE IF NOT EXISTS daily_nutrition_logs (
      id SERIAL PRIMARY KEY,
      client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      log_date DATE DEFAULT CURRENT_DATE,
      total_calories INT DEFAULT 0,
      total_protein DECIMAL(5,2) DEFAULT 0,
      total_carbs DECIMAL(5,2) DEFAULT 0,
      total_fat DECIMAL(5,2) DEFAULT 0
    )
  `);
  console.log('✅ daily_nutrition_logs table verified');

  // 2. Ensure workout_logs has logged_date
  await client.query(`ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS logged_date DATE DEFAULT CURRENT_DATE`);
  console.log('✅ workout_logs logged_date verified');

  // 3. Ensure automated_health_reports has report_date
  await client.query(`ALTER TABLE automated_health_reports ADD COLUMN IF NOT EXISTS report_date DATE DEFAULT CURRENT_DATE`);
  console.log('✅ automated_health_reports report_date verified');

  // 4. Ensure notifications has user_id, is_read, and sent_by_id is nullable
  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)`);
  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false`);
  await client.query(`ALTER TABLE notifications ALTER COLUMN sent_by_id DROP NOT NULL`);
  console.log('✅ notifications table columns aligned');

  // 5. Backfill member_id for users that don't have one
  const { rows: usersWithoutMemberId } = await client.query(`SELECT id FROM users WHERE member_id IS NULL`);
  let seq = 1;
  for (const u of usersWithoutMemberId) {
    const memId = 'MM-2026-' + String(seq++).padStart(5, '0');
    await client.query(`UPDATE users SET member_id = $1 WHERE id = $2`, [memId, u.id]);
  }
  console.log(`✅ Backfilled member_ids for ${usersWithoutMemberId.length} users`);

  await client.end();
  console.log('🎉 Automation DB alignments complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
