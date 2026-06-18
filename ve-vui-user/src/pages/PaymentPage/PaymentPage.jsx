// pages/PaymentPage/PaymentPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiCopy, FiDownload, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useBooking } from '../../context/BookingContext';
import { formatPrice } from '../../services/mockData';
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
            <div className="td-item"><span>Ngày</span><span>{new Date(ticket.tripInfo?.date + 'T00:00:00').toLocaleDateString('vi-VN')}</span></div>
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
        <Link to="/tra-cuu-ve" className="btn btn-ghost">
          Tra cứu vé
        </Link>
        <Link to="/" className="btn btn-primary">
          Trang chủ
        </Link>
      </div>
    </div>
  );
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const {
    selectedTrip, selectedSeats, totalPrice,
    passengerInfo, pickupPoint, dropoffPoint,
    paymentMethod, setPayment, confirmTicket,
    confirmedTicket,
  } = useBooking();

  const [discount, setDiscount] = useState('');
  const [discountAmt, setDiscountAmt] = useState(0);
  const [discountErr, setDiscountErr] = useState('');
  const [processing, setProcessing] = useState(false);

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

  const applyDiscount = () => {
    const codes = { 'VEVUI10': 0.1, 'SUMMER20': 0.2, 'NEWUSER': 0.15 };
    const rate   = codes[discount.toUpperCase()];
    if (rate) {
      setDiscountAmt(Math.round(totalPrice * rate));
      setDiscountErr('');
    } else {
      setDiscountErr('Mã giảm giá không hợp lệ hoặc đã hết hạn');
      setDiscountAmt(0);
    }
  };

  const finalPrice = totalPrice - discountAmt;

  const handlePay = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));
    const ticketId = `VV${Date.now().toString().slice(-8)}`;
    confirmTicket({
      id: ticketId,
      tripId: selectedTrip.id,
      customerName: passengerInfo.name,
      phone: passengerInfo.phone,
      email: passengerInfo.email,
      seats: selectedSeats,
      pickupPoint,
      dropoffPoint,
      totalPrice: finalPrice,
      paymentMethod,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
      tripInfo: {
        from: selectedTrip.route?.from,
        to: selectedTrip.route?.to,
        date: selectedTrip.date,
        departureTime: selectedTrip.departureTime,
        arrivalTime: selectedTrip.arrivalTime,
      },
    });
    setProcessing(false);
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

                {/* Mock payment info */}
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
                    className={`form-input ${discountErr ? 'input-error' : ''}`}
                    placeholder="Nhập mã giảm giá (VD: VEVUI10)"
                    value={discount}
                    onChange={e => { setDiscount(e.target.value); setDiscountErr(''); }}
                    id="discount-code"
                  />
                  <button className="btn btn-outline" onClick={applyDiscount} id="apply-discount">Áp dụng</button>
                </div>
                {discountErr && <span className="error-msg">{discountErr}</span>}
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
                  <div className="os-row"><span>Ngày đi</span><span>{new Date(selectedTrip.date + 'T00:00:00').toLocaleDateString('vi-VN')}</span></div>
                  <div className="os-row"><span>Giờ đi</span><span>{selectedTrip.departureTime}</span></div>
                  <div className="os-row"><span>Ghế</span><span>{selectedSeats.join(', ')}</span></div>
                  <div className="os-row"><span>Hành khách</span><span>{passengerInfo.name}</span></div>
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
