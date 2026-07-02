// services/index.js — Switch giữa mock data và API thật
// Đổi USE_MOCK = false khi có backend

const USE_MOCK = true;

let mockModule, apiModule;

if (USE_MOCK) {
  mockModule = await import('./mockData');
} else {
  apiModule = await import('./api');
}

// Helper: ưu tiên mock, fallback API
const fromMock = (mockKey, apiFn) => {
  if (USE_MOCK && mockModule?.[mockKey]) return mockModule[mockKey];
  return apiFn;
};

// ── Export unified interface ──
export const routes           = fromMock('routes', null) || [];
export const buses            = fromMock('buses', null) || [];
export const trips            = fromMock('trips', null) || [];
export const tickets          = fromMock('tickets', null) || [];
export const customers        = fromMock('customers', null) || [];
export const news             = fromMock('news', null) || [];
export const busTypes         = fromMock('busTypes', null) || [];
export const pickupPoints     = fromMock('pickupPoints', null) || {};
export const revenueData      = fromMock('revenueData', null) || [];
export const routeRevenueData = fromMock('routeRevenueData', null) || [];

export const getRoute         = fromMock('getRoute', apiModule?.fetchRoutes);
export const getBus           = fromMock('getBus', apiModule?.fetchBuses);
export const getBusType       = fromMock('getBusType', null);
export const searchTripsFn    = fromMock('searchTrips', apiModule?.searchTrips);
export const formatPrice      = fromMock('formatPrice', null);
export const formatDuration   = fromMock('formatDuration', null);
export const generateSeatMap  = fromMock('generateSeatMap', null);
export const getDashboardStats = fromMock('getDashboardStats', apiModule?.fetchDashboardStats);

// API-only functions (dùng khi USE_MOCK = false)
export const api = apiModule || {};
