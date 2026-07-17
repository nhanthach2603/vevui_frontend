// pages/BookingPage/BookingPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { tripApi, formatPrice } from '../../services/api';
import './BookingPage.css';

const BookingPage = () => {
  const { tripId } = useParams();
  const navigate   = useNavigate();
  const {
    selectedTrip, selectedSeats, totalPrice,
    passengerInfo, pickupPoint, dropoffPoint,
    setPassenger, setPickup, setDropoff,
  } = useBooking();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name:  passengerInfo.name  || user?.name  || '',
    phone: passengerInfo.phone || user?.phone || '',
    email: passengerInfo.email || user?.email || '',
  });
  const [errors, setErrors] = useState({});

  // Pickup / Dropoff points từ API
  const [pickups, setPickups]   = useState([]);
  const [dropoffs, setDropoffs] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);

  const from = selectedTrip?.route?.from || '';
  const to   = selectedTrip?.route?.to   || '';

  useEffect(() => {
    document.title = 'Thông tin đặt vé | Vé Vui';
    if (!selectedTrip || selectedSeats.length === 0) navigate('/');
  }, []);

  // Load pickup points từ API
  useEffect(() => {
    if (!from || !to) return;
    const loadPoints = async () => {
      setLoadingPoints(true);
      try {
        const [pPickups, pDropoffs] = await Promise.all([
          tripApi.getPickupPoints(from),
          tripApi.getPickupPoints(to),
        ]);
        setPickups(pPickups || []);
        setDropoffs(pDropoffs || []);
      } catch (err) {
        console.warn('Could not load pickup points:', err);
        // Giữ mảng rỗng, user vẫn có thể tiếp tục không chọn điểm đón
        setPickups([]);
        setDropoffs([]);
      } finally {
        setLoadingPoints(false);
      }
    };
    loadPoints();
  }, [from, to]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!form.phone.trim() || form.phone.length < 10) e.phone = 'Số điện thoại không hợp lệ (ít nhất 10 số)';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Email không hợp lệ';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setPassenger(form);
    navigate('/thanh-toan');
  };

  if (!selectedTrip) return null;

  return (
    <div className="booking-page">
      <Header />
      <main className="booking-main">
        <div className="container">
          {/* Steps */}
          <div className="booking-steps">
            {['Chọn chuyến', 'Chọn ghế', 'Thông tin', 'Thanh toán'].map((step, i) => (
              <div key={step} className={`booking-step ${i === 2 ? 'active' : i < 2 ? 'done' : ''}`}>
                <div className="step-num">{i < 2 ? '✓' : i + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div className="booking-layout">
            {/* Form */}
            <div className="booking-form-card">
              <h2 className="booking-form-title">Thông tin hành khách</h2>
              <form onSubmit={handleSubmit} id="booking-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      <FiUser size={14} /> Họ và tên *
                    </label>
                    <input
                      className={`form-input ${errors.name ? 'input-error' : ''}`}
                      placeholder="Nguyễn Văn A"
                      value={form.name}
                      onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(r => ({ ...r, name: '' })); }}
                      id="passenger-name"
                    />
                    {errors.name && <span className="error-msg">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <FiPhone size={14} /> Số điện thoại *
                    </label>
                    <input
                      className={`form-input ${errors.phone ? 'input-error' : ''}`}
                      placeholder="0901234567"
                      value={form.phone}
                      onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setErrors(r => ({ ...r, phone: '' })); }}
                      id="passenger-phone"
                      type="tel"
                    />
                    {errors.phone && <span className="error-msg">{errors.phone}</span>}
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      <FiMail size={14} /> Email *
                    </label>
                    <input
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="email@example.com"
                      type="email"
                      value={form.email}
                      onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(r => ({ ...r, email: '' })); }}
                      id="passenger-email"
                    />
                    {errors.email && <span className="error-msg">{errors.email}</span>}
                    <span className="input-hint">Vé điện tử sẽ được gửi về email này</span>
                  </div>
                </div>

                {/* Pickup & Dropoff */}
                <div className="booking-points">
                  <h3 className="booking-section-title"><FiMapPin size={16} /> Điểm đón & Trả khách</h3>
                  {loadingPoints ? (
                    <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', marginBottom: '1rem' }}>⏳ Đang tải điểm đón/trả...</p>
                  ) : (
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Điểm đón tại {from}</label>
                        <select
                          className="form-input form-select"
                          value={pickupPoint?.id || ''}
                          onChange={e => {
                            const p = pickups.find(pp => String(pp.id) === e.target.value);
                            setPickup(p || null);
                          }}
                          id="pickup-point"
                        >
                          <option value="">-- Chọn điểm đón --</option>
                          {pickups.map(p => (
                            <option key={p.id} value={String(p.id)}>{p.name}{p.timeOffset ? ` (${p.timeOffset})` : ''}</option>
                          ))}
                        </select>
                        {pickups.length === 0 && (
                          <span className="input-hint" style={{ color: 'var(--gray-400)' }}>Không có điểm đón riêng — lên xe tại bến</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Điểm trả tại {to}</label>
                        <select
                          className="form-input form-select"
                          value={dropoffPoint?.id || ''}
                          onChange={e => {
                            const p = dropoffs.find(dp => String(dp.id) === e.target.value);
                            setDropoff(p || null);
                          }}
                          id="dropoff-point"
                        >
                          <option value="">-- Chọn điểm trả --</option>
                          {dropoffs.map(p => (
                            <option key={p.id} value={String(p.id)}>{p.name}{p.timeOffset ? ` (${p.timeOffset})` : ''}</option>
                          ))}
                        </select>
                        {dropoffs.length === 0 && (
                          <span className="input-hint" style={{ color: 'var(--gray-400)' }}>Không có điểm trả riêng — xuống tại bến</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="booking-note">
                  <div className="note-icon">📋</div>
                  <div>
                    <strong>Lưu ý khi đặt vé:</strong>
                    <ul>
                      <li>Vui lòng có mặt trước giờ khởi hành ít nhất 15 phút.</li>
                      <li>Mang theo CMND/CCCD hoặc Hộ chiếu khi lên xe.</li>
                      <li>Vé đã xuất không được hoàn trả trong vòng 2 giờ trước giờ đi.</li>
                    </ul>
                  </div>
                </div>

                <div className="booking-form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Quay lại
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg" id="go-to-payment">
                    Tiếp tục thanh toán <FiArrowRight />
                  </button>
                </div>
              </form>
            </div>

            {/* Summary sidebar */}
            <aside className="booking-sidebar">
              <div className="booking-summary-card">
                <h3>Tóm tắt đơn hàng</h3>

                <div className="bs-route">
                  <div className="bs-city">
                    <span className="bs-dot from" />
                    <div>
                      <div className="bs-city-name">{from}</div>
                      <div className="bs-time">{selectedTrip.departureTime}</div>
                    </div>
                  </div>
                  <div className="bs-line" />
                  <div className="bs-city">
                    <span className="bs-dot to" />
                    <div>
                      <div className="bs-city-name">{to}</div>
                      <div className="bs-time">{selectedTrip.arrivalTime}</div>
                    </div>
                  </div>
                </div>

                <div className="bs-details">
                  <div className="bs-row">
                    <span>Ngày đi</span>
                    <span>{selectedTrip.date ? new Date(selectedTrip.date + 'T00:00:00').toLocaleDateString('vi-VN') : '—'}</span>
                  </div>
                  <div className="bs-row">
                    <span>Ghế</span>
                    <span className="bs-seats">{selectedSeats.join(', ')}</span>
                  </div>
                  <div className="bs-row">
                    <span>Loại xe</span>
                    <span>{selectedTrip.busType?.name}</span>
                  </div>
                </div>

                <div className="bs-price">
                  <div className="bs-price-row">
                    <span>{selectedSeats.length} vé × {formatPrice(selectedTrip.price)}</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="bs-price-total">
                    <span>Tổng cộng</span>
                    <span className="bs-total-val">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingPage;
