// pages/TicketLookupPage/TicketLookupPage.jsx
import { useEffect, useState } from 'react';
import { FiSearch, FiCheckCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { formatPrice } from '../../services/mockData';
import './TicketLookupPage.css';

const TicketLookupPage = () => {
  const [code,   setCode]   = useState('');
  const [phone,  setPhone]  = useState('');
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');
  const [loading,setLoading]= useState(false);

  useEffect(() => { document.title = 'Tra cứu vé | Vé Vui'; }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!code.trim() || !phone.trim()) { setError('Vui lòng nhập đầy đủ mã vé và số điện thoại'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    await new Promise(r => setTimeout(r, 800));
    // Check localStorage
    const tickets = JSON.parse(localStorage.getItem('vevui_tickets') || '[]');
    const found = tickets.find(t => t.id === code.trim().toUpperCase() && t.phone === phone.trim());
    if (found) {
      setResult(found);
    } else {
      setError('Không tìm thấy vé. Vui lòng kiểm tra lại mã vé và số điện thoại.');
    }
    setLoading(false);
  };

  return (
    <div className="lookup-page">
      <Header />
      <main className="lookup-main">
        {/* Hero */}
        <section className="lookup-hero">
          <div className="container">
            <h1>Tra cứu vé điện tử</h1>
            <p>Nhập mã vé và số điện thoại để xem thông tin chuyến đi của bạn</p>
          </div>
        </section>

        <div className="container lookup-content">
          <div className="lookup-card">
            <form onSubmit={handleSearch} className="lookup-form">
              <div className="form-group">
                <label className="form-label">Mã vé</label>
                <input
                  className="form-input"
                  placeholder="VD: VV12345678"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  id="ticket-code"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại đặt vé</label>
                <input
                  className="form-input"
                  placeholder="VD: 0901234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  id="lookup-phone"
                  type="tel"
                />
              </div>
              {error && <p className="search-error"><span>⚠️</span> {error}</p>}
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} id="lookup-btn" style={{ width: '100%' }}>
                {loading ? 'Đang tìm...' : <><FiSearch /> Tra cứu vé</>}
              </button>
            </form>

            {/* Result */}
            {result && (
              <div className="lookup-result animate-fadeIn">
                <div className={`lr-status ${result.status === 'confirmed' ? 'status-ok' : 'status-cancel'}`}>
                  {result.status === 'confirmed' ? <FiCheckCircle /> : <FiXCircle />}
                  <span>{result.status === 'confirmed' ? 'Vé hợp lệ — Đã xác nhận' : 'Vé đã hủy'}</span>
                </div>

                <div className="lr-ticket">
                  <div className="lr-header">
                    <span>🎫 Vé Vui</span>
                    <span className="lr-code">{result.id}</span>
                  </div>

                  <div className="lr-route">
                    <div className="lrr-city">
                      <div className="lrr-time">{result.tripInfo?.departureTime}</div>
                      <div className="lrr-name">{result.tripInfo?.from}</div>
                    </div>
                    <FiArrowRight className="lrr-arrow" />
                    <div className="lrr-city">
                      <div className="lrr-time">{result.tripInfo?.arrivalTime}</div>
                      <div className="lrr-name">{result.tripInfo?.to}</div>
                    </div>
                  </div>

                  <div className="lr-details">
                    {[
                      ['Ngày đi', result.tripInfo?.date ? new Date(result.tripInfo.date + 'T00:00:00').toLocaleDateString('vi-VN') : '—'],
                      ['Ghế', result.seats?.join(', ')],
                      ['Hành khách', result.customerName],
                      ['Số điện thoại', result.phone],
                      ['Tổng tiền', formatPrice(result.totalPrice)],
                      ['Ngày đặt', new Date(result.bookedAt).toLocaleDateString('vi-VN')],
                    ].map(([label, val]) => (
                      <div key={label} className="lr-row">
                        <span>{label}</span><span>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
