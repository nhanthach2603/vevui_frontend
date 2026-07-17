// pages/HomePage/HomePage.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield, FiStar, FiClock, FiAward, FiArrowRight,
  FiUsers, FiMapPin, FiTruck, FiCheckCircle
} from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import SearchBox from '../../components/ui/SearchBox';
import { routeApi, newsApi, formatPrice } from '../../services/api';
import './HomePage.css';

// ── Hero Section ──
const HeroSection = () => (
  <section className="hero" id="hero">
    <div className="hero-bg">
      <div className="hero-wave hero-wave-1" />
      <div className="hero-wave hero-wave-2" />
      <div className="hero-bubble b1" />
      <div className="hero-bubble b2" />
      <div className="hero-bubble b3" />
      <div className="hero-bubble b4" />
    </div>

    <div className="container hero-container">
      <div className="hero-content animate-fadeIn">
        <div className="hero-badge">🌊 Mùa hè rực rỡ — Đặt vé ngay hôm nay!</div>
        <h1 className="hero-title">
          Đặt vé xe <span className="hero-title-accent">dễ như thở</span>
          <br />với <span className="hero-brand">Vé Vui</span>
        </h1>
        <p className="hero-desc">
          Hơn <strong>200 tuyến</strong> trên toàn quốc · Đặt vé chỉ <strong>2 phút</strong>
          · Giá tốt nhất <strong>đảm bảo</strong>
        </p>
        <div className="hero-stats">
          <div className="hero-stat"><span>500K+</span><p>Vé đã bán</p></div>
          <div className="hero-stat-divider" />
          <div className="hero-stat"><span>200+</span><p>Tuyến đường</p></div>
          <div className="hero-stat-divider" />
          <div className="hero-stat"><span>98%</span><p>Hài lòng</p></div>
        </div>
      </div>

      <div className="hero-search-wrapper animate-fadeIn" style={{ animationDelay: '0.2s' }}>
        <SearchBox />
      </div>
    </div>

    <div className="hero-scroll-hint">
      <div className="scroll-indicator" />
    </div>
  </section>
);

// ── Popular Routes ──
const PopularRoutes = ({ routes }) => {
  const popular = routes.filter(r => r.popular).slice(0, 4);
  return (
    <section className="section popular-routes" id="popular-routes">
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">🔥 Hot</span>
          <h2>Tuyến đường phổ biến</h2>
          <p>Khám phá những hành trình được yêu thích nhất</p>
        </div>
        <div className="routes-grid">
          {popular.map((route, i) => (
            <Link
              key={route.id}
              to={`/tim-chuyen?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&date=${new Date().toISOString().split('T')[0]}&passengers=1`}
              className="route-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="route-card-img">
                <img src={route.imageUrl || route.image || 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600'} alt={`${route.from} - ${route.to}`} loading="lazy" />
                <div className="route-card-overlay" />
                <div className="route-card-badge">Từ {formatPrice(route.basePrice)}</div>
              </div>
              <div className="route-card-body">
                <div className="route-card-path">
                  <div className="route-card-city">
                    <FiMapPin className="city-dot from-dot" />
                    <span>{route.from}</span>
                  </div>
                  <div className="route-card-arrow"><FiArrowRight /></div>
                  <div className="route-card-city">
                    <FiMapPin className="city-dot to-dot" />
                    <span>{route.to}</span>
                  </div>
                </div>
                <div className="route-card-info">
                  <span><FiClock size={13} /> ~{Math.floor(route.duration / 60)}h{route.duration % 60 > 0 ? String(route.duration % 60).padStart(2,'0') : ''}</span>
                  <span><FiMapPin size={13} /> {route.distance} km</span>
                </div>
                <div className="route-card-cta">
                  Đặt vé ngay <FiArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/lich-trinh" className="btn btn-outline btn-lg">
            Xem tất cả tuyến <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ── Why Choose Us ──
const WhyUs = () => {
  const features = [
    { icon: <FiShield size={28} />, color: '#0EA5E9', title: 'An toàn tuyệt đối', desc: 'Đội ngũ lái xe được đào tạo chuyên nghiệp, xe được kiểm định định kỳ.' },
    { icon: <FiStar size={28} />,   color: '#F59E0B', title: 'Tiện nghi cao cấp',  desc: 'Xe điều hòa, wifi, ghế ngả, giường nằm — mọi tiện ích đều có.' },
    { icon: <FiClock size={28} />,  color: '#22C55E', title: 'Đúng giờ cam kết',   desc: 'Chúng tôi cam kết xuất phát và đến đúng giờ, hoàn tiền nếu trễ quá 30 phút.' },
    { icon: <FiAward size={28} />,  color: '#8B5CF6', title: 'Giá tốt nhất',        desc: 'Tìm thấy giá rẻ hơn? Chúng tôi sẽ hoàn tiền chênh lệch.' },
  ];
  return (
    <section className="section why-us" id="why-us">
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">✨ Vì sao chọn chúng tôi</span>
          <h2>Trải nghiệm khác biệt</h2>
          <p>Hàng trăm ngàn hành khách tin tưởng Vé Vui mỗi tháng</p>
        </div>
        <div className="why-grid">
          {features.map((f, i) => (
            <div className="why-card" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="why-icon" style={{ background: `${f.color}18`, color: f.color }}>{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Stats Banner ──
const StatsBanner = () => (
  <section className="stats-banner">
    <div className="container">
      <div className="stats-grid">
        {[
          { icon: <FiUsers />, val: '2 triệu+', label: 'Khách hàng tin dùng' },
          { icon: <FiMapPin />, val: '63',       label: 'Tỉnh thành phủ sóng' },
          { icon: <FiTruck />, val: '500+',      label: 'Đầu xe hiện đại' },
          { icon: <FiCheckCircle />, val: '99%', label: 'Đặt vé thành công' },
        ].map((s, i) => (
          <div key={i} className="stat-item">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── News Section ──
const NewsSection = ({ news }) => {
  const featured = news.slice(0, 3);
  return (
    <section className="section news-section" id="news">
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">📰 Tin tức</span>
          <h2>Cập nhật mới nhất</h2>
          <p>Khuyến mãi, tuyến mới và những thông tin hữu ích dành cho bạn</p>
        </div>
        <div className="news-grid">
          {featured.map((item, i) => (
            <Link key={item.id} to={`/tin-tuc/${item.slug}`} className="news-card">
              <div className="news-card-img">
                <img src={item.imageUrl || item.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'} alt={item.title} loading="lazy" />
                <span className="news-card-cat">{item.category}</span>
              </div>
              <div className="news-card-body">
                <p className="news-card-date">
                  {new Date(item.publishedAt).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })}
                </p>
                <h4 className="news-card-title">{item.title}</h4>
                <p className="news-card-excerpt">{item.excerpt}</p>
                <span className="news-card-read">Đọc thêm <FiArrowRight size={13} /></span>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/tin-tuc" className="btn btn-outline btn-lg">
            Xem tất cả tin tức <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ── App Download Banner ──
const AppBanner = () => (
  <section className="app-banner">
    <div className="container">
      <div className="app-banner-inner">
        <div className="app-banner-content">
          <div className="app-banner-badge">📱 Ứng dụng di động</div>
          <h2>Đặt vé mọi lúc mọi nơi<br />với App Vé Vui</h2>
          <p>Tải app ngay để nhận <strong>giảm 15%</strong> cho lần đặt vé đầu tiên qua ứng dụng!</p>
          <div className="app-btns">
            <button className="app-btn">
              <span className="app-btn-icon">🍎</span>
              <div><small>Tải trên</small><strong>App Store</strong></div>
            </button>
            <button className="app-btn">
              <span className="app-btn-icon">🤖</span>
              <div><small>Tải trên</small><strong>Google Play</strong></div>
            </button>
          </div>
        </div>
        <div className="app-banner-visual">
          <div className="app-phone-mockup">
            <div className="phone-screen">
              <div className="phone-header">🎫 Vé Vui</div>
              <div className="phone-search">Tìm chuyến xe...</div>
              <div className="phone-route">HCM → Đà Lạt</div>
              <div className="phone-price">Từ 180.000₫</div>
              <div className="phone-btn">Đặt ngay</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── Main HomePage ──
const HomePage = () => {
  const [routes, setRoutes] = useState([]);
  const [news, setNews] = useState([]);

  useEffect(() => {
    document.title = 'Vé Vui — Đặt vé xe dễ dàng, nhanh chóng';
    routeApi.getAll(true).then(setRoutes).catch(() => {});
    newsApi.getAll(0, 6).then(({ items }) => setNews(items)).catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <Header transparent={true} />
      <main>
        <HeroSection />
        <PopularRoutes routes={routes} />
        <WhyUs />
        <StatsBanner />
        <NewsSection news={news} />
        <AppBanner />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
