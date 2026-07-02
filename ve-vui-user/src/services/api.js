// services/api.js — Gọi API thật qua API Gateway
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8900';

// ─── Token helpers ───────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('vevui_access_token');
export const getRefreshToken = () => localStorage.getItem('vevui_refresh_token');
export const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem('vevui_access_token', accessToken);
  if (refreshToken) localStorage.setItem('vevui_refresh_token', refreshToken);
};
export const clearTokens = () => {
  localStorage.removeItem('vevui_access_token');
  localStorage.removeItem('vevui_refresh_token');
  localStorage.removeItem('vevui_user');
};

// ─── Base request ─────────────────────────────────────────────────────────────
const request = async (endpoint, options = {}, withAuth = false) => {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (withAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  // Auto refresh on 401
  if (res.status === 401 && withAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      const retry = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
      if (!retry.ok) throw new ApiError(retry.status, await retry.json().catch(() => ({})));
      return retry.status === 204 ? null : retry.json();
    }
    clearTokens();
    window.location.href = '/dang-nhap';
    throw new ApiError(401, { error: 'Phiên đăng nhập hết hạn' });
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new ApiError(res.status, errBody);
  }
  return res.status === 204 ? null : res.json();
};

// Custom error class để frontend có thể bắt lỗi dễ hơn
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || body?.message || `Lỗi ${status}`);
    this.status = status;
    this.body = body;
  }
}

const tryRefresh = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    saveTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  refresh: (refreshToken) =>
    request('/api/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  getMe: (userId) =>
    request('/api/auth/me', {}, true),

  updateProfile: (id, data) =>
    request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true),
};

// ─── TRIPS ────────────────────────────────────────────────────────────────────
/**
 * Map TripResponse từ backend sang format frontend dùng
 * Backend: { fromCity, toCity, tripDate, bus.busTypeCode, bus.busTypeName, ... }
 * Frontend: { route.from, route.to, date, busType.code, busType.name, ... }
 */
export const mapTrip = (t) => ({
  ...t,
  id: String(t.id),
  date: t.tripDate,
  price: Number(t.price),
  availableSeats: t.availableSeats,
  bookedSeats: t.bookedSeats || [],
  route: {
    from: t.route?.fromCity ?? t.fromCity ?? '',
    to: t.route?.toCity ?? t.toCity ?? '',
    duration: t.route?.durationMinutes ?? 0,
    distance: t.route?.distanceKm ?? 0,
    stops: t.route?.stops ? t.route.stops.split(',').map(s => s.trim()).filter(Boolean) : [],
  },
  busType: t.bus ? {
    code: t.bus.busTypeCode || 'STANDARD',
    name: t.bus.busTypeName || 'Xe khách',
    seats: t.bus.totalSeats || 0,
  } : { code: 'STANDARD', name: 'Xe khách', seats: 0 },
  bus: t.bus || null,
});

export const tripApi = {
  search: (from, to, date) =>
    request(`/api/trips/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`)
      .then(list => (list || []).map(mapTrip)),

  getById: (id) =>
    request(`/api/trips/${id}`).then(mapTrip),

  getSeatMap: (id) =>
    request(`/api/trips/${id}/seats`),

  getPickupPoints: (city) =>
    request(`/api/pickup-points?city=${encodeURIComponent(city)}`),
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────
export const mapRoute = (r) => ({
  ...r,
  id: String(r.id),
  from: r.fromCity,
  to: r.toCity,
  duration: r.durationMinutes,
  distance: r.distanceKm,
  basePrice: Number(r.basePrice),
});

export const routeApi = {
  getAll: (popularOnly = false) =>
    request(`/api/routes${popularOnly ? '?popularOnly=true' : ''}`)
      .then(list => (list || []).map(mapRoute)),

  getById: (id) =>
    request(`/api/routes/${id}`).then(mapRoute),
};

// ─── TICKETS / ORDERS ─────────────────────────────────────────────────────────
/**
 * Map TicketResponse từ backend sang format frontend dùng để hiển thị
 */
export const mapTicket = (t) => ({
  ...t,
  totalPrice: Number(t.totalPrice),
  tripInfo: {
    from: t.fromCity,
    to: t.toCity,
    date: t.tripDate,
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
  },
  customerName: t.customerName,
  phone: t.phone,
  email: t.email,
  seats: t.seats || [],
  status: t.status,
  bookedAt: t.bookedAt,
});

export const ticketApi = {
  /**
   * Tạo vé mới
   * @param {Object} data - CreateTicketRequest
   * @param {number} data.tripId
   * @param {number|null} data.customerId
   * @param {string} data.customerName
   * @param {string} data.phone
   * @param {string} data.email
   * @param {string[]} data.seats
   * @param {number|null} data.pickupPointId
   * @param {number|null} data.dropoffPointId
   * @param {number} data.totalPrice
   * @param {string} data.paymentMethod
   * @param {string|null} data.couponCode
   * @param {string} data.fromCity
   * @param {string} data.toCity
   * @param {string} data.tripDate
   * @param {string} data.departureTime
   * @param {string} data.arrivalTime
   */
  create: (data) =>
    request('/api/tickets', { method: 'POST', body: JSON.stringify(data) }, true)
      .then(mapTicket),

  getById: (id) =>
    request(`/api/tickets/${id}`, {}, true).then(mapTicket),

  searchByPhone: (phone) =>
    request(`/api/tickets/search?phone=${encodeURIComponent(phone)}`)
      .then(list => (list || []).map(mapTicket)),

  getMyTickets: (customerId) =>
    request(`/api/tickets/search?customerId=${customerId}`, {}, true)
      .then(list => (list || []).map(mapTicket)),

  cancel: (id) =>
    request(`/api/tickets/${id}/cancel`, { method: 'PUT' }, true).then(mapTicket),
};

// ─── PAYMENT ──────────────────────────────────────────────────────────────────
export const paymentApi = {
  applyCoupon: (code, originalPrice) =>
    request('/api/payment/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({ code, originalPrice }),
    }),

  process: (ticketId, paymentMethod, amount) =>
    request('/api/payment/process', {
      method: 'POST',
      body: JSON.stringify({ ticketId, paymentMethod, amount }),
    }, true),
};

// ─── NEWS ─────────────────────────────────────────────────────────────────────
export const newsApi = {
  getAll: () => request('/api/news').then(res => res?.content || res || []),
  getById: (id) => request(`/api/news/${id}`),
  getBySlug: (slug) => request(`/api/news?slug=${encodeURIComponent(slug)}`).then(res => res?.content?.[0] || res || null),
};

// ─── Utility ──────────────────────────────────────────────────────────────────
export const formatPrice = (price) => {
  if (price == null) return '0₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export const formatDuration = (minutes) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
};
