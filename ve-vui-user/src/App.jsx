// App.jsx — Main router configuration
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';

import HomePage from './pages/HomePage/HomePage';
import SearchResultPage from './pages/SearchResultPage/SearchResultPage';
import SeatSelectPage from './pages/SeatSelectPage/SeatSelectPage';
import BookingPage from './pages/BookingPage/BookingPage';
import PaymentPage from './pages/PaymentPage/PaymentPage';
import TicketLookupPage from './pages/TicketLookupPage/TicketLookupPage';
import { NewsListPage, NewsDetailPage } from './pages/NewsPage/NewsPage';
import AuthPage from './pages/AuthPage/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import AccountPage from './pages/AccountPage/AccountPage';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { routeApi, formatPrice, formatDuration } from './services/api';

// ── Schedule Page ──
const SchedulePage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Lịch trình | Vé Vui';
    routeApi.getAll()
      .then(data => setRoutes(data || []))
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const handleSelectRoute = (route) => {
    navigate(`/tim-chuyen?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&date=${today}&passengers=1`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, paddingTop: 72, background: 'var(--gray-50)' }}>
        <section style={{ background: 'var(--gradient-primary)', padding: '5rem 0 3rem', textAlign: 'center', color: 'white' }}>
          <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '0.75rem' }}>Lịch trình xe</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem' }}>Chọn tuyến đường để xem chuyến xe và đặt vé</p>
        </section>
        <div className="container" style={{ padding: '3rem 1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>Đang tải tuyến đường...</div>
          ) : routes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>Chưa có tuyến đường nào.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {routes.map(r => (
                <div key={r.id}
                  className="card"
                  onClick={() => handleSelectRoute(r)}
                  style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>{r.from}</span>
                    <span style={{ color: 'var(--gray-300)', fontSize: '1.2rem' }}>→</span>
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>{r.to}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    <span>⏱ {formatDuration(r.duration)}</span>
                    <span>📍 {r.distance}km</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Từ {formatPrice(r.basePrice)}</span>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Xem chuyến xe →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ── Contact Page ──
const ContactPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Header />
    <main style={{ flex: 1, paddingTop: 72, background: 'var(--gray-50)' }}>
      <section style={{ background: 'var(--gradient-primary)', padding: '5rem 0 3rem', textAlign: 'center', color: 'white' }}>
        <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '0.75rem' }}>Liên hệ</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)' }}>Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
      </section>
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: 700, textAlign: 'center' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📞</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Hotline: 1900 6067</h2>
          <p>Email: support@vevui.vn</p>
          <p style={{ marginTop: '0.5rem' }}>Địa chỉ: Số 1, Đường Vui Vẻ, Quận 1, TP.HCM</p>
          <p style={{ marginTop: '0.5rem', color: 'var(--gray-400)' }}>Giờ làm việc: 6:00 — 22:00 mỗi ngày</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

// ── About Page ──
const AboutPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Header />
    <main style={{ flex: 1, paddingTop: 72, background: 'var(--gray-50)' }}>
      <section style={{ background: 'var(--gradient-primary)', padding: '5rem 0 3rem', textAlign: 'center', color: 'white' }}>
        <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '0.75rem' }}>Về chúng tôi</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)' }}>Sứ mệnh — Tầm nhìn — Giá trị cốt lõi</p>
      </section>
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: 800 }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>🎫 Câu chuyện Vé Vui</h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>Vé Vui được thành lập năm 2020 với sứ mệnh giúp mọi người di chuyển dễ dàng và tiết kiệm hơn. Chúng tôi tin rằng mỗi hành trình đều xứng đáng được trải nghiệm thoải mái và đáng nhớ.</p>
          <p style={{ lineHeight: 1.8 }}>Với hơn 200 tuyến đường và 2 triệu khách hàng tin dùng, Vé Vui tự hào là nền tảng đặt vé xe khách trực tuyến hàng đầu Việt Nam.</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

// ── 404 ──
const NotFoundPage = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', textAlign:'center', padding:'2rem', background:'var(--gray-50)' }}>
    <div style={{ fontSize:'6rem', marginBottom:'1.5rem' }}>😢</div>
    <h1 style={{ fontSize:'2rem', marginBottom:'0.75rem', color:'var(--gray-900)' }}>404 — Trang không tồn tại</h1>
    <p style={{ color:'var(--gray-500)', marginBottom:'2rem' }}>Xin lỗi, trang bạn tìm không tồn tại hoặc đã bị di chuyển.</p>
    <a href="/" className="btn btn-primary">Về trang chủ</a>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <Routes>
            <Route path="/"                 element={<HomePage />} />
            <Route path="/tim-chuyen"       element={<SearchResultPage />} />
            <Route path="/chon-ghe/:tripId" element={<SeatSelectPage />} />
            <Route path="/dat-ve/:tripId"   element={<BookingPage />} />
            <Route path="/thanh-toan"       element={<PaymentPage />} />
            <Route path="/tra-cuu-ve"       element={<TicketLookupPage />} />
            <Route path="/lich-trinh"       element={<SchedulePage />} />
            <Route path="/tin-tuc"          element={<NewsListPage />} />
            <Route path="/tin-tuc/:slug"    element={<NewsDetailPage />} />
            <Route path="/lien-he"          element={<ContactPage />} />
            <Route path="/ve-chung-toi"     element={<AboutPage />} />
            <Route path="/dang-nhap"        element={<AuthPage />} />
            <Route path="/dang-ky"          element={<AuthPage />} />
            <Route path="/quen-mat-khau"    element={<ForgotPasswordPage />} />
            <Route path="/tai-khoan"               element={<AccountPage />} />
            <Route path="/tai-khoan/ve-cua-toi"    element={<AccountPage />} />
            <Route path="/tai-khoan/thong-tin"     element={<AccountPage />} />
            <Route path="/tai-khoan/doi-mat-khau"  element={<AccountPage />} />
            <Route path="*"                 element={<NotFoundPage />} />
          </Routes>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
