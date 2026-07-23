import { useEffect, useState, useCallback } from 'react';
import { FiCalendar, FiEye, FiCheckCircle, FiSearch, FiRotateCw, FiPrinter } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchCompletedTrips, fetchTripById, fetchTripSeatMap, fetchTicketsByTripId, fetchPickupPointsByCity, formatPrice, confirmTripCompleted } from '../../services/apiService';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';

const parseSeats = (seatsStr) => {
  if (!seatsStr) return [];
  if (Array.isArray(seatsStr)) return seatsStr;
  try { return JSON.parse(seatsStr); } catch { return []; }
};

const SeatMapGrid = ({ seatMapData, bookedSeats, totalSeats, seatsPerRow }) => {
  const bookedSet = new Set(bookedSeats || []);
  if (seatMapData?.seatRows && seatMapData.seatRows.length > 0) {
    const rows = seatMapData.seatRows;
    const cols = rows[0]?.length || 4;
    return (
      <div style={{ background:'var(--gray-50, #f9fafb)', borderRadius:'var(--r-md)', padding:'var(--sp-3)', border:'1px solid var(--gray-200)' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:8, gap:4 }}>
          <span style={{ fontSize:'0.7rem', color:'var(--gray-400)' }}>🚌 Trước xe</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:6, maxWidth:280, margin:'0 auto' }}>
          {rows.map((row, ri) =>
            row.map((seat) => (
              <div key={seat.id} style={{
                width: 36, height: 36, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700,
                background: seat.status === 'booked' ? '#6b7280' : '#f0f9ff',
                color: seat.status === 'booked' ? '#fff' : 'var(--primary)',
                border: seat.status === 'booked' ? '2px solid #6b7280' : '2px dashed var(--primary)',
                cursor: 'default',
              }}>
                {seat.label}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
  const actualTotal = totalSeats || 34;
  const actualPerRow = seatsPerRow || 4;
  const cols2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const rowCount = Math.ceil(actualTotal / actualPerRow);
  return (
    <div style={{ background:'var(--gray-50, #f9fafb)', borderRadius:'var(--r-md)', padding:'var(--sp-3)', border:'1px solid var(--gray-200)' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:8, gap:4 }}>
        <span style={{ fontSize:'0.7rem', color:'var(--gray-400)' }}>🚌 Trước xe</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${actualPerRow}, 1fr)`, gap:6, maxWidth:280, margin:'0 auto' }}>
        {Array.from({ length: rowCount }, (_, r) =>
          Array.from({ length: actualPerRow }, (_, c) => {
            const seatId = `${cols2[r]}${c + 1}`;
            const isBooked = bookedSet.has(seatId);
            return (
              <div key={seatId} style={{
                width: 36, height: 36, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700,
                background: isBooked ? '#6b7280' : '#f0f9ff',
                color: isBooked ? '#fff' : 'var(--primary)',
                border: isBooked ? '2px solid #6b7280' : '2px dashed var(--primary)',
                cursor: 'default',
              }}>
                {seatId}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const CompletedTripsPage = ({ onBack }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDate] = useState('');
  const [detailTrip, setDetailTrip] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTickets, setDetailTickets] = useState([]);
  const [detailSeatMap, setDetailSeatMap] = useState(null);
  const [detailPickupPoints, setDetailPickupPoints] = useState({ pickup: [], dropoff: [] });
  const [confirming, setConfirming] = useState(null);

  useEffect(() => { document.title = 'Chuyến đã hoàn thành | Vé Vui Admin'; }, []);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCompletedTrips(search || undefined, dateFilter || undefined);
      setTrips(Array.isArray(data) ? data : []);
    } catch { setTrips([]); }
    setLoading(false);
  }, [search, dateFilter]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const filtered = trips;

  const openDetail = useCallback(async (t) => {
    setDetailLoading(true);
    setDetailTrip({});
    setDetailTickets([]);
    setDetailSeatMap(null);
    setDetailPickupPoints({ pickup: [], dropoff: [] });
    try {
      const tripData = await fetchTripById(t.id).catch(() => t);
      const fromCity = tripData.route?.fromCity || t.route?.fromCity || '';
      const toCity = tripData.route?.toCity || t.route?.toCity || '';
      const [seatMapData, ticketsData, pickupData, dropoffData] = await Promise.all([
        fetchTripSeatMap(t.id).catch(() => null),
        fetchTicketsByTripId(t.id).catch(() => []),
        fetchPickupPointsByCity(fromCity).catch(() => []),
        fetchPickupPointsByCity(toCity).catch(() => []),
      ]);
      setDetailTrip(tripData);
      setDetailSeatMap(seatMapData);
      setDetailTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setDetailPickupPoints({ pickup: pickupData || [], dropoff: dropoffData || [] });
    } catch { setDetailTrip(t); }
    setDetailLoading(false);
  }, []);

  const handleConfirm = async (tripId) => {
    setConfirming(tripId);
    try {
      const updated = await confirmTripCompleted(tripId);
      setTrips(ts => ts.map(t => t.id === tripId ? { ...t, ...updated } : t));
    } catch (e) { alert('Lỗi: ' + e.message); }
    setConfirming(null);
  };

  const handlePrintTrip = () => {
    const printWindow = window.open('', '_blank');
    const trip = detailTrip;
    const tickets = detailTickets;
    const route = trip.route || {};
    const pp = detailPickupPoints;
    const resolvePointName = (id, type) => {
      if (!id) return '—';
      const list = type === 'pickup' ? pp.pickup : pp.dropoff;
      const found = list.find(p => p.id === id || p.id === Number(id));
      return found ? found.name : `#${id}`;
    };
    let ticketRows = '';
    tickets.forEach(t => {
      const seats = Array.isArray(t.seats) ? t.seats : parseSeats(t.seats);
      ticketRows += `<tr>
        <td>${t.id || ''}</td>
        <td>${t.customerName || ''}</td>
        <td>${t.phone || ''}</td>
        <td>${t.email || ''}</td>
        <td>${seats.join(', ')}</td>
        <td>${resolvePointName(t.pickupPointId, 'pickup')}</td>
        <td>${resolvePointName(t.dropoffPointId, 'dropoff')}</td>
        <td>${t.status || ''}</td>
      </tr>`;
    });
    printWindow.document.write(`
      <html><head><title>In danh sách chuyến - ${route.fromCity} → ${route.toCity}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 13px; }
        h1 { font-size: 18px; margin-bottom: 5px; }
        h2 { font-size: 14px; color: #666; margin-top: 0; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 15px 0; }
        .info div { padding: 4px 0; }
        .info label { font-weight: bold; color: #666; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 11px; color: #999; text-align: center; }
      </style></head><body>
      <h1>DANH SÁCH HÀNH KHÁCH CHUYẾN XE (HOÀN THÀNH)</h1>
      <h2>${route.fromCity || ''} → ${route.toCity || ''}</h2>
      <div class="info">
        <div><label>Ngày chạy:</label> ${trip.tripDate || ''}</div>
        <div><label>Giờ khởi hành:</label> ${trip.departureTime || ''}</div>
        <div><label>Giờ đến:</label> ${trip.arrivalTime || ''}</div>
        <div><label>Giá vé:</label> ${formatPrice(trip.price)}</div>
        <div><label>Xe:</label> ${trip.bus?.plateNumber || ''} (${trip.bus?.busTypeName || ''})</div>
        <div><label>Số ghế:</label> ${trip.bus?.totalSeats ?? 0}</div>
      </div>
      <table>
        <thead><tr><th>Mã vé</th><th>Họ tên</th><th>SĐT</th><th>Email</th><th>Ghế</th><th>Điểm đón</th><th>Điểm trả</th><th>Trạng thái</th></tr></thead>
        <tbody>${ticketRows || '<tr><td colspan="8" style="text-align:center">Chưa có hành khách</td></tr>'}</tbody>
      </table>
      <div class="footer">In ngày: ${new Date().toLocaleString('vi-VN')} | Vé Vui Admin</div>
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <AdminLayout title="Chuyến đã hoàn thành">
      <div className="page-header">
        <div>
          {onBack && (
            <button className="a-btn a-btn-ghost a-btn-sm" onClick={onBack} style={{ display:'flex', alignItems:'center', gap:4, marginBottom:8 }}>
              ← Quay lại Chuyến đi
            </button>
          )}
          <h1 className="page-title">Chuyến đã hoàn thành</h1>
          <p className="page-subtitle">{trips.length} chuyến {loading ? '(đang tải...)' : ''}</p>
        </div>
      </div>

      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-body card-filter-body">
          <div className="filter-bar search-box">
            <SearchInput value={search} onChange={setSearch} placeholder="Tìm tuyến, ngày..." />
          </div>
          <div className="filter-bar filter-group">
            <FiCalendar size={14} style={{ color:'var(--gray-400)' }} />
            <input className="a-input" type="date" value={dateFilter} onChange={e => setDate(e.target.value)} style={{ width:'auto' }} />
            {dateFilter && <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setDate('')}>x</button>}
          </div>
        </div>
      </div>

      <div className="a-card">
        <div className="a-card-scroll">
          <table className="a-table">
            <thead>
              <tr><th>Ngày</th><th>Tuyến</th><th>Giờ đi</th><th>Giờ đến</th><th>Xe</th><th>Giá vé</th><th>Vé đã bán</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:'2rem', color:'var(--gray-400)' }}>
                  <p>Không có chuyến nào đã hoàn thành</p>
                </td></tr>
              )}
              {filtered.map(t => {
                const total = t.bus?.totalSeats || 34;
                const avail = t.availableSeats || 0;
                const sold = total - avail;
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight:700 }}>
                      {t.tripDate ? new Date(t.tripDate + 'T00:00:00').toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}) : '-'}
                    </td>
                    <td>
                      <div style={{ fontWeight:700 }}>{(t.route?.fromCity || '').replace('TP. Ho Chi Minh','HCM')}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>{t.route?.toCity}</div>
                    </td>
                    <td style={{ fontWeight:800, fontSize:'0.95rem' }}>{t.departureTime}</td>
                    <td style={{ fontWeight:800, fontSize:'0.95rem' }}>{t.arrivalTime}</td>
                    <td><code style={{ fontWeight:700, fontSize:'0.82rem' }}>{t.bus?.plateNumber}</code></td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(t.price)}</td>
                    <td style={{ fontWeight:700 }}>{sold}/{total}</td>
                    <td>
                      <span className="a-badge" style={{ background:'#ECFDF5', color:'#059669', fontWeight:700, padding:'4px 10px', borderRadius:999, fontSize:'0.78rem' }}>
                        Hoàn thành
                      </span>
                    </td>
                    <td>
                      <div className="action-row" style={{ display:'flex', gap:4 }}>
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openDetail(t)} title="Xem chi tiết"><FiEye size={14}/></button>
                        <button
                          className="a-btn a-btn-ghost a-btn-sm a-btn-icon"
                          onClick={() => handlePrintTrip()}
                          title="In danh sách"
                          style={{ cursor:'pointer' }}
                        >
                          <FiPrinter size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailTrip && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailTrip(null)}>
          <div className="modal-box" style={{ maxWidth:560 }}>
            <div className="modal-header">
              <div className="modal-title">Chi tiết chuyến đã hoàn thành</div>
              <button className="modal-close" onClick={() => setDetailTrip(null)}>x</button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <p style={{ textAlign:'center', color:'var(--gray-400)', padding:'1rem' }}>Đang tải...</p>
              ) : detailTrip?.id ? (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--sp-4)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span className="a-badge" style={{ background:'#ECFDF5', color:'#059669', fontWeight:700, padding:'4px 10px', borderRadius:999, fontSize:'0.78rem' }}>
                        Hoàn thành
                      </span>
                      <button className="a-btn a-btn-ghost a-btn-sm" onClick={handlePrintTrip} style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <FiPrinter size={14} /> In danh sách
                      </button>
                    </div>
                    <span style={{ fontSize:'0.85rem', color:'var(--gray-400)' }}>ID: {detailTrip.id}</span>
                  </div>
                  <div className="grid-2" style={{ marginBottom:'var(--sp-4)' }}>
                    <div className="a-form-group">
                      <label className="a-label">Tuyến đường</label>
                      <div style={{ fontWeight:700 }}>{detailTrip.route?.fromCity || '—'}</div>
                      <div style={{ fontSize:'0.82rem', color:'var(--gray-400)' }}>{detailTrip.route?.toCity || '—'}</div>
                    </div>
                    <div className="a-form-group">
                      <label className="a-label">Ngày chạy</label>
                      <div style={{ fontWeight:700 }}>{detailTrip.tripDate ? new Date(detailTrip.tripDate + 'T00:00:00').toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}) : '—'}</div>
                    </div>
                    <div className="a-form-group">
                      <label className="a-label">Giờ khởi hành</label>
                      <div style={{ fontWeight:700 }}>{detailTrip.departureTime || '—'}</div>
                    </div>
                    <div className="a-form-group">
                      <label className="a-label">Giờ đến</label>
                      <div style={{ fontWeight:700 }}>{detailTrip.arrivalTime || '—'}</div>
                    </div>
                    <div className="a-form-group">
                      <label className="a-label">Giá vé</label>
                      <div style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(detailTrip.price)}</div>
                    </div>
                    <div className="a-form-group">
                      <label className="a-label">Ghế đã bán</label>
                      <div style={{ fontWeight:700 }}>{(detailTrip.bus?.totalSeats || 34) - (detailTrip.availableSeats || 0)} / {detailTrip.bus?.totalSeats || 34}</div>
                    </div>
                  </div>
                  <div style={{ borderTop:'1px solid var(--gray-200)', paddingTop:'var(--sp-4)' }}>
                    <div style={{ fontWeight:700, marginBottom:'var(--sp-2)' }}>Thông tin xe</div>
                    <div className="grid-2">
                      <div>
                        <span style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>Biển số: </span>
                        <code style={{ fontWeight:700 }}>{detailTrip.bus?.plateNumber || '—'}</code>
                      </div>
                      <div>
                        <span style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>Loại xe: </span>
                        <span className="a-badge a-badge-blue">{detailTrip.bus?.busTypeName || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop:'1px solid var(--gray-200)', paddingTop:'var(--sp-4)', marginTop:'var(--sp-4)' }}>
                    <div style={{ fontWeight:700, marginBottom:'var(--sp-3)' }}>Sơ đồ ghế ({detailTickets.length} vé)</div>
                    <SeatMapGrid
                      seatMapData={detailSeatMap}
                      bookedSeats={detailTrip.bookedSeats || []}
                      totalSeats={detailTrip.bus?.totalSeats || 34}
                      seatsPerRow={4}
                    />
                  </div>
                </div>
              ) : (
                <p style={{ textAlign:'center', color:'var(--gray-400)', padding:'1rem' }}>Không có dữ liệu</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDetailTrip(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CompletedTripsPage;
