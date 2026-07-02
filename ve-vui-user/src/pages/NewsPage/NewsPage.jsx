// pages/NewsPage/NewsPage.jsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiEye, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { newsApi } from '../../services/api';
import './NewsPage.css';

const CATEGORIES = ['Tất cả', 'Khuyến mãi', 'Tin tức', 'Hướng dẫn', 'Du lịch', 'Thông báo'];

// ── Skeleton card ──
const NewsSkeleton = () => (
  <div className="news-list-card" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
    <div className="nlc-img" style={{ background: 'var(--gray-100)' }} />
    <div className="nlc-body" style={{ gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '30%', height: 16, background: 'var(--gray-100)', borderRadius: 4 }} />
      <div style={{ width: '100%', height: 20, background: 'var(--gray-100)', borderRadius: 4 }} />
      <div style={{ width: '80%', height: 14, background: 'var(--gray-100)', borderRadius: 4 }} />
    </div>
  </div>
);

export const NewsListPage = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cat, setCat] = useState('Tất cả');

  useEffect(() => {
    document.title = 'Tin tức | Vé Vui';
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await newsApi.getAll();
      setNewsList(data || []);
    } catch (err) {
      console.error('News fetch error:', err);
      setError('Không thể tải tin tức. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = cat === 'Tất cả'
    ? newsList
    : newsList.filter(n => n.category === cat);

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

          {/* Error state */}
          {error && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <p style={{ color: 'var(--gray-400)', marginBottom: '1rem' }}>{error}</p>
              <button className="btn btn-primary" onClick={loadNews}>
                <FiRefreshCw size={14} /> Thử lại
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="news-grid-list">
              {[1, 2, 3, 4, 5, 6].map(i => <NewsSkeleton key={i} />)}
            </div>
          )}

          {/* Featured article */}
          {!loading && !error && cat === 'Tất cả' && filtered.length > 0 && (
            <div className="news-featured">
              <Link to={`/tin-tuc/${filtered[0].slug || filtered[0].id}`} className="news-featured-card">
                <div className="nfc-img">
                  {filtered[0].imageUrl || filtered[0].image
                    ? <img src={filtered[0].imageUrl || filtered[0].image} alt={filtered[0].title} />
                    : <div style={{ background: 'var(--gradient-primary)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>📰</div>
                  }
                </div>
                <div className="nfc-body">
                  <span className="nfc-cat">{filtered[0].category}</span>
                  <h2 className="nfc-title">{filtered[0].title}</h2>
                  <p className="nfc-excerpt">{filtered[0].excerpt || filtered[0].summary}</p>
                  <div className="nfc-meta">
                    <span><FiCalendar size={13} /> {new Date(filtered[0].publishedAt || filtered[0].createdAt).toLocaleDateString('vi-VN')}</span>
                    {filtered[0].views != null && <span><FiEye size={13} /> {Number(filtered[0].views).toLocaleString()}</span>}
                  </div>
                  <span className="nfc-read">Đọc ngay <FiArrowRight size={14} /></span>
                </div>
              </Link>
            </div>
          )}

          {/* News grid */}
          {!loading && !error && (
            <div className="news-grid-list">
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <p>Chưa có tin tức nào trong danh mục này.</p>
                </div>
              ) : (
                filtered.map(item => (
                  <Link key={item.id} to={`/tin-tuc/${item.slug || item.id}`} className="news-list-card">
                    <div className="nlc-img">
                      {item.imageUrl || item.image
                        ? <img src={item.imageUrl || item.image} alt={item.title} />
                        : <div style={{ background: 'var(--gradient-primary)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📰</div>
                      }
                    </div>
                    <div className="nlc-body">
                      <span className="nlc-cat">{item.category}</span>
                      <h3 className="nlc-title">{item.title}</h3>
                      <p className="nlc-excerpt">{item.excerpt || item.summary}</p>
                      <div className="nlc-meta">
                        <span><FiCalendar size={12} /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString('vi-VN')}</span>
                        {item.views != null && <span><FiEye size={12} /> {Number(item.views).toLocaleString()}</span>}
                        <span className="nlc-read">Đọc thêm <FiArrowRight size={12} /></span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export const NewsDetailPage = () => {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // Thử tìm theo slug (nếu là số thì tìm theo ID)
        let data;
        if (/^\d+$/.test(slug)) {
          data = await newsApi.getById(slug);
        } else {
          // Lấy tất cả rồi tìm theo slug
          const all = await newsApi.getAll();
          data = all.find(n => n.slug === slug);
          // Lưu related
          setRelated((all || []).filter(n => n.id !== data?.id).slice(0, 4));
        }
        setItem(data || null);
        if (data) document.title = `${data.title} | Vé Vui`;
      } catch (err) {
        setError('Không thể tải bài viết. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) return (
    <div className="news-page">
      <Header />
      <main style={{ paddingTop: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <FiRefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      </main>
      <Footer />
    </div>
  );

  if (error || !item) return (
    <div className="news-page">
      <Header />
      <main style={{ paddingTop: 72, textAlign: 'center', padding: '5rem 1rem' }}>
        <h2>{error || 'Bài viết không tồn tại'}</h2>
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
                <span><FiCalendar size={13} /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString('vi-VN')}</span>
                {item.views != null && <span><FiEye size={13} /> {Number(item.views).toLocaleString()} lượt xem</span>}
              </div>
              <h1 className="nd-title">{item.title}</h1>
              {(item.imageUrl || item.image) && (
                <div className="nd-hero-img">
                  <img src={item.imageUrl || item.image} alt={item.title} />
                </div>
              )}
              <div className="nd-content">
                {item.content ? (
                  <div dangerouslySetInnerHTML={{ __html: item.content }} />
                ) : (
                  <>
                    <p className="nd-lead">{item.excerpt || item.summary}</p>
                    <p>Vé Vui luôn cam kết mang đến những thông tin chính xác, kịp thời và hữu ích nhất cho hành khách.</p>
                  </>
                )}
              </div>
            </article>

            {related.length > 0 && (
              <aside className="news-sidebar">
                <h3>Bài viết liên quan</h3>
                <div className="news-related">
                  {related.map(n => (
                    <Link key={n.id} to={`/tin-tuc/${n.slug || n.id}`} className="nr-item">
                      {(n.imageUrl || n.image) && <img src={n.imageUrl || n.image} alt={n.title} />}
                      <div>
                        <p className="nr-title">{n.title}</p>
                        <span className="nr-date">{new Date(n.publishedAt || n.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
