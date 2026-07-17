// pages/SeatSelectPage/SeatSelectPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiArrowLeft, FiInfo, FiRefreshCw } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { tripApi, formatPrice } from '../../services/api';
import './SeatSelectPage.css';

// Tạo sơ đồ ghế từ SeatMapResponse của backend
const buildSeatRows = (seatMapResponse) => {
  if (!seatMapResponse?.seatRows) return [];
  return seatMapResponse.seatRows;
};

// Fallback: generate seat map locally nếu API chưa trả seatRows
const generateFallbackSeatMap = (busTypeCode, totalSeats, bookedSeats = []) => {
  const seatsPerRow = busTypeCode === 'SLEEPER' ? 3 : 4;
  const rowCount = Math.ceil(totalSeats / seatsPerRow);
  const rows = [];
  for (let r = 0; r < rowCount; r++) {
    const row = [];
    const cols = busTypeCode === 'SLEEPER' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
    for (const col of cols) {
      const id = `${r + 1}${col}`;
      row.push({
        id,
        label: id,
        status: bookedSeats.includes(id) ? 'booked' : 'available',
        floor: busTypeCode === 'SLEEPER' ? (col === 'C' ? 2 : 1) : 1,
      });
    }
    rows.push(row);
  }
  return rows;
};

const SeatSelectPage = () => {
  const { tripId } = useParams();
  const navigate   = useNavigate();
  const { selectedSeats, selectedTrip, setTrip, toggleSeat, searchParams, setSearch } = useBooking();
  const { isLoggedIn } = useAuth();

  const [seatMap, setSeatMap] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [error, setError] = useState('');

  // Restore booking state from sessionStorage after login redirect
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('vevui_pending_booking');
      if (!raw) return;
      const pending = JSON.parse(raw);
      if (pending.selectedTrip && String(pending.selectedTrip.id) === String(tripId)) {
        setTrip(pending.selectedTrip);
        if (pending.searchParams) setSearch(pending.searchParams);
        // Store seats to restore after trip loads
        sessionStorage.setItem('vevui_pending_seats', JSON.stringify(pending.selectedSeats));
      }
      sessionStorage.removeItem('vevui_pending_booking');
    } catch { /* ignore */ }
  }, [tripId]);

  // Restore selected seats after trip loads from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('vevui_pending_seats');
      if (!raw || !selectedTrip || String(selectedTrip.id) !== String(tripId)) return;
      const savedSeats = JSON.parse(raw);
      savedSeats.forEach(seatId => toggleSeat(seatId));
      sessionStorage.removeItem('vevui_pending_seats');
    } catch { /* ignore */ }
  }, [selectedTrip, tripId]);

  // Load trip nếu chưa có (ví dụ user truy cập trực tiếp qua URL)
  useEffect(() => {
    const loadTrip = async () => {
      if (!selectedTrip || String(selectedTrip.id) !== String(tripId)) {
        setLoadingTrip(true);
        try {
          const trip = await tripApi.getById(tripId);
          setTrip({ ...trip });
        } catch (err) {
          setError('Không tìm thấy chuyến xe. Vui lòng quay lại và thử lại.');
        } finally {
          setLoadingTrip(false);
        }
      }
    };
    loadTrip();
    document.title = 'Chọn ghế | Vé Vui';
  }, [tripId]);

  // Load seat map từ backend
  useEffect(() => {
    if (!tripId) return;
    const loadSeatMap = async () => {
      setLoadingSeats(true);
      setError('');
      try {
        const response = await tripApi.getSeatMap(tripId);
        if (response?.seatRows && response.seatRows.length > 0) {
          setSeatMap(buildSeatRows(response));
        } else {
          // Fallback nếu API không trả seatRows
          const busTypeCode = selectedTrip?.busType?.code || 'STANDARD';
          const totalSeats = selectedTrip?.busType?.seats || 40;
          const bookedSeats = selectedTrip?.bookedSeats || [];
          setSeatMap(generateFallbackSeatMap(busTypeCode, totalSeats, bookedSeats));
        }
      } catch (err) {
        console.warn('SeatMap API failed, using fallback:', err);
        // Dùng bookedSeats từ TripResponse
        const busTypeCode = selectedTrip?.busType?.code || 'STANDARD';
        const totalSeats = selectedTrip?.busType?.seats || 40;
        const bookedSeats = selectedTrip?.bookedSeats || [];
        setSeatMap(generateFallbackSeatMap(busTypeCode, totalSeats, bookedSeats));
      } finally {
        setLoadingSeats(false);
      }
    };
    loadSeatMap();
  }, [tripId, selectedTrip]);

  const isSleeper = selectedTrip?.busType?.code === 'SLEEPER';
  const maxSeats   = searchParams.passengers || 1;
  const totalPrice = selectedSeats.length * (selectedTrip?.price || 0);

  const handleContinue = () => {
    if (selectedSeats.length < 1) return;
    if (!isLoggedIn) {
      sessionStorage.setItem('vevui_pending_booking', JSON.stringify({
        selectedTrip,
        selectedSeats,
        searchParams,
      }));
      navigate('/dang-nhap', { state: { from: '/chon-ghe/' + tripId } });
      return;
    }
    navigate('/dat-ve/' + tripId);
  };

  if (loadingTrip) {
    return (
      <div className="seat-page">
        <Header />
        <main style={{ paddingTop: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</div>
            <h2>Đang tải thông tin chuyến xe...</h2>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!selectedTrip && !loadingTrip) {
    return (
      <div className="seat-page">
        <Header />
        <main style={{ paddingTop: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚌</div>
            <h2>Không tìm thấy chuyến xe</h2>
            {error && <p style={{ color: 'var(--error, #ef4444)', marginBottom: '1rem' }}>{error}</p>}
            <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Về trang chủ</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="seat-page">
      <Header />
      <main className="seat-main">
        <div className="container">
          {/* Breadcrumb progress */}
          <div className="booking-steps">
            {['Chọn chuyến', 'Chọn ghế', 'Thông tin', 'Thanh toán'].map((step, i) => (
              <div key={step} className={`booking-step ${i === 1 ? 'active' : i < 1 ? 'done' : ''}`}>
                <div className="step-num">{i < 1 ? '✓' : i + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div className="seat-layout">
            {/* Seat map */}
            <div className="seat-map-wrapper">
              <div className="seat-map-card">
                <div className="seat-map-header">
                  <h2>Sơ đồ ghế xe</h2>
                  <div className="seat-legend">
                    <span className="legend-item"><span className="legend-dot available" />Trống</span>
                    <span className="legend-item"><span className="legend-dot booked" />Đã đặt</span>
                    <span className="legend-item"><span className="legend-dot selected" />Đang chọn</span>
                  </div>
                </div>

                <div className="bus-cockpit">
                  <div className="cockpit-icon">🚌</div>
                  <div className="driver-label">Tài xế</div>
                </div>

                {loadingSeats ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                    <FiRefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '0.5rem' }}>Đang tải sơ đồ ghế...</p>
                  </div>
                ) : isSleeper ? (
                  <div className="seat-floors">
                    {[1, 2].map(floor => {
                      const floorRows = seatMap.filter(row => row[0]?.floor === floor);
                      return (
                        <div key={floor} className="seat-floor">
                          <div className="floor-label">Tầng {floor}</div>
                          <div className="seat-rows">
                            {floorRows.map((row, ri) => (
                              <div key={ri} className="seat-row">
                                {row.map(seat => (
                                  <button
                                    key={seat.id}
                                    className={`seat sleeper-seat ${seat.status === 'booked' ? 'seat-booked' : selectedSeats.includes(seat.id) ? 'seat-selected' : 'seat-available'}`}
                                    onClick={() => seat.status !== 'booked' && toggleSeat(seat.id)}
                                    disabled={seat.status === 'booked'}
                                    title={seat.label}
                                    id={`seat-${seat.id}`}
                                  >
                                    {seat.label}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="seat-rows">
                    {seatMap.map((row, ri) => (
                      <div key={ri} className="seat-row">
                        {row.slice(0, 2).map(seat => (
                          <button
                            key={seat.id}
                            className={`seat ${seat.status === 'booked' ? 'seat-booked' : selectedSeats.includes(seat.id) ? 'seat-selected' : 'seat-available'}`}
                            onClick={() => seat.status !== 'booked' && toggleSeat(seat.id)}
                            disabled={seat.status === 'booked'}
                            title={seat.label}
                            id={`seat-${seat.id}`}
                          >
                            {seat.label}
                          </button>
                        ))}
                        <div className="seat-aisle" />
                        {row.slice(2).map(seat => (
                          <button
                            key={seat.id}
                            className={`seat ${seat.status === 'booked' ? 'seat-booked' : selectedSeats.includes(seat.id) ? 'seat-selected' : 'seat-available'}`}
                            onClick={() => seat.status !== 'booked' && toggleSeat(seat.id)}
                            disabled={seat.status === 'booked'}
                            title={seat.label}
                            id={`seat-${seat.id}`}
                          >
                            {seat.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <div className="seat-info-note">
                  <FiInfo size={14} />
                  <span>Chọn tối đa <strong>{maxSeats}</strong> ghế. Đã chọn <strong>{selectedSeats.length}</strong> ghế.</span>
                </div>
              </div>
            </div>

            {/* Sidebar summary */}
            <aside className="seat-sidebar">
              <div className="seat-summary-card">
                <h3 className="seat-summary-title">Chi tiết chuyến</h3>

                <div className="seat-trip-info">
                  <div className="sti-row">
                    <span className="sti-label">Tuyến</span>
                    <span className="sti-val">{selectedTrip.route?.from} → {selectedTrip.route?.to}</span>
                  </div>
                  <div className="sti-row">
                    <span className="sti-label">Ngày đi</span>
                    <span className="sti-val">{selectedTrip.date ? new Date(selectedTrip.date + 'T00:00:00').toLocaleDateString('vi-VN') : '—'}</span>
                  </div>
                  <div className="sti-row">
                    <span className="sti-label">Giờ đi</span>
                    <span className="sti-val">{selectedTrip.departureTime} → {selectedTrip.arrivalTime}</span>
                  </div>
                  <div className="sti-row">
                    <span className="sti-label">Loại xe</span>
                    <span className="sti-val">{selectedTrip.busType?.name}</span>
                  </div>
                </div>

                <div className="seat-selected-list">
                  <div className="ssl-header">
                    <span>Ghế đã chọn</span>
                    <span className="ssl-count">{selectedSeats.length}/{maxSeats}</span>
                  </div>
                  {selectedSeats.length === 0 ? (
                    <p className="ssl-empty">Chưa chọn ghế nào</p>
                  ) : (
                    <div className="ssl-seats">
                      {selectedSeats.map(s => (
                        <span key={s} className="ssl-seat-tag">
                          {s}
                          <button onClick={() => toggleSeat(s)} aria-label={`Bỏ chọn ghế ${s}`}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="seat-price-summary">
                  <div className="sps-row">
                    <span>{selectedSeats.length} ghế × {formatPrice(selectedTrip.price)}</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="sps-total">
                    <span>Tổng cộng</span>
                    <span className="sps-total-price">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                  onClick={handleContinue}
                  disabled={selectedSeats.length === 0}
                  id="continue-booking"
                >
                  Tiếp tục <FiArrowRight />
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => navigate(-1)}
                >
                  <FiArrowLeft /> Quay lại
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SeatSelectPage;
