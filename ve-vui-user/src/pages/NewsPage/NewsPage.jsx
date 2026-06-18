// pages/NewsPage/NewsPage.jsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiEye, FiArrowLeft } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { news } from '../../services/mockData';
import './NewsPage.css';

const CATEGORIES = ['Tất cả', 'Khuyến mãi', 'Tin tức', 'Hướng dẫn', 'Du lịch', 'Thông báo'];

export const NewsListPage = () => {
  const [cat, setCat] = useState('Tất cả');
  const filtered = cat === 'Tất cả' ? news : news.filter(n => n.category === cat);

  useEffect(() => { document.title = 'Tin tức | Vé Vui'; }, []);

  return (
    <div className="news-page">
      <Header />
      <main>
        <section className="news-hero">
          <div className="container">
            <h1>Tin tức & Khuyến mãi</h1>
            <p>Cập nhật thông tin mới nhất về tuyến đường, khuyến mãi và mẹo du lịch</p>
          </div>
        </section>

        <div className="container news-content">
          <div className="news-cats">
            {CATEGORIES.map(c => (
              <button key={c} className={`news-cat-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>

          {/* Featured */}
          {cat === 'Tất cả' && (
            <div className="news-featured">
              <Link to={`/tin-tuc/${news[0].slug}`} className="news-featured-card">
                <div className="nfc-img"><img src={news[0].image} alt={news[0].title} /></div>
                <div className="nfc-body">
                  <span className="nfc-cat">{news[0].category}</span>
                  <h2 className="nfc-title">{news[0].title}</h2>
                  <p className="nfc-excerpt">{news[0].excerpt}</p>
                  <div className="nfc-meta">
                    <span><FiCalendar size={13} /> {new Date(news[0].publishedAt).toLocaleDateString('vi-VN')}</span>
                    <span><FiEye size={13} /> {news[0].views.toLocaleString()}</span>
                  </div>
                  <span className="nfc-read">Đọc ngay <FiArrowRight size={14} /></span>
                </div>
              </Link>
            </div>
          )}

          <div className="news-grid-list">
            {filtered.map(item => (
              <Link key={item.id} to={`/tin-tuc/${item.slug}`} className="news-list-card">
                <div className="nlc-img"><img src={item.image} alt={item.title} /></div>
                <div className="nlc-body">
                  <span className="nlc-cat">{item.category}</span>
                  <h3 className="nlc-title">{item.title}</h3>
                  <p className="nlc-excerpt">{item.excerpt}</p>
                  <div className="nlc-meta">
                    <span><FiCalendar size={12} /> {new Date(item.publishedAt).toLocaleDateString('vi-VN')}</span>
                    <span><FiEye size={12} /> {item.views.toLocaleString()}</span>
                    <span className="nlc-read">Đọc thêm <FiArrowRight size={12} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export const NewsDetailPage = () => {
  const { slug } = useParams();
  const item = news.find(n => n.slug === slug);

  useEffect(() => { document.title = item ? `${item.title} | Vé Vui` : 'Vé Vui'; }, [item]);

  if (!item) return (
    <div className="news-page">
      <Header />
      <main style={{ paddingTop: 72, textAlign: 'center', padding: '5rem 1rem' }}>
        <h2>Bài viết không tồn tại</h2>
        <Link to="/tin-tuc" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>Về danh sách tin tức</Link>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="news-page">
      <Header />
      <main className="news-detail-main">
        <div className="container">
          <div className="news-detail-layout">
            <article className="news-detail-article">
              <Link to="/tin-tuc" className="news-back"><FiArrowLeft /> Tin tức</Link>
              <div className="nd-meta">
                <span className="nd-cat">{item.category}</span>
                <span><FiCalendar size={13} /> {new Date(item.publishedAt).toLocaleDateString('vi-VN')}</span>
                <span><FiEye size={13} /> {item.views.toLocaleString()} lượt xem</span>
              </div>
              <h1 className="nd-title">{item.title}</h1>
              <div className="nd-hero-img"><img src={item.image} alt={item.title} /></div>
              <div className="nd-content">
                <p className="nd-lead">{item.excerpt}</p>
                <p>Đây là nội dung chi tiết của bài viết. Trong phiên bản thực tế, nội dung sẽ được lấy từ hệ thống quản lý nội dung (CMS) của Admin.</p>
                <p>Vé Vui luôn cam kết mang đến những thông tin chính xác, kịp thời và hữu ích nhất cho hành khách.</p>
              </div>
            </article>

            <aside className="news-sidebar">
              <h3>Bài viết liên quan</h3>
              <div className="news-related">
                {news.filter(n => n.id !== item.id).slice(0, 4).map(n => (
                  <Link key={n.id} to={`/tin-tuc/${n.slug}`} className="nr-item">
                    <img src={n.image} alt={n.title} />
                    <div>
                      <p className="nr-title">{n.title}</p>
                      <span className="nr-date">{new Date(n.publishedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
