// apps/mobile/src/api/client.js
// VyayamAI — Resilient API Client with Auto-IP Migration & Offline Demo Support

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/helpers';

const STORAGE_SERVER_KEY = 'vyayamai_server_url';
export const DEFAULT_SERVER_URL = 'http://10.114.189.190:5000/api';

let cachedBaseUrl = DEFAULT_SERVER_URL;

export const getBaseUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_SERVER_KEY);
    if (saved && saved.trim()) {
      // Auto-migrate if stored URL contains the outdated IP
      if (saved.includes('172.17.29.190')) {
        await AsyncStorage.setItem(STORAGE_SERVER_KEY, DEFAULT_SERVER_URL);
        cachedBaseUrl = DEFAULT_SERVER_URL;
        return DEFAULT_SERVER_URL;
      }
      cachedBaseUrl = saved.trim();
      return cachedBaseUrl;
    }
  } catch (e) {}
  return cachedBaseUrl;
};

export const setBaseUrl = async (newUrl) => {
  let clean = (newUrl || '').trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'http://' + clean;
  }
  if (!clean.endsWith('/api')) {
    clean = clean.replace(/\/+$/, '') + '/api';
  }
  cachedBaseUrl = clean;
  await AsyncStorage.setItem(STORAGE_SERVER_KEY, clean);
  return clean;
};

export const testServerConnection = async (targetUrl = null) => {
  const urlToTest = targetUrl || (await getBaseUrl());
  const healthUrl = urlToTest.replace(/\/+$/, '') + '/health';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch (e) {
    return false;
  }
};

let onUnauthorizedCallback = null;

export const setOnUnauthorized = (cb) => {
  onUnauthorizedCallback = cb;
};

// ============================================================================
// OFFLINE & INSTANT DEMO DATA STORE
// Guaranteed to keep the app 100% functional even when offline or disconnected
// ============================================================================
const DEMO_RESPONSES = {
  '/profile': {
    id: 7,
    name: 'Aditi Prakash Kadam',
    email: 'aditipkadam11@gmail.com',
    member_id: 'MM-2026-00001',
    role: 'client',
    phone: '+91 98765 43210',
    age: 24,
    gender: 'female',
    height_cm: 165,
    weight_kg: 58.0,
    bmi: 21.3,
    fitness_goal: 'muscle_gain',
    dietary_preference: 'non_veg',
    activity_level: 'moderate',
    daily_calorie_target: 2100,
    membership_status: 'active',
  },
  '/profile/member-history': {
    member_id: 'MM-2026-00001',
    joined_date: '2026-01-15',
    membership_plan: 'Annual Elite VIP',
    attendance_rate: '92%',
    total_workouts: 74,
  },
  '/nutrition/log/today': {
    total_calories: 1450,
    total_protein: 98,
    total_carbs: 165,
    total_fat: 46,
    meals: [
      {
        id: 1,
        meal_type: 'Breakfast',
        total_calories: 420,
        total_protein: 28,
        total_carbs: 45,
        total_fat: 12,
        detected_foods: '["3 Boiled Eggs", "Multigrain Toast", "Avocado Slice"]',
        logged_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 2,
        meal_type: 'Lunch',
        total_calories: 680,
        total_protein: 52,
        total_carbs: 78,
        total_fat: 16,
        detected_foods: '["Grilled Chicken Breast", "Brown Rice", "Steamed Broccoli"]',
        logged_at: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
      {
        id: 3,
        meal_type: 'Pre-Workout Snack',
        total_calories: 350,
        total_protein: 18,
        total_carbs: 42,
        total_fat: 8,
        detected_foods: '["Greek Yogurt with Berries", "Almonds (10 pcs)"]',
        logged_at: new Date().toISOString(),
      },
    ],
  },
  '/nutrition/history': [
    { log_date: new Date().toISOString().split('T')[0], total_calories: 1450, total_protein: 98 },
    { log_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], total_calories: 2050, total_protein: 145 },
    { log_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], total_calories: 2120, total_protein: 150 },
  ],
  '/workout/plan': {
    id: 1,
    title: 'VyayamAI Hypertrophy Alpha 4-Day',
    split_type: 'Push-Pull-Legs-Upper',
    days: [
      {
        id: 1,
        day_name: 'Day 1: Push Power',
        focus: 'Chest, Shoulders & Triceps',
        exercises: [
          { name: 'Incline Dumbbell Press', sets: 4, reps: '8-10', weight: '22kg' },
          { name: 'Barbell Flat Bench', sets: 3, reps: '10-12', weight: '55kg' },
          { name: 'Cable Lateral Raises', sets: 4, reps: '12-15', weight: '7.5kg' },
          { name: 'Overhead Tricep Rope Extension', sets: 3, reps: '12', weight: '15kg' },
        ],
      },
      {
        id: 2,
        day_name: 'Day 2: Pull & Back Depth',
        focus: 'Lats, Upper Back & Biceps',
        exercises: [
          { name: 'Lat Pulldowns (Wide Grip)', sets: 4, reps: '10', weight: '45kg' },
          { name: 'Seated Cable Row', sets: 4, reps: '10-12', weight: '40kg' },
          { name: 'Incline Dumbbell Curls', sets: 3, reps: '12', weight: '12kg' },
        ],
      },
    ],
  },
  '/workout/history': [
    {
      id: 1,
      day_focus: 'Push Power (Chest & Shoulders)',
      completed_sets: 14,
      duration_minutes: 54,
      logged_date: new Date().toISOString().split('T')[0],
    },
    {
      id: 2,
      day_focus: 'Pull Depth (Back & Biceps)',
      completed_sets: 12,
      duration_minutes: 48,
      logged_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    },
    {
      id: 3,
      day_focus: 'Legs & Core Conditioning',
      completed_sets: 15,
      duration_minutes: 60,
      logged_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    },
  ],
  '/health/automated-report': {
    health_score: 93,
    biometrics: {
      weight_kg: 58.0,
      bmi: 21.3,
      tdee: 2150,
      body_fat_pct: 18.5,
    },
    workouts: {
      adherence_pct: 95,
      weekly_sessions: 4,
      target_sessions: 4,
    },
    nutrition: {
      calorie_target_adherence: 96,
      protein_target_g: 110,
    },
    ai_insights:
      'Performance metrics are outstanding. Consistent protein intake and sleep recovery are driving muscle definition. Keep progressive overload active on push days.',
  },
  '/health/metrics': {
    resting_hr: 64,
    blood_pressure: '118/76',
    vo2_max: 44.5,
    sleep_score: 88,
  },
  '/notifications': [
    {
      id: 1,
      title: 'Welcome to VyayamAI!',
      message: 'Your personal AI nutrition & workout portal is ready.',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Hydration Target Reached',
      message: 'Great job logging 3.2L water today.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  '/trainer': {
    trainer_name: 'Coach Arjun Verma',
    specialization: 'Hypertrophy & Biomechanics',
    phone: '+91 99887 76655',
    email: 'arjun@gymadmin.com',
    rating: 4.9,
    active_plans_assigned: 1,
  },
  '/trainer/clients': [
    { id: 7, name: 'Aditi Prakash Kadam', member_id: 'MM-2026-00001', adherence: '95%', goal: 'Muscle Gain' },
    { id: 4, name: 'Sarah Chen', member_id: 'MM-2026-00002', adherence: '92%', goal: 'Lean Tone' },
    { id: 3, name: 'Rahul Sharma', member_id: 'MM-2026-00003', adherence: '88%', goal: 'Fat Loss' },
  ],
};

function getMockFallbackForEndpoint(endpoint) {
  const clean = endpoint.split('?')[0].replace(/\/+$/, '');
  if (DEMO_RESPONSES[clean]) return DEMO_RESPONSES[clean];
  // Prefix matching
  for (const [key, val] of Object.entries(DEMO_RESPONSES)) {
    if (clean.startsWith(key) || key.startsWith(clean)) return val;
  }
  return { success: true, message: 'Demo response', data: [] };
}

async function apiRequest(endpoint, method = 'GET', data = null, customHeaders = {}) {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  const isDemoSession = Boolean(token && (token === 'demo-token-123' || token.startsWith('demo-')));
  const baseUrl = await getBaseUrl();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;

  const config = { method, headers };

  if (data && !(data instanceof FormData)) {
    config.body = JSON.stringify(data);
  } else if (data instanceof FormData) {
    config.body = data;
    delete headers['Content-Type'];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    config.signal = controller.signal;

    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const resData = await response.json().catch(() => ({}));

    if (response.status === 401) {
      if (isDemoSession) {
        // In demo session, never purge auth — fallback to mock
        console.log(`[API Demo Fallback] on 401: ${cleanEndpoint}`);
        return { data: getMockFallbackForEndpoint(cleanEndpoint), status: 200 };
      }
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
      if (onUnauthorizedCallback) onUnauthorizedCallback();
      throw new Error(resData.message || 'Not authorized, please login again.');
    }

    if (!response.ok) {
      if (isDemoSession) {
        return { data: getMockFallbackForEndpoint(cleanEndpoint), status: 200 };
      }
      throw new Error(resData.message || `Server Error (${response.status})`);
    }

    return { data: resData, status: response.status };
  } catch (error) {
    console.warn(`[API Exception] ${method} ${url} - ${error.message}`);

    // If running in Demo Mode, NEVER throw errors — return instant mock data!
    if (isDemoSession) {
      console.log(`[API Demo Mode Active] Serving offline mock for ${cleanEndpoint}`);
      return { data: getMockFallbackForEndpoint(cleanEndpoint), status: 200 };
    }

    if (error.name === 'AbortError') {
      throw new Error(`Connection timed out reaching ${baseUrl}. Verify Wi-Fi network or configure server IP in settings.`);
    }
    if (error.message.includes('Network request failed') || error.message.includes('Network Error')) {
      throw new Error(`Cannot reach server at ${baseUrl}. Ensure your phone is connected to the same Wi-Fi.`);
    }
    throw error;
  }
}

const client = {
  get: (url, config = {}) => apiRequest(url, 'GET', null, config?.headers),
  post: (url, data, config = {}) => apiRequest(url, 'POST', data, config?.headers),
  put: (url, data, config = {}) => apiRequest(url, 'PUT', data, config?.headers),
  delete: (url, config = {}) => apiRequest(url, 'DELETE', null, config?.headers),
  request: (options) => apiRequest(options.url, options.method, options.data, options.headers),
};

export default client;
