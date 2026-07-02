// pages/PaymentPage/PaymentPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiCopy, FiDownload, FiArrowRight, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { ticketApi, paymentApi, formatPrice, ApiError } from '../../services/api';
import './PaymentPage.css';

const PAYMENT_METHODS = [
  { id: 'transfer', label: 'Chuyển khoản ngân hàng', icon: '🏦', desc: 'MB Bank, Vietcombank, Techcombank...' },
  { id: 'momo',     label: 'Ví MoMo',                icon: '💜', desc: 'Thanh toán qua ví điện tử MoMo' },
  { id: 'vnpay',    label: 'VNPay',                  icon: '🟦', desc: 'Thẻ ATM, Visa, Mastercard qua VNPay' },
  { id: 'zalopay',  label: 'ZaloPay',                icon: '🔵', desc: 'Thanh toán qua ZaloPay' },
];

const SuccessScreen = ({ ticket }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(ticket.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="success-screen">
      <div className="success-icon-wrap">
        <div className="success-ring" />
        <div className="success-icon"><FiCheckCircle /></div>
      </div>
      <h1 className="success-title">Đặt vé thành công! 🎉</h1>
      <p className="success-desc">
        Cảm ơn bạn đã sử dụng dịch vụ Vé Vui! Vé điện tử đã được gửi về email <strong>{ticket.email}</strong>
      </p>

      <div className="ticket-card">
        <div className="ticket-header">
          <span className="ticket-logo">🎫 Vé Vui</span>
          <span className="ticket-badge">Đã xác nhận</span>
        </div>
        <div className="ticket-body">
          <div className="ticket-code-section">
            <span className="tc-label">Mã vé</span>
            <div className="tc-code">
              {ticket.id}
              <button className="tc-copy" onClick={copyCode} id="copy-ticket-code">
                {copied ? '✓' : <FiCopy size={14} />}
              </button>
            </div>
          </div>
          <div className="ticket-route">
            <div className="tr-city">
              <div className="tr-time">{ticket.tripInfo?.departureTime}</div>
              <div className="tr-name">{ticket.tripInfo?.from}</div>
            </div>
            <div className="tr-arrow"><FiArrowRight /></div>
            <div className="tr-city">
              <div className="tr-time">{ticket.tripInfo?.arrivalTime}</div>
              <div className="tr-name">{ticket.tripInfo?.to}</div>
            </div>
          </div>
          <div className="ticket-details">
            <div className="td-item"><span>Ngày</span><span>{ticket.tripInfo?.date ? new Date(ticket.tripInfo.date + 'T00:00:00').toLocaleDateString('vi-VN') : '—'}</span></div>
            <div className="td-item"><span>Ghế</span><span>{ticket.seats?.join(', ')}</span></div>
            <div className="td-item"><span>Hành khách</span><span>{ticket.customerName}</span></div>
            <div className="td-item"><span>SĐT</span><span>{ticket.phone}</span></div>
          </div>
          <div className="ticket-total">
            <span>Tổng tiền</span>
            <span className="tt-price">{formatPrice(ticket.totalPrice)}</span>
          </div>
        </div>
        <div className="ticket-barcode">
          {'▌▌ ▌▌▌ ▌▌▌▌ ▌ ▌▌▌ ▌▌▌ ▌▌'}
        </div>
      </div>

      <div className="success-actions">
        <button className="btn btn-outline" onClick={() => window.print()}>
          <FiDownload /> Tải vé về
        </button>
        <Link to="/tra-cuu-ve" className="btn btn-ghost">Tra cứu vé</Link>
        <Link to="/" className="btn btn-primary">Trang chủ</Link>
      </div>
    </div>
  );
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedTrip, selectedSeats, totalPrice,
    passengerInfo, pickupPoint, dropoffPoint,
    paymentMethod, setPayment, confirmTicket,
    confirmedTicket,
  } = useBooking();

  const [couponCode, setCouponCode] = useState('');
  const [discountAmt, setDiscountAmt] = useState(0);
  const [couponErr, setCouponErr] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    document.title = 'Thanh toán | Vé Vui';
    if (!selectedTrip || selectedSeats.length === 0) navigate('/');
  }, []);

  if (confirmedTicket) return (
    <div className="payment-page">
      <Header />
      <main className="payment-main">
        <div className="container">
          <SuccessScreen ticket={confirmedTicket} />
        </div>
      </main>
      <Footer />
    </div>
  );

  // Áp mã giảm giá qua API
  const applyDiscount = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponErr('');
    try {
      const res = await paymentApi.applyCoupon(couponCode.trim().toUpperCase(), totalPrice);
      if (res.valid) {
        setDiscountAmt(Number(res.discountAmount));
        setCouponErr('');
      } else {
        setCouponErr(res.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
        setDiscountAmt(0);
      }
    } catch (err) {
      // Fallback: test hardcoded codes nếu backend chưa có coupon
      const codes = { 'VEVUI10': 0.1, 'SUMMER20': 0.2, 'NEWUSER': 0.15 };
      const rate = codes[couponCode.trim().toUpperCase()];
      if (rate) {
        setDiscountAmt(Math.round(totalPrice * rate));
        setCouponErr('');
      } else {
        setCouponErr('Mã giảm giá không hợp lệ hoặc đã hết hạn');
        setDiscountAmt(0);
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const finalPrice = Math.max(0, totalPrice - discountAmt);

  const handlePay = async () => {
    setProcessing(true);
    setPayError('');
    try {
      // 1. Tạo vé qua backend
      const ticketData = {
        tripId: Number(selectedTrip.id),
        customerId: user?.id ? Number(user.id) : null,
        customerName: passengerInfo.name,
        phone: passengerInfo.phone,
        email: passengerInfo.email,
        seats: selectedSeats,
        pickupPointId: pickupPoint?.id ? Number(pickupPoint.id) : null,
        dropoffPointId: dropoffPoint?.id ? Number(dropoffPoint.id) : null,
        totalPrice: finalPrice,
        paymentMethod,
        couponCode: couponCode.trim() || null,
        // Denormalized trip info
        fromCity: selectedTrip.route?.from || '',
        toCity: selectedTrip.route?.to || '',
        tripDate: selectedTrip.date || '',
        departureTime: selectedTrip.departureTime || '',
        arrivalTime: selectedTrip.arrivalTime || '',
      };

      const ticket = await ticketApi.create(ticketData);

      // 2. Lưu ticket vào context + localStorage
      confirmTicket(ticket);

      // 3. (Optional) Xử lý payment nếu cần
      // await paymentApi.process(ticket.id, paymentMethod, finalPrice);

    } catch (err) {
      console.error('Payment error:', err);
      if (err instanceof ApiError) {
        if (err.status === 400) setPayError(err.message || 'Thông tin đặt vé không hợp lệ');
        else if (err.status === 409) setPayError('Ghế đã được đặt bởi người khác. Vui lòng chọn ghế khác.');
        else setPayError('Có lỗi xảy ra khi đặt vé. Vui lòng thử lại.');
      } else if (err.message?.includes('fetch')) {
        setPayError('Không thể kết nối đến máy chủ. Kiểm tra backend đã chạy chưa.');
      } else {
        setPayError(err.message || 'Có lỗi không xác định. Vui lòng thử lại.');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!selectedTrip) return null;

  return (
    <div className="payment-page">
      <Header />
      <main className="payment-main">
        <div className="container">
          {/* Steps */}
          <div className="booking-steps">
            {['Chọn chuyến', 'Chọn ghế', 'Thông tin', 'Thanh toán'].map((step, i) => (
              <div key={step} className={`booking-step ${i === 3 ? 'active' : i < 3 ? 'done' : ''}`}>
                <div className="step-num">{i < 3 ? '✓' : i + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div className="payment-layout">
            <div className="payment-left">
              {/* Payment method */}
              <div className="payment-card">
                <h2 className="payment-card-title">Phương thức thanh toán</h2>
                <div className="payment-methods">
                  {PAYMENT_METHODS.map(m => (
                    <label key={m.id} className={`pm-option ${paymentMethod === m.id ? 'selected' : ''}`} id={`pm-${m.id}`}>
                      <input
                        type="radio"
                        name="payment"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        onChange={() => setPayment(m.id)}
                        hidden
                      />
                      <span className="pm-icon">{m.icon}</span>
                      <div className="pm-info">
                        <div className="pm-label">{m.label}</div>
                        <div className="pm-desc">{m.desc}</div>
                      </div>
                      <div className="pm-check">{paymentMethod === m.id && '✓'}</div>
                    </label>
                  ))}
                </div>

                {/* Bank transfer info */}
                {paymentMethod === 'transfer' && (
                  <div className="payment-bank-info">
                    <div className="bank-info-title">Thông tin chuyển khoản</div>
                    <div className="bank-rows">
                      <div className="bank-row"><span>Ngân hàng</span><span>MB Bank</span></div>
                      <div className="bank-row"><span>Số TK</span><span className="bank-acc">0987 6543 210</span></div>
                      <div className="bank-row"><span>Chủ TK</span><span>CONG TY VE VUI</span></div>
                      <div className="bank-row"><span>Nội dung</span><span>VV {passengerInfo.phone}</span></div>
                      <div className="bank-row"><span>Số tiền</span><span className="bank-amount">{formatPrice(finalPrice)}</span></div>
                    </div>
                    <p className="bank-note">⚠️ Vui lòng chuyển khoản đúng nội dung để vé được xác nhận tự động.</p>
                  </div>
                )}
              </div>

              {/* Discount */}
              <div className="payment-card">
                <h3 className="payment-card-title">Mã giảm giá</h3>
                <div className="discount-form">
                  <input
                    className={`form-input ${couponErr ? 'input-error' : ''}`}
                    placeholder="Nhập mã giảm giá (VD: VEVUI10)"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponErr(''); }}
                    id="discount-code"
                  />
                  <button
                    className="btn btn-outline"
                    onClick={applyDiscount}
                    id="apply-discount"
                    disabled={couponLoading || !couponCode.trim()}
                  >
                    {couponLoading ? '...' : 'Áp dụng'}
                  </button>
                </div>
                {couponErr && <span className="error-msg">{couponErr}</span>}
                {discountAmt > 0 && (
                  <div className="discount-success">✅ Giảm {formatPrice(discountAmt)} thành công!</div>
                )}
                <p className="discount-hint">Thử: VEVUI10, SUMMER20, NEWUSER</p>
              </div>
            </div>

            {/* Order summary */}
            <aside className="payment-summary">
              <div className="order-summary-card">
                <h3>Xác nhận đơn hàng</h3>

                <div className="os-route">
                  <span className="os-from">{selectedTrip.route?.from}</span>
                  <FiArrowRight className="os-arrow" />
                  <span className="os-to">{selectedTrip.route?.to}</span>
                </div>

                <div className="os-details">
                  <div className="os-row"><span>Ngày đi</span><span>{selectedTrip.date ? new Date(selectedTrip.date + 'T00:00:00').toLocaleDateString('vi-VN') : '—'}</span></div>
                  <div className="os-row"><span>Giờ đi</span><span>{selectedTrip.departureTime}</span></div>
                  <div className="os-row"><span>Ghế</span><span>{selectedSeats.join(', ')}</span></div>
                  <div className="os-row"><span>Hành khách</span><span>{passengerInfo.name}</span></div>
                  {pickupPoint && <div className="os-row"><span>Điểm đón</span><span style={{ fontSize: '0.8rem' }}>{pickupPoint.name}</span></div>}
                  {dropoffPoint && <div className="os-row"><span>Điểm trả</span><span style={{ fontSize: '0.8rem' }}>{dropoffPoint.name}</span></div>}
                </div>

                <div className="os-price-block">
                  <div className="os-row"><span>{selectedSeats.length} vé</span><span>{formatPrice(totalPrice)}</span></div>
                  {discountAmt > 0 && (
                    <div className="os-row discount-row"><span>Giảm giá</span><span>-{formatPrice(discountAmt)}</span></div>
                  )}
                  <div className="os-total">
                    <span>Tổng thanh toán</span>
                    <span className="os-total-price">{formatPrice(finalPrice)}</span>
                  </div>
                </div>

                {/* Payment error */}
                {payError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <FiAlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: '0.85rem', color: '#dc2626' }}>{payError}</span>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '16px', fontSize: '1rem', marginTop: 8 }}
                  onClick={handlePay}
                  disabled={processing}
                  id="confirm-payment"
                >
                  {processing ? (
                    <span className="loading-dots">Đang xử lý<span>.</span><span>.</span><span>.</span></span>
                  ) : (
                    <> Xác nhận thanh toán {formatPrice(finalPrice)} </>
                  )}
                </button>

                <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate(-1)} disabled={processing}>
                  <FiArrowLeft /> Quay lại
                </button>

                <p className="os-secure">🔒 Thanh toán được bảo mật bằng SSL</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentPage;
