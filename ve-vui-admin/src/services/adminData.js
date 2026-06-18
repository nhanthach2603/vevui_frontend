// services/adminData.js — Shared mock data for admin
// This mirrors the user app's data so they work together

export const busTypes = [
  { id: 'bt1', name: 'Ghế ngồi thường', code: 'STANDARD', seats: 45 },
  { id: 'bt2', name: 'Ghế ngồi VIP',    code: 'VIP',      seats: 34 },
  { id: 'bt3', name: 'Giường nằm',       code: 'SLEEPER',  seats: 34 },
  { id: 'bt4', name: 'Limousine',        code: 'LIMOUSINE',seats: 22 },
];

export const buses = [
  { id: 'bus1', plateNumber: '51B-12345', typeId: 'bt1', status: 'active',      description: 'Xe Ghế Thường' },
  { id: 'bus2', plateNumber: '51B-67890', typeId: 'bt3', status: 'active',      description: 'Xe Giường Nằm' },
  { id: 'bus3', plateNumber: '51C-11111', typeId: 'bt4', status: 'active',      description: 'Xe Limousine' },
  { id: 'bus4', plateNumber: '51C-22222', typeId: 'bt2', status: 'active',      description: 'Xe VIP' },
  { id: 'bus5', plateNumber: '51D-33333', typeId: 'bt3', status: 'maintenance', description: 'Xe Giường Cabin' },
];

export const routes = [
  { id: 'r1', from: 'TP. Hồ Chí Minh', to: 'Đà Lạt',    distance: 290, duration: 360, basePrice: 180000, active: true },
  { id: 'r2', from: 'TP. Hồ Chí Minh', to: 'Nha Trang',  distance: 445, duration: 540, basePrice: 250000, active: true },
  { id: 'r3', from: 'TP. Hồ Chí Minh', to: 'Vũng Tàu',   distance: 100, duration: 150, basePrice: 120000, active: true },
  { id: 'r4', from: 'TP. Hồ Chí Minh', to: 'Đà Nẵng',   distance: 960, duration: 960, basePrice: 450000, active: true },
  { id: 'r5', from: 'TP. Hồ Chí Minh', to: 'Cần Thơ',    distance: 170, duration: 240, basePrice: 150000, active: true },
  { id: 'r6', from: 'TP. Hồ Chí Minh', to: 'Quy Nhơn',   distance: 690, duration: 780, basePrice: 350000, active: false },
  { id: 'r7', from: 'TP. Hồ Chí Minh', to: 'Huế',        distance: 1090, duration: 1020, basePrice: 520000, active: true },
  { id: 'r8', from: 'TP. Hồ Chí Minh', to: 'Phan Thiết', distance: 190, duration: 270, basePrice: 140000, active: true },
];

const today = new Date().toISOString().split('T')[0];
const addDays = (d, n) => { const r = new Date(d + 'T00:00:00'); r.setDate(r.getDate()+n); return r.toISOString().split('T')[0]; };

export const trips = [
  { id: 'trip1', routeId: 'r1', busId: 'bus1', date: today,           departureTime: '06:00', arrivalTime: '12:00', price: 180000, status: 'active', bookedSeats: 4 },
  { id: 'trip2', routeId: 'r1', busId: 'bus2', date: today,           departureTime: '08:30', arrivalTime: '14:30', price: 220000, status: 'active', bookedSeats: 10 },
  { id: 'trip3', routeId: 'r1', busId: 'bus4', date: today,           departureTime: '13:00', arrivalTime: '19:00', price: 260000, status: 'active', bookedSeats: 1 },
  { id: 'trip4', routeId: 'r1', busId: 'bus3', date: today,           departureTime: '21:00', arrivalTime: '05:00', price: 350000, status: 'active', bookedSeats: 7 },
  { id: 'trip5', routeId: 'r2', busId: 'bus2', date: today,           departureTime: '07:00', arrivalTime: '16:00', price: 250000, status: 'active', bookedSeats: 3 },
  { id: 'trip6', routeId: 'r3', busId: 'bus1', date: today,           departureTime: '06:00', arrivalTime: '08:30', price: 120000, status: 'active', bookedSeats: 2 },
  { id: 'trip7', routeId: 'r4', busId: 'bus2', date: today,           departureTime: '18:00', arrivalTime: '10:00', price: 450000, status: 'active', bookedSeats: 0 },
  { id: 'trip8', routeId: 'r1', busId: 'bus1', date: addDays(today,1),'departureTime': '07:00', arrivalTime: '13:00', price: 180000, status: 'active', bookedSeats: 0 },
];

export const customers = [
  { id: 'c1', name: 'Nguyễn Văn An',    phone: '0901234567', email: 'vanan@gmail.com',  totalTrips: 5,  joinedAt: '2024-01-15', status: 'active' },
  { id: 'c2', name: 'Trần Thị Bình',    phone: '0912345678', email: 'thibinh@gmail.com', totalTrips: 12, joinedAt: '2023-11-20', status: 'active' },
  { id: 'c3', name: 'Lê Hoàng Cường',   phone: '0923456789', email: 'hcuong@gmail.com',  totalTrips: 3,  joinedAt: '2024-03-05', status: 'active' },
  { id: 'c4', name: 'Phạm Thanh Dung',  phone: '0934567890', email: 'tdung@gmail.com',   totalTrips: 8,  joinedAt: '2023-09-10', status: 'inactive' },
  { id: 'c5', name: 'Hoàng Minh Đức',   phone: '0945678901', email: 'minhd@gmail.com',   totalTrips: 1,  joinedAt: '2024-06-01', status: 'active' },
];

export const tickets = [
  { id: 'VV2024001', tripId: 'trip1', routeId: 'r1', customerId: 'c1', customerName: 'Nguyễn Văn An',  phone: '0901234567', seats: ['A3','A4'], totalPrice: 360000, status: 'confirmed', bookedAt: new Date(Date.now()-86400000*1).toISOString(), paymentMethod: 'transfer' },
  { id: 'VV2024002', tripId: 'trip2', routeId: 'r1', customerId: 'c2', customerName: 'Trần Thị Bình',  phone: '0912345678', seats: ['B1'],       totalPrice: 220000, status: 'confirmed', bookedAt: new Date(Date.now()-86400000*2).toISOString(), paymentMethod: 'momo' },
  { id: 'VV2024003', tripId: 'trip5', routeId: 'r2', customerId: 'c3', customerName: 'Lê Hoàng Cường', phone: '0923456789', seats: ['C2','C3'],   totalPrice: 500000, status: 'cancelled', bookedAt: new Date(Date.now()-86400000*3).toISOString(), paymentMethod: 'vnpay' },
  { id: 'VV2024004', tripId: 'trip3', routeId: 'r1', customerId: 'c4', customerName: 'Phạm Thanh Dung',phone: '0934567890', seats: ['A1'],       totalPrice: 260000, status: 'confirmed', bookedAt: new Date(Date.now()-86400000*0.5).toISOString(), paymentMethod: 'zalopay' },
  { id: 'VV2024005', tripId: 'trip6', routeId: 'r3', customerId: 'c5', customerName: 'Hoàng Minh Đức', phone: '0945678901', seats: ['D1','D2'],   totalPrice: 240000, status: 'confirmed', bookedAt: new Date().toISOString(), paymentMethod: 'transfer' },
];

export const newsArticles = [
  { id: 'n1', title: 'Vé Vui khuyến mãi mùa hè 2024 — Giảm đến 30%', category: 'Khuyến mãi', author: 'Admin', publishedAt: '2024-06-01', status: 'published', views: 1520 },
  { id: 'n2', title: 'Khai trương tuyến mới TP.HCM - Phú Quốc',        category: 'Tin tức',    author: 'Admin', publishedAt: '2024-06-05', status: 'published', views: 892 },
  { id: 'n3', title: 'Hướng dẫn đặt vé trực tuyến chỉ 2 phút',         category: 'Hướng dẫn', author: 'Admin', publishedAt: '2024-06-10', status: 'published', views: 2341 },
  { id: 'n4', title: '10 kinh nghiệm du lịch Đà Lạt bằng xe khách',    category: 'Du lịch',   author: 'Admin', publishedAt: '2024-06-12', status: 'published', views: 3150 },
  { id: 'n5', title: 'Ra mắt đội xe Limousine cao cấp mới',             category: 'Tin tức',   author: 'Admin', publishedAt: '2024-06-17', status: 'draft',     views: 0 },
];

// Revenue chart data
export const revenueData = [
  { month: 'T1', revenue: 120000000, tickets: 480 },
  { month: 'T2', revenue: 98000000,  tickets: 392 },
  { month: 'T3', revenue: 145000000, tickets: 580 },
  { month: 'T4', revenue: 162000000, tickets: 648 },
  { month: 'T5', revenue: 178000000, tickets: 712 },
  { month: 'T6', revenue: 195000000, tickets: 780 },
  { month: 'T7', revenue: 210000000, tickets: 840 },
  { month: 'T8', revenue: 185000000, tickets: 740 },
  { month: 'T9', revenue: 168000000, tickets: 672 },
  { month: 'T10',revenue: 192000000, tickets: 768 },
  { month: 'T11',revenue: 215000000, tickets: 860 },
  { month: 'T12',revenue: 248000000, tickets: 992 },
];

export const routeRevenueData = [
  { name: 'HCM → Đà Lạt',   value: 35 },
  { name: 'HCM → Nha Trang', value: 25 },
  { name: 'HCM → Vũng Tàu', value: 20 },
  { name: 'HCM → Đà Nẵng',  value: 12 },
  { name: 'Khác',             value: 8 },
];

// ── Helpers ──
export const getRoute    = (id) => routes.find(r => r.id === id);
export const getBus      = (id) => buses.find(b => b.id === id);
export const getBusType  = (id) => busTypes.find(t => t.id === id);

export const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export const formatDuration = (m) => {
  const h = Math.floor(m / 60), min = m % 60;
  return min > 0 ? `${h}h${String(min).padStart(2,'0')}` : `${h}h`;
};

// Stats summary
export const getDashboardStats = () => {
  const todayTickets = tickets.filter(t => {
    const trip = trips.find(tr => tr.id === t.tripId);
    return trip?.date === today;
  });
  const todayRevenue = todayTickets.reduce((s, t) => s + (t.status === 'confirmed' ? t.totalPrice : 0), 0);
  const todayTrips   = trips.filter(t => t.date === today).length;
  const totalTickets = tickets.filter(t => t.status === 'confirmed').length;
  return { todayRevenue, todayTickets: todayTickets.length, todayTrips, totalCustomers: customers.length, totalTickets };
};
