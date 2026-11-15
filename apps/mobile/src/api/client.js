// apps/mobile/src/api/client.js
// VyayamAI — API client for React Native (Client + Trainer portals)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/helpers';

const STORAGE_SERVER_KEY = 'vyayamai_server_url';
export const DEFAULT_SERVER_URL = 'http://10.114.189.190:5000/api';

let cachedBaseUrl = DEFAULT_SERVER_URL;

export const getBaseUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_SERVER_KEY);
    if (saved && saved.trim()) {
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
    const timeout = setTimeout(() => controller.abort(), 4000);
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

async function apiRequest(endpoint, method = 'GET', data = null, customHeaders = {}) {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  const baseUrl = await getBaseUrl();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;

  console.log(`[API Request] ${method} ${url}`);

  const config = { method, headers };

  if (data && !(data instanceof FormData)) {
    config.body = JSON.stringify(data);
  } else if (data instanceof FormData) {
    config.body = data;
    delete headers['Content-Type'];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    config.signal = controller.signal;

    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    console.log(`[API Response] ${response.status} ${url}`);
    const resData = await response.json().catch(() => ({}));

    if (response.status === 401) {
      console.warn(`[API 401] Unauthorized on ${url}`);
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
      if (onUnauthorizedCallback) onUnauthorizedCallback();
      throw new Error(resData.message || 'Not authorized, please login again.');
    }

    if (!response.ok) {
      console.warn(`[API Error] ${response.status} on ${url}: ${resData.message}`);
      throw new Error(resData.message || `Server Error (${response.status})`);
    }

    return { data: resData, status: response.status };
  } catch (error) {
    console.error(`[API Exception] ${method} ${url} - ${error.message}`);
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
