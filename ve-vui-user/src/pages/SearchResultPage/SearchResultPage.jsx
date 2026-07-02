// pages/SearchResultPage/SearchResultPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiClock, FiMapPin, FiUsers, FiFilter, FiArrowRight, FiChevronDown, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import SearchBox from '../../components/ui/SearchBox';
import { tripApi, formatPrice, formatDuration } from '../../services/api';
import { useBooking } from '../../context/BookingContext';
import './SearchResultPage.css';

const BUS_TYPE_LABEL = {
  STANDARD:  { label: 'Ghế ngồi',  icon: '🚌', color: '#0EA5E9' },
  VIP:       { label: 'VIP',        icon: '⭐', color: '#8B5CF6' },
  SLEEPER:   { label: 'Giường nằm', icon: '🛏️', color: '#0369A1' },
  LIMOUSINE: { label: 'Limousine',  icon: '🚐', color: '#F59E0B' },
};

const TripCard = ({ trip, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const busTypeInfo = BUS_TYPE_LABEL[trip.busType?.code] || BUS_TYPE_LABEL.STANDARD;
  const availability = trip.availableSeats;
  const isLow = availability > 0 && availability <= 8;
  const isFull = availability === 0;

  return (
    <div className={`trip-card ${isFull ? 'trip-card-full' : ''}`}>
      <div className="trip-card-main">
        {/* Time & Route */}
        <div className="trip-time-block">
          <div className="trip-depart">
            <span className="trip-time">{trip.departureTime}</span>
            <span className="trip-city">{trip.route?.from}</span>
          </div>
          <div className="trip-duration-line">
            <div className="trip-duration-label">
              <FiClock size={12} /> {formatDuration(trip.route?.duration || 0)}
            </div>
            <div className="trip-line">
              <div className="trip-dot" />
              <div className="trip-line-track" />
              <div className="trip-dot trip-dot-end" />
            </div>
          </div>
          <div className="trip-arrive">
            <span className="trip-time">{trip.arrivalTime}</span>
            <span className="trip-city">{trip.route?.to}</span>
          </div>
        </div>

        {/* Bus info */}
        <div className="trip-bus-info">
          <div className="trip-bus-type" style={{ color: busTypeInfo.color, background: `${busTypeInfo.color}18` }}>
            {busTypeInfo.icon} {busTypeInfo.label}
          </div>
          <div className="trip-bus-seats">
            <FiUsers size={13} />
            {isFull ? (
              <span className="seats-full">Hết chỗ</span>
            ) : isLow ? (
              <span className="seats-low">Còn {availability} chỗ</span>
            ) : (
              <span className="seats-ok">Còn {availability} chỗ</span>
            )}
          </div>
          <button
            className="trip-expand-btn"
            onClick={() => setExpanded(e => !e)}
            aria-label="Xem chi tiết"
          >
            Chi tiết <FiChevronDown style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
        </div>

        {/* Price & Select */}
        <div className="trip-price-block">
          <div className="trip-price">{formatPrice(trip.price)}</div>
          <div className="trip-price-label">/ vé</div>
          <button
            className={`btn ${isFull ? 'btn-ghost' : 'btn-primary'} trip-select-btn`}
            onClick={() => !isFull && onSelect(trip)}
            disabled={isFull}
            id={`select-trip-${trip.id}`}
          >
            {isFull ? 'Hết chỗ' : 'Chọn chuyến'} {!isFull && <FiArrowRight size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="trip-details">
          <div className="trip-detail-row">
            <div className="trip-detail-item">
              <span className="detail-label">Xe</span>
              <span className="detail-val">{trip.bus?.plateNumber} — {trip.busType?.name}</span>
            </div>
            <div className="trip-detail-item">
              <span className="detail-label">Số chỗ ngồi</span>
              <span className="detail-val">{trip.busType?.seats} chỗ</span>
            </div>
            <div className="trip-detail-item">
              <span className="detail-label">Khoảng cách</span>
              <span className="detail-val">{trip.route?.distance} km</span>
            </div>
          </div>
          {trip.route?.stops?.length > 0 && (
            <div className="trip-stops">
              <span className="detail-label"><FiMapPin size={12}/> Điểm dừng:</span>
              <div className="trip-stops-list">
                {trip.route.stops.map((s, i) => <span key={i} className="trip-stop">{s}</span>)}
              </div>
            </div>
          )}
          <div className="trip-amenities">
            {['💨 Điều hòa', '🔌 Sạc điện', '💧 Nước uống', '🧻 Khăn lạnh'].map(a => (
              <span key={a} className="amenity-tag">{a}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Loading skeleton ──
const TripSkeleton = () => (
  <div className="trip-card" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
    <div className="trip-card-main">
      <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: 60, height: 40, background: 'var(--gray-100)', borderRadius: 8 }} />
        <div style={{ flex: 1, height: 2, background: 'var(--gray-100)' }} />
        <div style={{ width: 60, height: 40, background: 'var(--gray-100)', borderRadius: 8 }} />
      </div>
      <div style={{ width: 80, height: 32, background: 'var(--gray-100)', borderRadius: 6, margin: '0 1rem' }} />
      <div style={{ width: 100, height: 40, background: 'var(--gray-100)', borderRadius: 8 }} />
    </div>
  </div>
);

const SearchResultPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setTrip } = useBooking();

  const from       = params.get('from') || '';
  const to         = params.get('to') || '';
  const date       = params.get('date') || '';
  const passengers = parseInt(params.get('passengers') || '1');

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ busType: 'all', sort: 'time', maxPrice: '' });

  const doSearch = useCallback(async () => {
    if (!from || !to || !date) return;
    setLoading(true);
    setError('');
    try {
      const results = await tripApi.search(from, to, date);
      setTrips(results);
    } catch (err) {
      console.error('Search error:', err);
      if (err.message?.includes('fetch')) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đã chạy chưa.');
      } else {
        setError(err.message || 'Có lỗi khi tìm kiếm. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [from, to, date]);

  useEffect(() => {
    document.title = `${from} → ${to} | Vé Vui`;
    doSearch();
  }, [doSearch]);

  const filtered = trips
    .filter(t => filter.busType === 'all' || t.busType?.code === filter.busType)
    .filter(t => !filter.maxPrice || t.price <= parseInt(filter.maxPrice))
    .sort((a, b) => {
      if (filter.sort === 'price-asc') return a.price - b.price;
      if (filter.sort === 'price-desc') return b.price - a.price;
      return (a.departureTime || '').localeCompare(b.departureTime || '');
    });

  const handleSelect = (trip) => {
    setTrip({ ...trip, passengers });
    navigate(`/chon-ghe/${trip.id}`);
  };

  const dateLabel = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <div className="search-result-page">
      <Header />
      <main className="sr-main">
        {/* Search bar */}
        <section className="sr-searchbar">
          <div className="container">
            <SearchBox compact />
          </div>
        </section>

        <div className="container sr-content">
          {/* Result header */}
          <div className="sr-header">
            <div className="sr-header-left">
              <h1 className="sr-title">
                {from} <FiArrowRight /> {to}
              </h1>
              <p className="sr-subtitle">
                {dateLabel} · {passengers} hành khách ·{' '}
                {loading ? 'Đang tìm...' : <><strong>{filtered.length}</strong> chuyến xe</>}
              </p>
            </div>
          </div>

          <div className="sr-layout">
            {/* Filter sidebar */}
            <aside className="sr-filter">
              <div className="filter-card">
                <h3 className="filter-title"><FiFilter /> Bộ lọc</h3>

                <div className="filter-group">
                  <label className="filter-label">Sắp xếp theo</label>
                  <select className="form-input form-select" value={filter.sort} onChange={e => setFilter(f => ({ ...f, sort: e.target.value }))}>
                    <option value="time">Giờ khởi hành</option>
                    <option value="price-asc">Giá thấp → cao</option>
                    <option value="price-desc">Giá cao → thấp</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Loại xe</label>
                  <div className="filter-options">
                    {[['all', 'Tất cả'], ['STANDARD', 'Ghế ngồi'], ['SLEEPER', 'Giường nằm'], ['LIMOUSINE', 'Limousine'], ['VIP', 'VIP']].map(([val, label]) => (
                      <button
                        key={val}
                        className={`filter-option ${filter.busType === val ? 'active' : ''}`}
                        onClick={() => setFilter(f => ({ ...f, busType: val }))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Giá tối đa</label>
                  <select className="form-input form-select" value={filter.maxPrice} onChange={e => setFilter(f => ({ ...f, maxPrice: e.target.value }))}>
                    <option value="">Tất cả mức giá</option>
                    <option value="200000">Dưới 200.000₫</option>
                    <option value="350000">Dưới 350.000₫</option>
                    <option value="500000">Dưới 500.000₫</option>
                    <option value="1000000">Dưới 1.000.000₫</option>
                  </select>
                </div>

                <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => setFilter({ busType: 'all', sort: 'time', maxPrice: '' })}>
                  Xóa bộ lọc
                </button>
              </div>
            </aside>

            {/* Trip list */}
            <div className="sr-list">
              {/* Error state */}
              {error && !loading && (
                <div className="sr-empty">
                  <div className="sr-empty-icon"><FiAlertCircle size={48} style={{ color: 'var(--error, #ef4444)' }} /></div>
                  <h3>Không thể tải chuyến xe</h3>
                  <p>{error}</p>
                  <button className="btn btn-primary" onClick={doSearch}>
                    <FiRefreshCw size={14} /> Thử lại
                  </button>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <>
                  <TripSkeleton />
                  <TripSkeleton />
                  <TripSkeleton />
                </>
              )}

              {/* Empty state */}
              {!loading && !error && filtered.length === 0 && trips.length > 0 && (
                <div className="sr-empty">
                  <div className="sr-empty-icon">🔍</div>
                  <h3>Không có kết quả với bộ lọc hiện tại</h3>
                  <p>Hãy thử thay đổi bộ lọc hoặc chọn ngày khác.</p>
                  <button className="btn btn-primary" onClick={() => setFilter({ busType: 'all', sort: 'time', maxPrice: '' })}>
                    Xóa bộ lọc
                  </button>
                </div>
              )}

              {!loading && !error && trips.length === 0 && (
                <div className="sr-empty">
                  <div className="sr-empty-icon">🚌</div>
                  <h3>Không tìm thấy chuyến xe</h3>
                  <p>Không có chuyến xe nào từ <strong>{from}</strong> đến <strong>{to}</strong> vào ngày này. Hãy thử chọn ngày khác.</p>
                </div>
              )}

              {/* Results */}
              {!loading && !error && filtered.map(trip => (
                <TripCard key={trip.id} trip={trip} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchResultPage;
