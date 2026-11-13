// backend/index.js
// VyayamAI — Express API Server (Supabase/PostgreSQL)
// Serves both the React Native mobile apps and is called by the Next.js web admin.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow the Next.js web admin, local dev, and any configured origins.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://10.0.2.2:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists (safely for serverless environments)
try {
  const uploadDir = path.join('/tmp', 'blood_reports');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir));
} catch (e) {
  console.log('[Uploads] Directory warning:', e.message);
}

// ── Root Route ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'VyayamAI Backend API',
    version: '2.0.0',
    status: 'online',
    description: 'Shared API for VyayamAI mobile apps (Client + Trainer) and Admin web portal',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      profile: '/api/profile',
      nutrition: '/api/nutrition',
      workout: '/api/workout',
      health_metrics: '/api/health',
      notifications: '/api/notifications',
      attendance: '/api/attendance',
      trainer: '/api/trainer',
    },
    timestamp: new Date(),
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const healthRoutes = require('./routes/healthRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const trainerApiRoutes = require('./routes/trainerApiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api', trainerApiRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'VyayamAI Backend', timestamp: new Date() });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const response = { message };
  if (process.env.NODE_ENV === 'development') {
    response.error = err.message;
    response.stack = err.stack;
  }
  res.status(status).json(response);
});

// ── Export for Vercel Serverless ──────────────────────────────────────────────
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 VyayamAI Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Allowed CORS origins: ${allowedOrigins.join(', ')}\n`);
  });
}
