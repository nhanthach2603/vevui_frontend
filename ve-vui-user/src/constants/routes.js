// constants/routes.js — Danh sách tuyến đường

export const PROVINCES = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Cần Thơ',
  'Nha Trang',
  'Đà Lạt',
  'Huế',
  'Quy Nhơn',
  'Vũng Tàu',
  'Phan Thiết',
  'Mũi Né',
  'Long Xuyên',
  'Rạch Giá',
  'Cà Mau',
  'Buôn Ma Thuột',
  'Pleiku',
  'Quảng Ngãi',
  'Hội An',
  'Phú Quốc',
  'Cần Giờ',
];

export const NAV_LINKS = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Lịch trình', path: '/lich-trinh' },
  { label: 'Tra cứu vé', path: '/tra-cuu-ve' },
  { label: 'Tin tức', path: '/tin-tuc' },
  { label: 'Liên hệ', path: '/lien-he' },
  { label: 'Về chúng tôi', path: '/ve-chung-toi' },
];

export const APP_ROUTES = {
  HOME: '/',
  SEARCH: '/tim-chuyen',
  SEAT_SELECT: '/chon-ghe/:tripId',
  BOOKING: '/dat-ve/:tripId',
  PAYMENT: '/thanh-toan',
  PAYMENT_SUCCESS: '/dat-ve-thanh-cong',
  TICKET_LOOKUP: '/tra-cuu-ve',
  SCHEDULE: '/lich-trinh',
  NEWS: '/tin-tuc',
  NEWS_DETAIL: '/tin-tuc/:slug',
  CONTACT: '/lien-he',
  ABOUT: '/ve-chung-toi',
  LOGIN: '/dang-nhap',
  REGISTER: '/dang-ky',
  PROFILE: '/tai-khoan',
  MY_TICKETS: '/tai-khoan/ve-cua-toi',
};
