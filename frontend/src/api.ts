const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getAuthToken(): string | null {
  return localStorage.getItem('ticket_app_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  method = 'GET',
  body?: any
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data as T;
}

export { API_BASE_URL };
