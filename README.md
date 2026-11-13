# VyayamAI — Integrated Monorepo

> AI-powered Gym Management SaaS — Landing Page · Gym Owner Admin · Trainer Mobile · Client Mobile

## Architecture

```
Landing Page (apps/web — Next.js)
         ↓
Common Backend / API (backend/ — Express + Supabase)
   Authentication · Database · Role-based access
         ↓
┌────────────────┬────────────────────┬────────────────────────┐
│ Client         │ Trainer            │ Gym Owner              │
│ (React Native) │ (React Native)     │ (Website)              │
│ apps/mobile/   │ apps/mobile/       │ apps/web/              │
│ src/screens/   │ src/trainer/       │ src/app/(dashboard)/   │
└────────────────┴────────────────────┴────────────────────────┘
              Shared Database: Supabase PostgreSQL
```

## Repo Structure

```
final_vayamai/
├── apps/
│   ├── web/           ← Next.js 16 (Gym Owner Dashboard + Landing Page)
│   └── mobile/        ← React Native CLI (Client + Trainer portals)
├── backend/           ← Express.js API (Supabase/PostgreSQL)
├── .env.example       ← Template for all environment variables
└── README.md
```

---

## Quick Start

### 1. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Android Studio / Xcode | For mobile dev |
| Git | Any |

### 2. Clone & Setup Env Files

```bash
git clone https://github.com/Aditik1107/final_vayamai.git
cd final_vayamai
```

**Backend env:**
```bash
cp .env.example backend/.env
# Edit backend/.env with your Supabase credentials and JWT_SECRET
```

**Web env:**
```bash
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with DATABASE_URL, DIRECT_URL, JWT_SECRET
```

### 3. Backend (Express API)

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:5000
```

Verify: `curl http://localhost:5000/api/health`

### 4. Web Admin (Next.js)

```bash
cd apps/web
npm install
npx prisma generate
npx prisma migrate dev   # pushes schema to Supabase
npm run dev              # starts on http://localhost:3000
```

Default admin login: `admin@gymadmin.com` / `Admin@123`

### 5. Mobile (React Native)

```bash
cd apps/mobile
npm install
# Start Metro bundler
npm start

# Android (new terminal)
npm run android

# iOS (macOS only)
npm run ios
```

> **API URL for mobile:** Android emulator → `http://10.0.2.2:5000/api`.  
> For a physical device, set `VYAYAMAI_API_URL` in `apps/mobile/.env` to your machine's LAN IP.

---

## Database (Supabase)

Both `apps/web` (Prisma) and `backend` (raw pg) connect to the **same Supabase PostgreSQL database**.

| App | ORM/Driver | Schema managed by |
|-----|-----------|-------------------|
| `apps/web` | Prisma | `npx prisma migrate dev` |
| `backend` | `pg` pool | `backend/migrations/schema_postgres.sql` |

> **First-time setup:** Run `npx prisma migrate dev` from `apps/web/` to create all tables. The backend will then work against the same tables.

---

## Role-Based Access

| Role | Portal | Auth |
|------|--------|------|
| `ADMIN` / `GYM_OWNER` | `apps/web` (Next.js) | Email + Password → JWT cookie |
| `TRAINER` | `apps/mobile` src/trainer/ | Email + Password → Bearer JWT |
| `CLIENT` | `apps/mobile` src/screens/ | Member ID + Password → Bearer JWT |

---

## Key API Endpoints (backend/)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register client or trainer |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/profile` | Client profile |
| POST | `/api/nutrition/log` | Log meal |
| GET | `/api/nutrition/daily` | Daily nutrition summary |
| POST | `/api/health/blood-report` | Upload blood report |
| GET | `/api/workout` | Workout plans |
| GET | `/api/notifications` | Notifications |
| GET | `/api/attendance` | Attendance records |
| GET | `/api/trainer/clients` | Trainer's client list |

---

## Deployment

### Backend → Vercel Serverless
The `backend/vercel.json` is already configured. Deploy:
```bash
cd backend
npx vercel --prod
```

### Web Admin → Vercel
```bash
cd apps/web
npx vercel --prod
```
Set all env vars in Vercel dashboard (Settings → Environment Variables).

### Mobile → APK / IPA
```bash
cd apps/mobile
# Android
cd android && ./gradlew assembleRelease

# iOS
npx react-native run-ios --configuration Release
```

---

## Contributing

- `apps/web` — TypeScript, Next.js App Router, Prisma, Tailwind CSS
- `apps/mobile` — JavaScript, React Native CLI, React Navigation
- `backend` — JavaScript, Express.js, `pg` (PostgreSQL)

Keep each app's original style and conventions. Do not move files between apps without updating all imports.
