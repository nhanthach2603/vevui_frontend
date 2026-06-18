// services/mockData.js — Dữ liệu mẫu cho toàn bộ ứng dụng

// ── Bus Types ──
export const busTypes = [
  { id: 'bt1', name: 'Ghế ngồi thường', code: 'STANDARD', seats: 45, image: '🚌' },
  { id: 'bt2', name: 'Ghế ngồi VIP', code: 'VIP', seats: 34, image: '🚌' },
  { id: 'bt3', name: 'Giường nằm', code: 'SLEEPER', seats: 34, image: '🚌' },
  { id: 'bt4', name: 'Limousine', code: 'LIMOUSINE', seats: 22, image: '🚐' },
];

// ── Buses ──
export const buses = [
  { id: 'bus1', plateNumber: '51B-12345', typeId: 'bt1', name: 'Xe Ghế Thường 45 Chỗ', status: 'active' },
  { id: 'bus2', plateNumber: '51B-67890', typeId: 'bt3', name: 'Xe Giường Nằm 34 Chỗ', status: 'active' },
  { id: 'bus3', plateNumber: '51C-11111', typeId: 'bt4', name: 'Xe Limousine 22 Chỗ', status: 'active' },
  { id: 'bus4', plateNumber: '51C-22222', typeId: 'bt2', name: 'Xe VIP 34 Chỗ', status: 'active' },
  { id: 'bus5', plateNumber: '51D-33333', typeId: 'bt3', name: 'Xe Giường Nằm Cabin', status: 'maintenance' },
];

// ── Routes ──
export const routes = [
  {
    id: 'r1',
    from: 'TP. Hồ Chí Minh',
    to: 'Đà Lạt',
    distance: 290,
    duration: 360, // minutes
    basePrice: 180000,
    stops: ['Bình Chánh', 'Dầu Giây', 'Bảo Lộc'],
    popular: true,
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600',
  },
  {
    id: 'r2',
    from: 'TP. Hồ Chí Minh',
    to: 'Nha Trang',
    distance: 445,
    duration: 540,
    basePrice: 250000,
    stops: ['Phan Thiết', 'Cam Ranh'],
    popular: true,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
  },
  {
    id: 'r3',
    from: 'TP. Hồ Chí Minh',
    to: 'Vũng Tàu',
    distance: 100,
    duration: 150,
    basePrice: 120000,
    stops: ['Ngã ba Vũng Tàu'],
    popular: true,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  },
  {
    id: 'r4',
    from: 'TP. Hồ Chí Minh',
    to: 'Đà Nẵng',
    distance: 960,
    duration: 960,
    basePrice: 450000,
    stops: ['Nha Trang', 'Quảng Ngãi'],
    popular: true,
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600',
  },
  {
    id: 'r5',
    from: 'TP. Hồ Chí Minh',
    to: 'Cần Thơ',
    distance: 170,
    duration: 240,
    basePrice: 150000,
    stops: ['Bến xe Miền Tây', 'Vĩnh Long'],
    popular: false,
    image: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=600',
  },
  {
    id: 'r6',
    from: 'TP. Hồ Chí Minh',
    to: 'Quy Nhơn',
    distance: 690,
    duration: 780,
    basePrice: 350000,
    stops: ['Nha Trang', 'Tuy Hòa'],
    popular: false,
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600',
  },
  {
    id: 'r7',
    from: 'TP. Hồ Chí Minh',
    to: 'Huế',
    distance: 1090,
    duration: 1020,
    basePrice: 520000,
    stops: ['Đà Nẵng'],
    popular: false,
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600',
  },
  {
    id: 'r8',
    from: 'TP. Hồ Chí Minh',
    to: 'Phan Thiết',
    distance: 190,
    duration: 270,
    basePrice: 140000,
    stops: ['Bình Thuận'],
    popular: false,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  },
];

// ── Trips (Chuyến đi) ──
const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate()+n); return r; };

export const trips = [
  // HCM → Đà Lạt hôm nay
  { id: 'trip1', routeId: 'r1', busId: 'bus1', date: fmt(today), departureTime: '06:00', arrivalTime: '12:00', price: 180000, availableSeats: 20, bookedSeats: ['A1','A2','B3','C4'] },
  { id: 'trip2', routeId: 'r1', busId: 'bus2', date: fmt(today), departureTime: '08:30', arrivalTime: '14:30', price: 220000, availableSeats: 12, bookedSeats: ['A1','A2','A3','B1','B2','C3','D4','D5','E1','E2'] },
  { id: 'trip3', routeId: 'r1', busId: 'bus4', date: fmt(today), departureTime: '13:00', arrivalTime: '19:00', price: 260000, availableSeats: 30, bookedSeats: ['A1'] },
  { id: 'trip4', routeId: 'r1', busId: 'bus3', date: fmt(today), departureTime: '21:00', arrivalTime: '05:00', price: 350000, availableSeats: 8, bookedSeats: ['A1','A2','B1','B2','C1','C2','D1'] },
  // HCM → Đà Lạt ngày mai
  { id: 'trip5', routeId: 'r1', busId: 'bus1', date: fmt(addDays(today,1)), departureTime: '07:00', arrivalTime: '13:00', price: 180000, availableSeats: 40, bookedSeats: [] },
  { id: 'trip6', routeId: 'r1', busId: 'bus2', date: fmt(addDays(today,1)), departureTime: '19:30', arrivalTime: '01:30', price: 220000, availableSeats: 25, bookedSeats: ['A1','B2'] },
  // HCM → Nha Trang
  { id: 'trip7', routeId: 'r2', busId: 'bus2', date: fmt(today), departureTime: '07:00', arrivalTime: '16:00', price: 250000, availableSeats: 15, bookedSeats: ['A1','A2','B1'] },
  { id: 'trip8', routeId: 'r2', busId: 'bus3', date: fmt(today), departureTime: '20:00', arrivalTime: '05:00', price: 320000, availableSeats: 10, bookedSeats: ['A1','A2','B1','B2','C1','C2','D1','D2','E1','E2','F1'] },
  { id: 'trip9', routeId: 'r2', busId: 'bus1', date: fmt(addDays(today,1)), departureTime: '06:30', arrivalTime: '15:30', price: 250000, availableSeats: 38, bookedSeats: ['A1'] },
  // HCM → Vũng Tàu
  { id: 'trip10', routeId: 'r3', busId: 'bus1', date: fmt(today), departureTime: '06:00', arrivalTime: '08:30', price: 120000, availableSeats: 30, bookedSeats: ['A1','B2'] },
  { id: 'trip11', routeId: 'r3', busId: 'bus4', date: fmt(today), departureTime: '09:00', arrivalTime: '11:30', price: 180000, availableSeats: 18, bookedSeats: ['A1','A2','B1','B2'] },
  // HCM → Đà Nẵng
  { id: 'trip12', routeId: 'r4', busId: 'bus2', date: fmt(today), departureTime: '18:00', arrivalTime: '10:00', price: 450000, availableSeats: 20, bookedSeats: [] },
  { id: 'trip13', routeId: 'r4', busId: 'bus3', date: fmt(today), departureTime: '19:30', arrivalTime: '11:30', price: 550000, availableSeats: 6, bookedSeats: ['A1','A2','B1','B2','C1','C2','D1','D2','E1','E2','F1','F2','G1','G2','H1','H2'] },
];

// ── Pickup / Dropoff Points ──
export const pickupPoints = {
  'TP. Hồ Chí Minh': [
    { id: 'pp1', name: 'Văn phòng 292 Đinh Bộ Lĩnh, Q. Bình Thạnh', time: '-30 phút' },
    { id: 'pp2', name: 'Văn phòng 468 Điện Biên Phủ, Q.3', time: '-20 phút' },
    { id: 'pp3', name: 'Bến xe Miền Đông', time: '0 phút' },
    { id: 'pp4', name: 'Bến xe An Sương, Q.12', time: '+10 phút' },
  ],
  'Đà Lạt': [
    { id: 'dp1', name: 'Bến xe Liên tỉnh Đà Lạt', time: '0 phút' },
    { id: 'dp2', name: 'Văn phòng 9 Nguyễn Chí Thanh', time: '+10 phút' },
  ],
  'Nha Trang': [
    { id: 'dp3', name: 'Bến xe Phía Nam Nha Trang', time: '0 phút' },
    { id: 'dp4', name: 'Văn phòng 58/8 Trần Phú, Nha Trang', time: '+15 phút' },
  ],
  'Vũng Tàu': [
    { id: 'dp5', name: 'Bến xe Vũng Tàu', time: '0 phút' },
  ],
  'Đà Nẵng': [
    { id: 'dp6', name: 'Bến xe Đà Nẵng', time: '0 phút' },
    { id: 'dp7', name: 'Văn phòng 76 Hùng Vương, Đà Nẵng', time: '+10 phút' },
  ],
};

// ── News ──
export const news = [
  {
    id: 'n1',
    slug: 've-vui-khuyen-mai-mua-he-2024',
    title: 'Vé Vui khuyến mãi mùa hè - Giảm đến 30% toàn bộ tuyến!',
    excerpt: 'Nhân dịp mùa hè rực rỡ, Vé Vui tung chương trình khuyến mãi đặc biệt với mức giảm lên đến 30% cho tất cả các tuyến trong tháng 6, 7, 8.',
    content: `<p>Mùa hè 2024 đã đến! Vé Vui trân trọng thông báo chương trình khuyến mãi đặc biệt...</p>`,
    category: 'Khuyến mãi',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    author: 'Vé Vui Team',
    publishedAt: '2024-06-01',
    views: 1520,
    featured: true,
  },
  {
    id: 'n2',
    slug: 'tuyen-moi-hcm-phu-quoc',
    title: 'Khai trương tuyến mới TP.HCM - Phú Quốc, xuất phát từ tháng 7',
    excerpt: 'Vé Vui chính thức mở tuyến xe khách đến thiên đường biển đảo Phú Quốc, với xe Limousine cao cấp.',
    content: `<p>Đáp ứng nhu cầu du lịch ngày càng cao...</p>`,
    category: 'Tin tức',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    author: 'Vé Vui Team',
    publishedAt: '2024-06-05',
    views: 892,
    featured: true,
  },
  {
    id: 'n3',
    slug: 'huong-dan-dat-ve-tren-dien-thoai',
    title: 'Hướng dẫn đặt vé trực tuyến trên điện thoại chỉ 2 phút',
    excerpt: 'Đặt vé nhanh chóng, tiện lợi ngay trên website Vé Vui mà không cần ra bến xe. Hướng dẫn chi tiết từng bước.',
    content: `<p>Bước 1: Truy cập website vevui.vn...</p>`,
    category: 'Hướng dẫn',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    author: 'Vé Vui Team',
    publishedAt: '2024-06-10',
    views: 2341,
    featured: false,
  },
  {
    id: 'n4',
    slug: 'kinh-nghiem-di-da-lat-tu-hcm',
    title: '10 kinh nghiệm du lịch Đà Lạt từ TP.HCM bằng xe khách',
    excerpt: 'Những mẹo hay giúp chuyến đi Đà Lạt của bạn trở nên dễ dàng và thú vị hơn khi di chuyển bằng xe khách.',
    content: `<p>Đà Lạt - thành phố ngàn hoa...</p>`,
    category: 'Du lịch',
    image: 'https://images.unsplash.com/photo-1563492065-6135a42ab0a9?w=800',
    author: 'Vé Vui Team',
    publishedAt: '2024-06-12',
    views: 3150,
    featured: false,
  },
  {
    id: 'n5',
    slug: 'chinh-sach-hoan-doi-ve-moi',
    title: 'Chính sách hoàn - đổi vé mới nhất tại Vé Vui',
    excerpt: 'Cập nhật chính sách hoàn vé và đổi vé linh hoạt nhất, đảm bảo quyền lợi tối đa cho hành khách.',
    content: `<p>Vé Vui luôn đặt sự hài lòng của khách hàng lên hàng đầu...</p>`,
    category: 'Thông báo',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
    author: 'Vé Vui Team',
    publishedAt: '2024-06-15',
    views: 780,
    featured: false,
  },
  {
    id: 'n6',
    slug: 'xe-limousine-cao-cap-moi',
    title: 'Ra mắt đội xe Limousine cao cấp: Sang trọng - Tiện nghi - Đúng giờ',
    excerpt: 'Vé Vui đầu tư thêm 10 xe Limousine 22 chỗ cao cấp, nâng cao trải nghiệm hành khách trên các tuyến dài.',
    content: `<p>Với mong muốn mang lại trải nghiệm tốt nhất...</p>`,
    category: 'Tin tức',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    author: 'Vé Vui Team',
    publishedAt: '2024-06-17',
    views: 1100,
    featured: false,
  },
];

// ── Customers (Mock) ──
export const customers = [
  { id: 'c1', name: 'Nguyễn Văn An', phone: '0901234567', email: 'vanan@gmail.com', totalTrips: 5, joinedAt: '2024-01-15' },
  { id: 'c2', name: 'Trần Thị Bình', phone: '0912345678', email: 'thibinh@gmail.com', totalTrips: 12, joinedAt: '2023-11-20' },
  { id: 'c3', name: 'Lê Hoàng Cường', phone: '0923456789', email: 'hcuong@gmail.com', totalTrips: 3, joinedAt: '2024-03-05' },
];

// ── Tickets (Booked) ──
export const tickets = [
  {
    id: 'VV2024001',
    tripId: 'trip1',
    customerId: 'c1',
    customerName: 'Nguyễn Văn An',
    phone: '0901234567',
    email: 'vanan@gmail.com',
    seats: ['A3', 'A4'],
    pickupPoint: 'pp1',
    dropoffPoint: 'dp1',
    totalPrice: 360000,
    status: 'confirmed',
    bookedAt: new Date().toISOString(),
    paymentMethod: 'transfer',
  },
];

// ── Helper Functions ──
export const getRoute = (id) => routes.find(r => r.id === id);
export const getBus = (id) => buses.find(b => b.id === id);
export const getBusType = (id) => busTypes.find(bt => bt.id === id);

export const searchTrips = (from, to, date) => {
  return trips.filter(t => {
    const route = getRoute(t.routeId);
    return route?.from === from && route?.to === to && t.date === date;
  }).map(t => ({
    ...t,
    route: getRoute(t.routeId),
    bus: getBus(t.busId),
    busType: getBusType(getBus(t.busId)?.typeId),
  }));
};

export const generateSeatMap = (busType, bookedSeats = []) => {
  const totalSeats = busType?.seats || 34;
  const seatsPerRow = busType?.code === 'LIMOUSINE' ? 2 : busType?.code === 'SLEEPER' ? 2 : 4;
  const rows = [];

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let seatCount = 0;

  for (let r = 0; r < letters.length && seatCount < totalSeats; r++) {
    const row = [];
    for (let s = 1; s <= seatsPerRow && seatCount < totalSeats; s++) {
      const seatId = `${letters[r]}${s}`;
      row.push({
        id: seatId,
        label: seatId,
        status: bookedSeats.includes(seatId) ? 'booked' : 'available',
        floor: busType?.code === 'SLEEPER' && r >= Math.floor(totalSeats / seatsPerRow / 2) ? 2 : 1,
      });
      seatCount++;
    }
    rows.push(row);
  }
  return rows;
};

export const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h} giờ`;
};
