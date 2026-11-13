// apps/web/src/lib/backend-api.ts
// VyayamAI — Server-side helper to call the Express backend from Next.js API routes.
// Use this in Next.js Route Handlers (app/api/**) for operations that need the
// shared mobile backend (e.g., syncing nutrition logs visible to Admin).

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export interface BackendRequestOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  token?: string;
}

export async function backendRequest<T = unknown>({
  endpoint,
  method = 'GET',
  body,
  token,
}: BackendRequestOptions): Promise<T> {
  const url = `${BACKEND_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message ||
        `Backend request failed: ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}
