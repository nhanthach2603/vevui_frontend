// pages/SeatSelectPage/SeatSelectPage.jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiArrowLeft, FiInfo } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useBooking } from '../../context/BookingContext';
import { trips, getRoute, getBus, getBusType, generateSeatMap, formatPrice } from '../../services/mockData';
import './SeatSelectPage.css';

const SeatSelectPage = () => {
  const { tripId } = useParams();
  const navigate   = useNavigate();
  const { selectedSeats, selectedTrip, setTrip, toggleSeat, searchParams } = useBooking();

  useEffect(() => {
    if (!selectedTrip || selectedTrip.id !== tripId) {
      const trip = trips.find(t => t.id === tripId);
      if (trip) {
        const bus     = getBus(trip.busId);
        const busType = getBusType(bus?.typeId);
        const route   = getRoute(trip.routeId);
        setTrip({ ...trip, bus, busType, route });
      }
    }
    document.title = 'Chọn ghế | Vé Vui';
  }, [tripId]);

  if (!selectedTrip) {
    return (
      <div className="seat-page">
        <Header />
        <main style={{ paddingTop: '72px', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🚌</div>
            <h2>Không tìm thấy chuyến xe</h2>
            <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop:'1rem' }}>Về trang chủ</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const seatMap = generateSeatMap(selectedTrip.busType, selectedTrip.bookedSeats || []);
  const isSleeper = selectedTrip.busType?.code === 'SLEEPER';
  const maxSeats   = searchParams.passengers || 1;
  const totalPrice = selectedSeats.length * selectedTrip.price;

  const handleContinue = () => {
    if (selectedSeats.length < 1) return;
    navigate(`/dat-ve/${tripId}`);
  };

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

                {/* Render floors for sleeper, single map otherwise */}
                {isSleeper ? (
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
                    <span className="sti-val">{new Date(selectedTrip.date + 'T00:00:00').toLocaleDateString('vi-VN')}</span>
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
                  style={{ width:'100%', padding:'14px', fontSize:'1rem' }}
                  onClick={handleContinue}
                  disabled={selectedSeats.length === 0}
                  id="continue-booking"
                >
                  Tiếp tục <FiArrowRight />
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ width:'100%', marginTop:8 }}
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
