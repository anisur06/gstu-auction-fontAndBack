const FALLBACK_API_URL = 'https://gstu-auction-backend.onrender.com';
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? FALLBACK_API_URL : '');

export function apiFetch(path, options) {
  // If path looks absolute (starts with http), don't prefix
  const absolute = /^https?:\/\//i.test(path);
  const url = absolute ? path : `${API_BASE}${path}`;
  return fetch(url, options);
}

export function apiUrl(path = '') {
  if (!path) return API_BASE || '';
  const absolute = /^https?:\/\//i.test(path);
  return absolute ? path : `${API_BASE}${path}`;
}

export const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (import.meta.env.PROD ? FALLBACK_API_URL : '');
