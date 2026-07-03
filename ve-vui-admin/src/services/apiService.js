// services/apiService.js — Tất cả HTTP call đến backend
const BASE_URL = 'http://localhost:8900';

// ── Helper ──
const getToken = () => {
  const raw = localStorage.getItem('vevui_admin');
  if (!raw) return null;
  try { return JSON.parse(raw).token; } catch { return null; }
};

const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

// ── Auth ──
export const loginAdmin = async (email, password) => {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.role !== 'ADMIN') throw new Error('Tài khoản không có quyền admin');
  return data;
};

// ── Stats (order-service) ──
export const fetchStats = () => apiFetch('/api/admin/stats');

// ── Routes ──
export const fetchRoutes      = (page = 0, size = 100) => apiFetch(`/api/admin/routes?page=${page}&size=${size}`);
export const fetchPublicRoutes = () => apiFetch('/api/routes');
export const createRoute      = (body) => apiFetch('/api/admin/routes', { method: 'POST', body: JSON.stringify(body) });
export const updateRoute      = (id, body) => apiFetch(`/api/admin/routes/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteRoute      = (id) => apiFetch(`/api/admin/routes/${id}`, { method: 'DELETE' });

// ── Buses ──
export const fetchBuses       = (page = 0, size = 100) => apiFetch(`/api/admin/buses?page=${page}&size=${size}`);
export const fetchPublicBuses = () => apiFetch('/api/buses');
export const createBus        = (body) => apiFetch('/api/admin/buses', { method: 'POST', body: JSON.stringify(body) });
export const updateBus        = (id, body) => apiFetch(`/api/admin/buses/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteBus        = (id) => apiFetch(`/api/admin/buses/${id}`, { method: 'DELETE' });

// ── Bus Types ──
export const fetchBusTypes    = () => apiFetch('/api/admin/bus-types');
export const createBusType    = (body) => apiFetch('/api/admin/bus-types', { method: 'POST', body: JSON.stringify(body) });
export const updateBusType    = (id, body) => apiFetch(`/api/admin/bus-types/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteBusType    = (id) => apiFetch(`/api/admin/bus-types/${id}`, { method: 'DELETE' });

// ── Trips ──
export const fetchTrips  = (page = 0, size = 50) => apiFetch(`/api/admin/trips?page=${page}&size=${size}`);
export const createTrip  = (body) => apiFetch('/api/admin/trips', { method: 'POST', body: JSON.stringify(body) });
export const updateTrip  = (id, body) => apiFetch(`/api/admin/trips/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteTrip  = (id) => apiFetch(`/api/admin/trips/${id}`, { method: 'DELETE' });

// ── Tickets ──
export const fetchTickets = (page = 0, size = 50) => apiFetch(`/api/admin/tickets?page=${page}&size=${size}`);
export const cancelTicket = (id) => apiFetch(`/api/tickets/${id}/cancel`, { method: 'PUT' });

// ── Users / Customers ──
export const fetchUsers  = (page = 0, size = 100) => apiFetch(`/api/admin/users?page=${page}&size=${size}`);

// ── News ──
export const fetchNews   = (page = 0, size = 50) => apiFetch(`/api/news?page=${page}&size=${size}`);
export const createNews  = (body) => apiFetch('/api/admin/news', { method: 'POST', body: JSON.stringify(body) });
export const updateNews  = (id, body) => apiFetch(`/api/admin/news/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteNews  = (id) => apiFetch(`/api/admin/news/${id}`, { method: 'DELETE' });

// ── Format helpers ──
export const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

export const formatDuration = (m) => {
  const h = Math.floor((m || 0) / 60), min = (m || 0) % 60;
  return min > 0 ? `${h}h${String(min).padStart(2, '0')}` : `${h}h`;
};
