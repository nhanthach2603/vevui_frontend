// pages/TicketLookupPage/TicketLookupPage.jsx
import { useEffect, useState } from 'react';
import { FiSearch, FiCheckCircle, FiXCircle, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { ticketApi, formatPrice } from '../../services/api';
import './TicketLookupPage.css';

const TicketLookupPage = () => {
  const [code,    setCode]   = useState('');
  const [phone,   setPhone]  = useState('');
  const [results, setResults] = useState([]);
  const [result,  setResult] = useState(null);
  const [error,   setError]  = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = 'Tra cứu vé | Vé Vui'; }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại để tra cứu');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setResults([]);

    try {
      // Tìm theo SĐT trước
      const list = await ticketApi.searchByPhone(phone.trim());

      // Nếu có mã vé → lọc theo mã vé
      if (code.trim()) {
        const found = list.find(t => t.id?.toUpperCase() === code.trim().toUpperCase());
        if (found) {
          setResult(found);
        } else if (list.length > 0) {
          setError(`Không tìm thấy vé mã "${code.trim().toUpperCase()}" với số điện thoại này.`);
        } else {
          setError('Không tìm thấy vé. Vui lòng kiểm tra lại số điện thoại.');
        }
      } else {
        // Không có mã vé → hiển thị tất cả vé của SĐT
        if (list.length > 0) {
          if (list.length === 1) {
            setResult(list[0]);
          } else {
            setResults(list);
          }
        } else {
          setError('Không tìm thấy vé nào với số điện thoại này.');
        }
      }
    } catch (err) {
      console.error('Lookup error:', err);
      // Fallback: tìm trong localStorage nếu backend lỗi
      if (err.message?.includes('fetch')) {
        const stored = JSON.parse(localStorage.getItem('vevui_tickets') || '[]');
        const found = stored.find(t =>
          t.phone === phone.trim() &&
          (!code.trim() || t.id === code.trim().toUpperCase())
        );
        if (found) {
          setResult(found);
        } else {
          setError('Không thể kết nối đến máy chủ. Kiểm tra backend đã chạy chưa.');
        }
      } else {
        setError(err.message || 'Có lỗi khi tra cứu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const TicketCard = ({ ticket }) => (
    <div className="lookup-result animate-fadeIn">
      <div className={`lr-status ${ticket.status === 'CONFIRMED' || ticket.status === 'confirmed' ? 'status-ok' : 'status-cancel'}`}>
        {ticket.status === 'CONFIRMED' || ticket.status === 'confirmed'
          ? <FiCheckCircle />
          : <FiXCircle />}
        <span>
          {ticket.status === 'CONFIRMED' || ticket.status === 'confirmed'
            ? 'Vé hợp lệ — Đã xác nhận'
            : ticket.status === 'CANCELLED' || ticket.status === 'cancelled'
              ? 'Vé đã hủy'
              : `Trạng thái: ${ticket.status}`}
        </span>
      </div>

      <div className="lr-ticket">
        <div className="lr-header">
          <span>🎫 Vé Vui</span>
          <span className="lr-code">{ticket.id}</span>
        </div>

        <div className="lr-route">
          <div className="lrr-city">
            <div className="lrr-time">{ticket.tripInfo?.departureTime}</div>
            <div className="lrr-name">{ticket.tripInfo?.from}</div>
          </div>
          <FiArrowRight className="lrr-arrow" />
          <div className="lrr-city">
            <div className="lrr-time">{ticket.tripInfo?.arrivalTime}</div>
            <div className="lrr-name">{ticket.tripInfo?.to}</div>
          </div>
        </div>

        <div className="lr-details">
          {[
            ['Ngày đi',    ticket.tripInfo?.date ? new Date(ticket.tripInfo.date + 'T00:00:00').toLocaleDateString('vi-VN') : '—'],
            ['Ghế',        ticket.seats?.join(', ')],
            ['Hành khách', ticket.customerName],
            ['Số điện thoại', ticket.phone],
            ['Tổng tiền',  formatPrice(ticket.totalPrice)],
            ['Ngày đặt',   ticket.bookedAt ? new Date(ticket.bookedAt).toLocaleDateString('vi-VN') : '—'],
          ].map(([label, val]) => (
            <div key={label} className="lr-row">
              <span>{label}</span><span>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="lookup-page">
      <Header />
      <main className="lookup-main">
        {/* Hero */}
        <section className="lookup-hero">
          <div className="container">
            <h1>Tra cứu vé điện tử</h1>
            <p>Nhập số điện thoại (và mã vé nếu có) để xem thông tin chuyến đi của bạn</p>
          </div>
        </section>

        <div className="container lookup-content">
          <div className="lookup-card">
            <form onSubmit={handleSearch} className="lookup-form">
              <div className="form-group">
                <label className="form-label">Số điện thoại đặt vé *</label>
                <input
                  className="form-input"
                  placeholder="VD: 0901234567"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  id="lookup-phone"
                  type="tel"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mã vé <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(không bắt buộc)</span></label>
                <input
                  className="form-input"
                  placeholder="VD: VV12345678"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                  id="ticket-code"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                />
              </div>

              {error && (
                <p className="search-error">
                  <FiAlertCircle size={16} /> {error}
                </p>
              )}

              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} id="lookup-btn" style={{ width: '100%' }}>
                {loading ? 'Đang tìm...' : <><FiSearch /> Tra cứu vé</>}
              </button>
            </form>

            {/* Single result */}
            {result && <TicketCard ticket={result} />}

            {/* Multiple results */}
            {results.length > 1 && (
              <div>
                <p style={{ marginBottom: '1rem', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                  Tìm thấy <strong>{results.length}</strong> vé với số điện thoại này:
                </p>
                {results.map(t => <TicketCard key={t.id} ticket={t} />)}
              </div>
            )}

            <div className="lookup-hint">
              <div className="lh-title">💡 Bạn chưa có mã vé?</div>
              <p>Hãy đặt vé ngay trên trang chủ hoặc kiểm tra lại email đặt vé của bạn.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TicketLookupPage;
