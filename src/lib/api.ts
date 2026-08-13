const BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1';
const TOKEN_KEY = 'physioprime_token';
const USER_KEY = 'physioprime_user';

export interface StoredUser {
  id: number;
  name: string;
  email?: string;
  phone?: string | null;
  gender?: string | null;
  dob?: string | null;
  weight?: string | null;
  height?: string | null;
  address?: Record<string, unknown> | null;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: StoredUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', 0);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: { message?: string; issues?: { message?: string }[] } };
      message =
        body?.error?.message ||
        body?.error?.issues?.map(i => i.message).join('; ') ||
        message;
    } catch {
      // keep default message
    }
    if (res.status === 401) clearAuth();
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
