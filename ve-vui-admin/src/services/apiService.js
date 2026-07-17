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
export const batchCreateTrips = (body) => apiFetch('/api/admin/trips/batch', { method: 'POST', body: JSON.stringify(body) });
export const updateTrip  = (id, body) => apiFetch(`/api/admin/trips/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteTrip  = (id) => apiFetch(`/api/admin/trips/${id}`, { method: 'DELETE' });
export const fetchTripById    = (id) => apiFetch(`/api/admin/trips/${id}`);
export const updateTripStatus = (id, status) => apiFetch(`/api/admin/trips/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const fetchTripStats   = () => apiFetch('/api/admin/trips/stats');
export const searchTripsAdmin = (q) => apiFetch(`/api/admin/trips/search?q=${encodeURIComponent(q)}`);
export const fetchTripSeatMap = (id) => apiFetch(`/api/trips/${id}/seats`);

// ── Buses (new) ──
export const fetchBusById     = (id) => apiFetch(`/api/admin/buses/${id}`);
export const updateBusStatus  = (id, status) => apiFetch(`/api/admin/buses/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

// ── Tickets ──
export const fetchTickets = (page = 0, size = 50) => apiFetch(`/api/admin/tickets?page=${page}&size=${size}`);
export const cancelTicket = (id) => apiFetch(`/api/tickets/${id}/cancel`, { method: 'PUT' });
export const fetchTicketById  = (id) => apiFetch(`/api/admin/tickets/${id}`);
export const searchTicketsAdmin = (q) => apiFetch(`/api/admin/tickets/search?q=${encodeURIComponent(q)}`);
export const updateTicketStatus = (id, status) => apiFetch(`/api/admin/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const exportTickets    = () => apiFetch('/api/admin/tickets/export');
export const fetchTicketsByTripId = (tripId) => apiFetch(`/api/admin/tickets/trip/${tripId}`);

// ── Users / Customers ──
export const fetchUsers  = (page = 0, size = 100) => apiFetch(`/api/admin/users?page=${page}&size=${size}`);
export const fetchUserById    = (id) => apiFetch(`/api/admin/users/${id}`);
export const searchUsers      = (q) => apiFetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
export const updateUserStatus = (id, status) => apiFetch(`/api/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const deleteUser       = (id) => apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
export const fetchUserTickets = (id) => apiFetch(`/api/tickets/search?customerId=${id}`);

// ── News ──
export const fetchNews   = (page = 0, size = 50) => apiFetch(`/api/news?page=${page}&size=${size}`);
export const fetchNewsAdmin   = (page = 0, size = 50) => apiFetch(`/api/admin/news?page=${page}&size=${size}`);
export const createNews  = (body) => apiFetch('/api/admin/news', { method: 'POST', body: JSON.stringify(body) });
export const updateNews  = (id, body) => apiFetch(`/api/admin/news/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteNews  = (id) => apiFetch(`/api/admin/news/${id}`, { method: 'DELETE' });
export const publishNews      = (id) => apiFetch(`/api/admin/news/${id}/publish`, { method: 'PUT' });
export const unpublishNews    = (id) => apiFetch(`/api/admin/news/${id}/draft`, { method: 'PUT' });

// ═══════════════════════════════════
// ── Quản lý Xe (bổ sung) ──
// ═══════════════════════════════════
export const searchBusesAdmin   = (q)         => apiFetch(`/api/admin/buses/search?q=${encodeURIComponent(q)}`);
export const fetchBusTypeById   = (id)        => apiFetch(`/api/admin/bus-types/${id}`);

// ═══════════════════════════════════
// ── Quản lý Vé (bổ sung Admin CRUD) ──
// ═══════════════════════════════════
export const deleteTicket         = (id)        => apiFetch(`/api/admin/tickets/${id}`, { method: 'DELETE' });
export const createTicketAdmin    = (body)       => apiFetch('/api/admin/tickets', { method: 'POST', body: JSON.stringify(body) });

// ═══════════════════════════════════
// ── Quản lý Người dùng (bổ sung Admin CRUD) ──
// ═══════════════════════════════════
export const searchUsersAdmin   = (q)         => apiFetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
export const createUserAdmin    = (body)       => apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(body) });
export const updateUserRole     = (id, role)   => apiFetch(`/api/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });

// ═══════════════════════════════════
// ── Quản lý Tin tức (bổ sung) ──
// ═══════════════════════════════════
export const fetchNewsById      = (id)        => apiFetch(`/api/admin/news/${id}`);
export const searchNewsAdmin    = (q)         => apiFetch(`/api/admin/news/search?q=${encodeURIComponent(q)}`);
export const fetchNewsByCategory = (cat, page = 0, size = 10) => apiFetch(`/api/news/category/${encodeURIComponent(cat)}?page=${page}&size=${size}`);

// ── Pickup Points ──
export const fetchPickupPoints = (city) => apiFetch(`/api/admin/pickup-points${city ? `?city=${encodeURIComponent(city)}` : ''}`);
export const fetchPickupPointsByCity = (city) => apiFetch(`/api/pickup-points?city=${encodeURIComponent(city)}`);
export const createPickupPoint = (body) => apiFetch('/api/admin/pickup-points', { method: 'POST', body: JSON.stringify(body) });
export const updatePickupPoint = (id, body) => apiFetch(`/api/admin/pickup-points/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deletePickupPoint = (id) => apiFetch(`/api/admin/pickup-points/${id}`, { method: 'DELETE' });

// ── Trip Pickup Points ──
export const fetchTripPickupPoints = (tripId) => apiFetch(`/api/admin/trips/${tripId}/pickup-points`);
export const saveTripPickupPoints = (tripId, body) => apiFetch(`/api/admin/trips/${tripId}/pickup-points`, { method: 'POST', body: JSON.stringify(body) });

// ── Active & Completed Trips ──
export const fetchActiveTrips = () => apiFetch('/api/admin/trips/active');
export const fetchCompletedTrips = (q, date) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (date) params.set('date', date);
  const qs = params.toString();
  return apiFetch(`/api/admin/trips/completed${qs ? `?${qs}` : ''}`);
};
export const confirmTripCompleted = (id) => apiFetch(`/api/admin/trips/${id}/confirm-completed`, { method: 'PUT' });

// ── Cities ──
export const fetchCities = () => apiFetch('/api/cities');
export const fetchCitiesAdmin = () => apiFetch('/api/admin/cities');
export const createCity = (body) => apiFetch('/api/admin/cities', { method: 'POST', body: JSON.stringify(body) });
export const updateCity = (id, body) => apiFetch(`/api/admin/cities/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteCity = (id) => apiFetch(`/api/admin/cities/${id}`, { method: 'DELETE' });
export const permanentDeleteCity = (id) => apiFetch(`/api/admin/cities/${id}/permanent`, { method: 'DELETE' });

// ── Format helpers ──
export const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

export const formatDuration = (m) => {
  const h = Math.floor((m || 0) / 60), min = (m || 0) % 60;
  return min > 0 ? `${h}h${String(min).padStart(2, '0')}` : `${h}h`;
};
