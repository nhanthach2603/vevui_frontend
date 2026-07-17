// pages/TripsPage/TripsPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiEye, FiChevronDown, FiActivity, FiCheckCircle, FiXCircle, FiPrinter, FiMapPin, FiClock } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchTrips, createTrip, batchCreateTrips, updateTrip, deleteTrip, fetchPublicRoutes, fetchPublicBuses, formatPrice, fetchTripById, updateTripStatus, fetchTripStats, fetchTicketsByTripId, fetchTripSeatMap, createTicketAdmin, fetchPickupPointsByCity, fetchPickupPoints, fetchTripPickupPoints, saveTripPickupPoints } from '../../services/apiService';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import PickupPointsPage from '../PickupPointsPage/PickupPointsPage';

const STATUS_OPTIONS = [
  ['SCHEDULED', 'Đã đặt lịch'],
  ['CANCELLED', 'Đã hủy'],
  ['COMPLETED', 'Hoàn thành'],
];

const REAL_TIME_STATUS_MAP = {
  SCHEDULED:      { label: 'Đã đặt lịch', bg: '#f0f9ff', color: '#0369a1' },
  PREPARING:      { label: 'Sắp xuất phát', bg: '#ECFDF5', color: '#059669' },
  DEPARTING_NOW:  { label: 'Sắp khởi hành', bg: '#ECFDF5', color: '#059669' },
  IN_PROGRESS:    { label: 'Trên hành trình', bg: '#FEF9C3', color: '#D97706' },
  COMPLETED:      { label: 'Hoàn thành', bg: '#ECFDF5', color: '#059669' },
  CANCELLED:      { label: 'Đã hủy', bg: '#FEF2F2', color: '#DC2626' },
  MISSED:         { label: 'Bỏ lỡ', bg: '#FEF2F2', color: '#DC2626' },
};

const RealTimeStatusBadge = ({ status }) => {
  const s = REAL_TIME_STATUS_MAP[status] || { label: status, bg: '#f3f4f6', color: '#374151' };
  return (
    <span className="a-badge" style={{ background: s.bg, color: s.color, fontWeight: 700, padding: '4px 10px', borderRadius: 999, fontSize: '0.78rem', border: `1px solid ${s.color}20` }}>
      {s.label}
    </span>
  );
};

const parseSeats = (seatsStr) => {
  if (!seatsStr) return [];
  if (Array.isArray(seatsStr)) return seatsStr;
  try { return JSON.parse(seatsStr); } catch { return []; }
};

const SeatMapGrid = ({ seatMapData, bookedSeats, totalSeats, seatsPerRow, onSeatClick }) => {
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
              <div
                key={seat.id}
                onClick={() => onSeatClick(seat.id)}
                style={{
                  width: 36, height: 36, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700,
                  background: seat.status === 'booked' ? 'var(--primary)' : '#f0f9ff',
                  color: seat.status === 'booked' ? '#fff' : 'var(--primary)',
                  border: seat.status === 'booked' ? '2px solid var(--primary)' : '2px dashed var(--primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: seat.status === 'booked' ? '0 2px 4px rgba(var(--primary-rgb,59,130,246),0.3)' : 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; if (seat.status !== 'booked') e.currentTarget.style.background = '#dbeafe'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; if (seat.status !== 'booked') e.currentTarget.style.background = '#f0f9ff'; }}
                title={seat.status === 'booked' ? `${seat.label} — Đã đặt` : `${seat.label} — Trống (nhấn để đặt)`}
              >
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
              <div
                key={seatId}
                onClick={() => onSeatClick(seatId)}
                style={{
                  width: 36, height: 36, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700,
                  background: isBooked ? 'var(--primary)' : '#f0f9ff',
                  color: isBooked ? '#fff' : 'var(--primary)',
                  border: isBooked ? '2px solid var(--primary)' : '2px dashed var(--primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; if (!isBooked) e.currentTarget.style.background = '#dbeafe'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; if (!isBooked) e.currentTarget.style.background = '#f0f9ff'; }}
                title={isBooked ? `${seatId} — Đã đặt` : `${seatId} — Trống (nhấn để đặt)`}
              >
                {seatId}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const TripsPage = () => {
  const [trips, setTrips]       = useState([]);
  const [routes, setRoutes]     = useState([]);
  const [buses, setBuses]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [dateFilter, setDate]   = useState('');
  const [showModal, setModal]   = useState(false);
  const [editItem, setEdit]     = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ routeId:'', busId:'', tripDate:'', departureTime:'06:00', arrivalTime:'12:00', price:'' });
  const [stats, setStats]       = useState({ total: 0, active: 0, cancelled: 0 });
  const [detailTrip, setDetailTrip]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTickets, setDetailTickets] = useState([]);
  const [detailSeatMap, setDetailSeatMap] = useState(null);
  const [seatTicketPopup, setSeatTicketPopup] = useState(null);
  const [statusDropdown, setStatusDropdown] = useState(null);
  const [statusLoading, setStatusLoading]   = useState(null);
  const [detailPickupPoints, setDetailPickupPoints] = useState({ pickup: [], dropoff: [] });
  const [seatBookingModal, setSeatBookingModal] = useState(null);
  const [seatBookingForm, setSeatBookingForm] = useState({ customerName:'', phone:'', email:'', pickupPointId:'', dropoffPointId:'' });
  const [seatBookingSaving, setSeatBookingSaving] = useState(false);
  const [pickupPoints, setPickupPoints] = useState({ pickup: [], dropoff: [] });
  const [tripPickupPoints, setTripPickupPoints] = useState({ pickupPointIds: [], dropoffPointIds: [] });
  const [allPickupPoints, setAllPickupPoints] = useState([]);
  const [showPickupPointsPage, setShowPickupPointsPage] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ routeId:'', busId:'', price:'', month:'', datesText:'' });
  const [bulkTimeSlots, setBulkTimeSlots] = useState([{ departureTime:'06:00', arrivalTime:'12:00' }]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);

  useEffect(() => { document.title = 'Chuyến đi | vé Vui Admin'; }, []);

  useEffect(() => {
    if (statusDropdown === null) return;
    const handleClick = () => setStatusDropdown(null);
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', handleClick); };
  }, [statusDropdown]);

  const loadTrips = useCallback(async () => {
    try {
      const [tripsData, routesData, busesData, statsData, allPointsData] = await Promise.all([
        fetchTrips().catch(() => null),
        fetchPublicRoutes().catch(() => null),
        fetchPublicBuses().catch(() => null),
        fetchTripStats().catch(() => null),
        fetchPickupPoints().catch(() => []),
      ]);
      if (tripsData?.content) setTrips(tripsData.content);
      if (Array.isArray(routesData)) setRoutes(routesData);
      if (Array.isArray(busesData)) setBuses(busesData);
      if (statsData) setStats({ total: statsData.total ?? 0, scheduled: statsData.scheduled ?? 0, departed: statsData.departed ?? 0, cancelled: statsData.cancelled ?? 0 });
      if (Array.isArray(allPointsData)) setAllPickupPoints(allPointsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const filtered = trips.filter(t => {
    const matchSearch = !search ||
      (t.route?.fromCity || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.route?.toCity || '').toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || t.tripDate === dateFilter;
    return matchSearch && matchDate;
  });

  const computedStats = {
    total: stats.total || trips.length,
    scheduled: trips.filter(t => t.realTimeStatus === 'SCHEDULED' || t.realTimeStatus === 'PREPARING').length,
    departed: trips.filter(t => t.realTimeStatus === 'IN_PROGRESS' || t.realTimeStatus === 'DEPARTING_NOW').length,
    cancelled: stats.cancelled || trips.filter(t => t.status === 'CANCELLED').length,
  };

  const openAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setEdit(null);
    setForm({ routeId: routes[0]?.id || '', busId: buses[0]?.id || '', tripDate: today, departureTime:'06:00', arrivalTime:'12:00', price:'', defaultPickup:'', defaultDropoff:'' });
    setTripPickupPoints({ pickupPointIds: [], dropoffPointIds: [] });
    setModal(true);
  };

  const openEdit = async (t) => {
    setEdit(t);
    setForm({ routeId: t.route?.id || t.routeId, busId: t.bus?.id || t.busId, tripDate: t.tripDate, departureTime: t.departureTime, arrivalTime: t.arrivalTime, price: t.price, defaultPickup: t.defaultPickup || '', defaultDropoff: t.defaultDropoff || '' });
    try {
      const tripPoints = await fetchTripPickupPoints(t.id).catch(() => []);
      setTripPickupPoints({
        pickupPointIds: (Array.isArray(tripPoints) ? tripPoints : []).filter(p => p.role === 'PICKUP').map(p => p.pickupPointId),
        dropoffPointIds: (Array.isArray(tripPoints) ? tripPoints : []).filter(p => p.role === 'DROPOFF').map(p => p.pickupPointId),
      });
    } catch { setTripPickupPoints({ pickupPointIds: [], dropoffPointIds: [] }); }
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.tripDate || !form.price) return;
    setSaving(true);
    const body = { routeId: +form.routeId, busId: +form.busId, tripDate: form.tripDate, departureTime: form.departureTime, arrivalTime: form.arrivalTime, price: +form.price };
    try {
      let savedTrip;
      if (editItem) {
        savedTrip = await updateTrip(editItem.id, body);
        setTrips(ts => ts.map(t => t.id === editItem.id ? savedTrip : t));
      } else {
        savedTrip = await createTrip(body);
        setTrips(ts => [...ts, savedTrip]);
      }
      await saveTripPickupPoints(savedTrip.id, tripPickupPoints);
      setModal(false);
    } catch (e) { alert('Lỗi: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTrip(id);
      setTrips(ts => ts.filter(t => t.id !== id));
    } catch (e) { alert('Lỗi: ' + e.message); }
    setDeleteId(null);
  };

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
    } catch (e) {
      setDetailTrip(t);
    }
    setDetailLoading(false);
  }, []);

  const handleStatusChange = async (tripId, newStatus) => {
    setStatusLoading(tripId);
    try {
      const updated = await updateTripStatus(tripId, newStatus);
      setTrips(ts => ts.map(t => t.id === tripId ? { ...t, ...updated } : t));
      setStatusDropdown(null);
    } catch (e) { alert('Lỗi: ' + e.message); }
    setStatusLoading(null);
  };

  const handleSeatBooking = async () => {
    if (!seatBookingForm.customerName || !seatBookingForm.phone) {
      alert('Vui lòng nhập tên và số điện thoại');
      return;
    }
    setSeatBookingSaving(true);
    try {
      const trip = seatBookingModal.trip;
      const body = {
        tripId: trip.id,
        customerId: null,
        customerName: seatBookingForm.customerName,
        phone: seatBookingForm.phone,
        email: seatBookingForm.email || '',
        seats: [seatBookingModal.seatId],
        pickupPointId: seatBookingForm.pickupPointId ? Number(seatBookingForm.pickupPointId) : null,
        dropoffPointId: seatBookingForm.dropoffPointId ? Number(seatBookingForm.dropoffPointId) : null,
        totalPrice: trip.price || 0,
        paymentMethod: 'CASH',
        couponCode: null,
        fromCity: trip.route?.fromCity || '',
        toCity: trip.route?.toCity || '',
        tripDate: trip.tripDate || '',
        departureTime: trip.departureTime || '',
        arrivalTime: trip.arrivalTime || '',
        skipLock: false,
      };
      await createTicketAdmin(body);
      alert('Đặt vé thành công cho ghế ' + seatBookingModal.seatId);
      setSeatBookingModal(null);
      openDetail(trip);
    } catch (e) {
      alert('Lỗi đặt vé: ' + e.message);
    }
    setSeatBookingSaving(false);
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
      <h1>DANH SÁCH HÀNH KHÁCH CHUYẾN XE</h1>
      <h2>${route.fromCity || ''} → ${route.toCity || ''}</h2>
      <div class="info">
        <div><label>Ngày chạy:</label> ${trip.tripDate || ''}</div>
        <div><label>Giờ khởi hành:</label> ${trip.departureTime || ''}</div>
        <div><label>Giờ đến:</label> ${trip.arrivalTime || ''}</div>
        <div><label>Giá vé:</label> ${formatPrice(trip.price)}</div>
        <div><label>Xe:</label> ${trip.bus?.plateNumber || ''} (${trip.bus?.busTypeName || ''})</div>
        <div><label>Số ghế trống:</label> ${trip.availableSeats ?? 0} / ${trip.bus?.totalSeats ?? 0}</div>
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

  const parseBulkDates = (text, month) => {
    if (!text || !month) return [];
    const [year, monthNum] = month.split('-').map(Number);
    const days = text.split(/[,;\s]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 31);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    return days.filter(d => d <= daysInMonth).map(d => {
      const mm = String(monthNum).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    });
  };

  const addTimeSlot = () => setBulkTimeSlots(prev => [...prev, { departureTime:'13:00', arrivalTime:'19:00' }]);
  const removeTimeSlot = (idx) => setBulkTimeSlots(prev => prev.filter((_, i) => i !== idx));
  const updateTimeSlot = (idx, field, val) => setBulkTimeSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));

  useEffect(() => {
    if (!showBulkModal) return;
    const dates = parseBulkDates(bulkForm.datesText, bulkForm.month);
    if (dates.length === 0 || bulkTimeSlots.length === 0 || !bulkForm.routeId || !bulkForm.busId || !bulkForm.price) {
      setBulkPreview([]);
      return;
    }
    const trips = [];
    for (const dateStr of dates) {
      for (const slot of bulkTimeSlots) {
        trips.push({ tripDate: dateStr, routeId: +bulkForm.routeId, busId: +bulkForm.busId, departureTime: slot.departureTime, arrivalTime: slot.arrivalTime, price: +bulkForm.price });
      }
    }
    setBulkPreview(trips);
  }, [showBulkModal, bulkForm, bulkTimeSlots]);

  const handleBulkCreate = async () => {
    if (bulkPreview.length === 0) return;
    setBulkSaving(true);
    try {
      const result = await batchCreateTrips({ trips: bulkPreview });
      alert(`Đã tạo thành công ${result.created} chuyến${result.failed > 0 ? `. ${result.failed} chuyến lỗi: ${result.errors?.join('; ')}` : ''}`);
      setShowBulkModal(false);
      setBulkPreview([]);
      loadTrips();
    } catch (e) { alert('Lỗi: ' + e.message); }
    setBulkSaving(false);
  };

  const openBulkModal = () => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    setBulkForm({ routeId: routes[0]?.id || '', busId: buses[0]?.id || '', price: routes[0]?.basePrice || '', month: `${today.getFullYear()}-${mm}`, datesText: '' });
    setBulkTimeSlots([{ departureTime: '06:00', arrivalTime: '12:00' }]);
    setBulkPreview([]);
    setShowBulkModal(true);
  };

  return (
    <AdminLayout title="Chuyến đi">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý chuyến đi</h1>
          <p className="page-subtitle">{trips.length} chuyến {loading ? '(đang tải...)' : ''}</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="a-btn a-btn-ghost" onClick={() => setShowPickupPointsPage(true)} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <FiMapPin size={15}/> Điểm đón/trả
          </button>
          <button className="a-btn a-btn-ghost" onClick={openBulkModal} style={{ display:'flex', alignItems:'center', gap:6 }} id="bulk-trip">
            <FiClock size={15}/> Tạo hàng loạt
          </button>
          <button className="a-btn a-btn-primary" onClick={openAdd} id="add-trip">
            <FiPlus size={15}/> Thêm chuyến
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid stats-grid-4">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background:'var(--primary-bg)', color:'var(--primary)' }}>
            <FiActivity />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Tổng chuyến</div>
            <div className="stat-card-value">{computedStats.total}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background:'#ECFDF5', color:'var(--success)' }}>
            <FiCheckCircle />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Chưa xuất phát</div>
            <div className="stat-card-value" style={{ color:'var(--success)' }}>{computedStats.scheduled}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background:'#FEF9C3', color:'#D97706' }}>
            <FiCalendar />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Đang chạy</div>
            <div className="stat-card-value" style={{ color:'#D97706' }}>{computedStats.departed}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background:'#FEF2F2', color:'var(--danger)' }}>
            <FiXCircle />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Đã hủy</div>
            <div className="stat-card-value" style={{ color:'var(--danger)' }}>{computedStats.cancelled}</div>
          </div>
        </div>
      </div>

      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-body card-filter-body">
          <div className="filter-bar search-box">
            <SearchInput value={search} onChange={setSearch} placeholder="Tìm tuyến..." />
          </div>
          <div className="filter-bar filter-group">
            <FiCalendar size={14} style={{ color:'var(--gray-400)' }} />
            <input className="a-input" type="date" value={dateFilter} onChange={e=>setDate(e.target.value)} id="trip-date-filter" style={{ width:'auto' }} />
            {dateFilter && <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setDate('')}>x</button>}
          </div>
        </div>
      </div>

      <div className="a-card">
        <div className="a-card-scroll">
          <table className="a-table">
            <thead>
              <tr><th>Ngày</th><th>Tuyến</th><th>Giờ đi</th><th>Xe</th><th>Loại xe</th><th>Giá vé</th><th>Còn trống</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:'2rem', color:'var(--gray-400)' }}>
                  <p>Không tìm thấy chuyến xe phù hợp</p>
                </td></tr>
              )}
              {filtered.map(t => {
                const total = t.bus?.totalSeats || 34;
                const avail = t.availableSeats || 0;
                const booked = total - avail;
                const pct = Math.round((booked / total) * 100);
                const rtStatus = t.realTimeStatus || t.status;
                const rowBg = (rtStatus === 'PREPARING' || rtStatus === 'DEPARTING_NOW') ? '#ECFDF5' : rtStatus === 'IN_PROGRESS' ? '#FEF9C3' : undefined;
                return (
                  <tr key={t.id} style={rowBg ? { background: rowBg } : undefined}>
                    <td style={{ fontWeight:700 }}>
                      {t.tripDate ? new Date(t.tripDate + 'T00:00:00').toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}) : '-'}
                    </td>
                    <td>
                      <div style={{ fontWeight:700 }}>{(t.route?.fromCity || '').replace('TP. Ho Chi Minh','HCM')}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>{t.route?.toCity}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight:800, fontSize:'1rem' }}>{t.departureTime}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>{t.arrivalTime}</div>
                    </td>
                    <td><code style={{ fontWeight:700, fontSize:'0.82rem' }}>{t.bus?.plateNumber}</code></td>
                    <td><span className="a-badge a-badge-blue">{t.bus?.busTypeName}</span></td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(t.price)}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:100 }}>
                        <div style={{ flex:1, height:6, background:'var(--gray-100)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background: pct>80?'var(--danger)':pct>50?'var(--warning)':'var(--success)', transition:'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize:'0.78rem', fontWeight:700, whiteSpace:'nowrap' }}>{avail}/{total}</span>
                      </div>
                    </td>
                    <td><RealTimeStatusBadge status={t.realTimeStatus || t.status} /></td>
                    <td>
                      <div className="action-row" style={{ position:'relative' }}>
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openDetail(t)} title="Xem chi tiết" id={`detail-trip-${t.id}`}><FiEye size={14}/></button>
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openEdit(t)} title="Chỉnh sửa" id={`edit-trip-${t.id}`}><FiEdit2 size={14}/></button>
                        <div style={{ position:'relative' }}>
                          <button
                            className="a-btn a-btn-ghost a-btn-sm a-btn-icon"
                            onClick={() => setStatusDropdown(statusDropdown === t.id ? null : t.id)}
                            disabled={statusLoading === t.id}
                            title="Đổi trạng thái"
                            id={`status-trip-${t.id}`}
                          >
                            <FiChevronDown size={14}/>
                          </button>
                          {statusDropdown === t.id && (
                            <div style={{ position:'absolute', right:0, top:'100%', background:'#fff', border:'1px solid var(--gray-200)', borderRadius:'var(--r-sm)', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', zIndex:20, minWidth:160, padding:4 }}>
                              {STATUS_OPTIONS.filter(([s]) => s !== t.status).map(([s, label]) => (
                                <button key={s} className="a-btn a-btn-ghost a-btn-sm" style={{ display:'block', width:'100%', textAlign:'left', padding:'6px 12px', borderRadius:4, fontSize:'0.82rem' }} onClick={() => handleStatusChange(t.id, s)}>
                                  <StatusBadge status={s} />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setDeleteId(t.id)} style={{ color:'var(--danger)' }} title="Xóa" id={`delete-trip-${t.id}`}><FiTrash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Chỉnh sửa chuyến' : 'Thêm chuyến mới'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Tuyến đường *</label>
                  <select className="a-input a-select" value={form.routeId} onChange={e=>setForm(f=>({...f,routeId:e.target.value}))} id="trip-route">
                    {routes.map(r => <option key={r.id} value={r.id}>{r.fromCity} - {r.toCity}</option>)}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Xe *</label>
                  <select className="a-input a-select" value={form.busId} onChange={e=>setForm(f=>({...f,busId:e.target.value}))} id="trip-bus">
                    {buses.filter(b => b.status === 'ACTIVE').map(b => (
                      <option key={b.id} value={b.id}>{b.plateNumber} - {b.busTypeName}</option>
                    ))}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Ngày chạy *</label>
                  <input className="a-input" type="date" value={form.tripDate} onChange={e=>setForm(f=>({...f,tripDate:e.target.value}))} id="trip-date" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Giá vé (đ) *</label>
                  <input className="a-input" type="number" placeholder="180000" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} id="trip-price" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Giờ khởi hành</label>
                  <input className="a-input" type="time" value={form.departureTime} onChange={e=>setForm(f=>({...f,departureTime:e.target.value}))} id="trip-depart" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Giờ đến</label>
                  <input className="a-input" type="time" value={form.arrivalTime} onChange={e=>setForm(f=>({...f,arrivalTime:e.target.value}))} id="trip-arrive" />
                </div>
              </div>
              <div className="a-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="a-label">Điểm đón (chọn nhiều)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, maxHeight:120, overflowY:'auto', padding:'var(--sp-2)', background:'var(--gray-50)', borderRadius:'var(--r-sm)', border:'1px solid var(--gray-200)' }}>
                  {allPickupPoints.filter(p => p.type === 'PICKUP' || p.type === 'BOTH').map(p => (
                    <label key={p.id} style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem', padding:'4px 8px', borderRadius:4, background: tripPickupPoints.pickupPointIds.includes(p.id) ? 'var(--primary-bg)' : '#fff', border:'1px solid var(--gray-200)', cursor:'pointer' }}>
                      <input
                        type="checkbox"
                        checked={tripPickupPoints.pickupPointIds.includes(p.id)}
                        onChange={e => {
                          setTripPickupPoints(f => ({
                            ...f,
                            pickupPointIds: e.target.checked
                              ? [...f.pickupPointIds, p.id]
                              : f.pickupPointIds.filter(id => id !== p.id)
                          }));
                        }}
                        style={{ margin:0 }}
                      />
                      <span>{p.name}</span>
                      <span style={{ fontSize:'0.7rem', color:'var(--gray-400)' }}>({p.city})</span>
                    </label>
                  ))}
                  {allPickupPoints.filter(p => p.type === 'PICKUP' || p.type === 'BOTH').length === 0 && (
                    <span style={{ fontSize:'0.8rem', color:'var(--gray-400)' }}>Chưa có điểm đón nào</span>
                  )}
                </div>
              </div>

              <div className="a-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="a-label">Điểm trả (chọn nhiều)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, maxHeight:120, overflowY:'auto', padding:'var(--sp-2)', background:'var(--gray-50)', borderRadius:'var(--r-sm)', border:'1px solid var(--gray-200)' }}>
                  {allPickupPoints.filter(p => p.type === 'DROPOFF' || p.type === 'BOTH').map(p => (
                    <label key={p.id} style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem', padding:'4px 8px', borderRadius:4, background: tripPickupPoints.dropoffPointIds.includes(p.id) ? 'var(--primary-bg)' : '#fff', border:'1px solid var(--gray-200)', cursor:'pointer' }}>
                      <input
                        type="checkbox"
                        checked={tripPickupPoints.dropoffPointIds.includes(p.id)}
                        onChange={e => {
                          setTripPickupPoints(f => ({
                            ...f,
                            dropoffPointIds: e.target.checked
                              ? [...f.dropoffPointIds, p.id]
                              : f.dropoffPointIds.filter(id => id !== p.id)
                          }));
                        }}
                        style={{ margin:0 }}
                      />
                      <span>{p.name}</span>
                      <span style={{ fontSize:'0.7rem', color:'var(--gray-400)' }}>({p.city})</span>
                    </label>
                  ))}
                  {allPickupPoints.filter(p => p.type === 'DROPOFF' || p.type === 'BOTH').length === 0 && (
                    <span style={{ fontSize:'0.8rem', color:'var(--gray-400)' }}>Chưa có điểm trả nào</span>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSave} disabled={saving} id="save-trip">{saving ? 'Đang lưu...' : 'Lưu chuyến'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header"><div className="modal-title">Xác nhận xóa</div><button className="modal-close" onClick={() => setDeleteId(null)}>x</button></div>
            <div className="modal-body"><p>Xóa chuyến này sẽ ảnh hưởng đến vé đã đặt. Chắc chắn tiếp tục?</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDelete(deleteId)} id="confirm-delete-trip">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailTrip && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailTrip(null)}>
          <div className="modal-box" style={{ maxWidth:560 }}>
            <div className="modal-header">
              <div className="modal-title">Chi tiết chuyến đi</div>
              <button className="modal-close" onClick={() => setDetailTrip(null)}>x</button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <p style={{ textAlign:'center', color:'var(--gray-400)', padding:'1rem' }}>Đang tải...</p>
              ) : detailTrip?.id ? (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--sp-4)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <StatusBadge status={detailTrip.status} />
                      <button className="a-btn a-btn-ghost a-btn-sm" onClick={handlePrintTrip} style={{ display:'flex', alignItems:'center', gap:4 }} id="print-trip">
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
                      <label className="a-label">Còn trống</label>
                      <div style={{ fontWeight:700 }}>{detailTrip.availableSeats ?? 0} / {detailTrip.bus?.totalSeats ?? 34}</div>
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

                  {/* Sơ đồ ghế */}
                  <div style={{ borderTop:'1px solid var(--gray-200)', paddingTop:'var(--sp-4)', marginTop:'var(--sp-4)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--sp-3)' }}>
                      <div style={{ fontWeight:700 }}>Sơ đồ ghế đã đặt ({detailTickets.length} vé)</div>
                      <div style={{ display:'flex', gap:12, fontSize:'0.75rem' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:3, background:'#f0f9ff', border:'2px dashed var(--primary)', display:'inline-block' }}/>Trống</span>
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:3, background:'var(--primary)', display:'inline-block' }}/>Đã đặt</span>
                      </div>
                    </div>
                    <SeatMapGrid
                      seatMapData={detailSeatMap}
                      bookedSeats={detailTrip.bookedSeats || []}
                      totalSeats={detailTrip.bus?.totalSeats || 34}
                      seatsPerRow={4}
                      onSeatClick={async (seatId) => {
                        const ticket = detailTickets.find(t => {
                          const seats = Array.isArray(t.seats) ? t.seats : parseSeats(t.seats);
                          return seats.includes(seatId);
                        });
                        if (ticket) {
                          setSeatTicketPopup(ticket);
                        } else {
                          setSeatBookingModal({ seatId, trip: detailTrip });
                          setSeatBookingForm({ customerName:'', phone:'', email:'', pickupPointId:'', dropoffPointId:'' });
                          try {
                            const tripPoints = await fetchTripPickupPoints(detailTrip.id).catch(() => []);
                            setPickupPoints({
                              pickup: (Array.isArray(tripPoints) ? tripPoints : []).filter(p => p.role === 'PICKUP'),
                              dropoff: (Array.isArray(tripPoints) ? tripPoints : []).filter(p => p.role === 'DROPOFF'),
                            });
                          } catch { setPickupPoints({ pickup: [], dropoff: [] }); }
                        }
                      }}
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
      {/* SEAT BOOKING MODAL */}
      {seatBookingModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSeatBookingModal(null)}>
          <div className="modal-box" style={{ maxWidth:480 }}>
            <div className="modal-header">
              <div className="modal-title">Đặt vé cho ghế {seatBookingModal.seatId}</div>
              <button className="modal-close" onClick={() => setSeatBookingModal(null)}>x</button>
            </div>
            <div className="modal-body">
              <div style={{ background:'var(--primary-bg)', borderRadius:'var(--r-sm)', padding:'var(--sp-3)', marginBottom:'var(--sp-4)' }}>
                <div style={{ fontSize:'0.85rem', fontWeight:700 }}>Chuyến: {seatBookingModal.trip?.route?.fromCity} → {seatBookingModal.trip?.route?.toCity}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--gray-500)' }}>{seatBookingModal.trip?.tripDate} | {seatBookingModal.trip?.departureTime} | {formatPrice(seatBookingModal.trip?.price)}</div>
              </div>
              <div className="a-form-group">
                <label className="a-label">Họ tên khách *</label>
                <input className="a-input" value={seatBookingForm.customerName} onChange={e => setSeatBookingForm(f => ({...f, customerName: e.target.value}))} placeholder="Nguyễn Văn A" id="booking-customer-name" />
              </div>
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Số điện thoại *</label>
                  <input className="a-input" value={seatBookingForm.phone} onChange={e => setSeatBookingForm(f => ({...f, phone: e.target.value}))} placeholder="0912345678" id="booking-customer-phone" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Email</label>
                  <input className="a-input" value={seatBookingForm.email} onChange={e => setSeatBookingForm(f => ({...f, email: e.target.value}))} placeholder="email@example.com" id="booking-customer-email" />
                </div>
              </div>
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Điểm đón</label>
                  <select className="a-input a-select" value={seatBookingForm.pickupPointId} onChange={e => setSeatBookingForm(f => ({...f, pickupPointId: e.target.value}))} id="booking-pickup">
                    <option value="">-- Chọn điểm đón --</option>
                    {(pickupPoints.pickup || []).map(p => <option key={p.pickupPointId || p.id} value={p.pickupPointId || p.id}>{p.pickupPointName || p.name} ({p.timeOffset})</option>)}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Điểm trả</label>
                  <select className="a-input a-select" value={seatBookingForm.dropoffPointId} onChange={e => setSeatBookingForm(f => ({...f, dropoffPointId: e.target.value}))} id="booking-dropoff">
                    <option value="">-- Chọn điểm trả --</option>
                    {(pickupPoints.dropoff || []).map(p => <option key={p.pickupPointId || p.id} value={p.pickupPointId || p.id}>{p.pickupPointName || p.name} ({p.timeOffset})</option>)}
                  </select>
                </div>
              </div>
              <div style={{ background:'#f0fdf4', borderRadius:'var(--r-sm)', padding:'var(--sp-3)', marginTop:'var(--sp-3)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                  <span>Tổng tiền:</span>
                  <span style={{ color:'var(--primary)' }}>{formatPrice(seatBookingModal.trip?.price)}</span>
                </div>
                <div style={{ fontSize:'0.8rem', color:'var(--gray-500)', marginTop:4 }}>Thanh toán tại chỗ (CASH)</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setSeatBookingModal(null)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSeatBooking} disabled={seatBookingSaving} id="confirm-seat-booking">
                {seatBookingSaving ? 'Đang đặt...' : 'Đặt vé'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TICKET DETAIL POPUP */}
      {seatTicketPopup && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSeatTicketPopup(null)}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header">
              <div className="modal-title">Thông tin vé</div>
              <button className="modal-close" onClick={() => setSeatTicketPopup(null)}>x</button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap:'var(--sp-3)' }}>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Mã vé</div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{seatTicketPopup.id}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Trạng thái</div>
                  <StatusBadge status={seatTicketPopup.status} />
                </div>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Họ tên</div>
                  <div style={{ fontWeight:700 }}>{seatTicketPopup.customerName}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Số điện thoại</div>
                  <div style={{ fontWeight:700 }}>{seatTicketPopup.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Email</div>
                  <div style={{ fontWeight:700 }}>{seatTicketPopup.email}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Ghế đã đặt</div>
                  <div style={{ fontWeight:700 }}>{(Array.isArray(seatTicketPopup.seats) ? seatTicketPopup.seats : parseSeats(seatTicketPopup.seats)).join(', ')}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Điểm đón</div>
                  <div style={{ fontWeight:700 }}>{(() => {
                    const id = seatTicketPopup.pickupPointId;
                    if (!id) return '—';
                    const found = detailPickupPoints.pickup.find(p => p.id === id || p.id === Number(id));
                    return found ? found.name : `#${id}`;
                  })()}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Điểm trả</div>
                  <div style={{ fontWeight:700 }}>{(() => {
                    const id = seatTicketPopup.dropoffPointId;
                    if (!id) return '—';
                    const found = detailPickupPoints.dropoff.find(p => p.id === id || p.id === Number(id));
                    return found ? found.name : `#${id}`;
                  })()}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Tổng tiền</div>
                  <div style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(seatTicketPopup.totalPrice)}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Phương thức thanh toán</div>
                  <div style={{ fontWeight:700 }}>{seatTicketPopup.paymentMethod || '—'}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setSeatTicketPopup(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
      {showPickupPointsPage && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'#fff', overflow:'auto' }}>
          <PickupPointsPage onBack={() => { setShowPickupPointsPage(false); loadTrips(); }} />
        </div>
      )}
      {/* BULK CREATE MODAL */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBulkModal(false)}>
          <div className="modal-box" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div className="modal-title">Tạo chuyến hàng loạt</div>
              <button className="modal-close" onClick={() => setShowBulkModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Tuyến đường *</label>
                  <select className="a-input a-select" value={bulkForm.routeId} onChange={e => setBulkForm(f => ({ ...f, routeId: e.target.value }))} id="bulk-route">
                    {routes.map(r => <option key={r.id} value={r.id}>{r.fromCity} - {r.toCity}</option>)}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Xe *</label>
                  <select className="a-input a-select" value={bulkForm.busId} onChange={e => setBulkForm(f => ({ ...f, busId: e.target.value }))} id="bulk-bus">
                    {buses.filter(b => b.status === 'ACTIVE').map(b => (
                      <option key={b.id} value={b.id}>{b.plateNumber} - {b.busTypeName}</option>
                    ))}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Tháng *</label>
                  <input className="a-input" type="month" value={bulkForm.month} onChange={e => setBulkForm(f => ({ ...f, month: e.target.value }))} id="bulk-month" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Giá vé (đ) *</label>
                  <input className="a-input" type="number" placeholder="180000" value={bulkForm.price} onChange={e => setBulkForm(f => ({ ...f, price: e.target.value }))} id="bulk-price" />
                </div>
              </div>
              <div className="a-form-group">
                <label className="a-label">Ngày chạy (phân tách bằng dấu phẩy) *</label>
                <input className="a-input" placeholder="VD: 12, 13, 20, 25" value={bulkForm.datesText} onChange={e => setBulkForm(f => ({ ...f, datesText: e.target.value }))} id="bulk-dates" />
                <div style={{ fontSize:'0.72rem', color:'var(--gray-400)', marginTop:2 }}>Nhập ngày trong tháng, ví dụ: 1, 5, 12, 20</div>
              </div>
              <div className="a-form-group">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <label className="a-label" style={{ marginBottom:0 }}>Khung giờ chạy *</label>
                  <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={addTimeSlot} style={{ display:'flex', alignItems:'center', gap:4, color:'var(--primary)', fontWeight:600, fontSize:'0.8rem' }} id="add-time-slot">
                    <FiPlus size={13}/> Thêm giờ
                  </button>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {bulkTimeSlots.map((slot, idx) => (
                    <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--gray-50)', borderRadius:6, border:'1px solid var(--gray-200)' }}>
                      <span style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--gray-400)', minWidth:20 }}>#{idx + 1}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:4, flex:1 }}>
                        <input className="a-input" type="time" value={slot.departureTime} onChange={e => updateTimeSlot(idx, 'departureTime', e.target.value)} style={{ flex:1, padding:'6px 8px', fontSize:'0.85rem' }} id={`bulk-depart-${idx}`} />
                        <span style={{ color:'var(--gray-400)', fontSize:'0.8rem' }}>→</span>
                        <input className="a-input" type="time" value={slot.arrivalTime} onChange={e => updateTimeSlot(idx, 'arrivalTime', e.target.value)} style={{ flex:1, padding:'6px 8px', fontSize:'0.85rem' }} id={`bulk-arrive-${idx}`} />
                      </div>
                      {bulkTimeSlots.length > 1 && (
                        <button type="button" onClick={() => removeTimeSlot(idx)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--danger)', padding:2, display:'flex' }} id={`remove-time-slot-${idx}`}><FiTrash2 size={14}/></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {bulkPreview.length > 0 && (
                <div style={{ marginTop:'var(--sp-3)', background:'var(--gray-50)', borderRadius:'var(--r-sm)', border:'1px solid var(--gray-200)', padding:'var(--sp-3)', maxHeight:200, overflowY:'auto' }}>
                  <div style={{ fontWeight:700, marginBottom:8, fontSize:'0.85rem' }}>Xem trước: {bulkPreview.length} chuyến sẽ được tạo</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {bulkPreview.slice(0, 30).map((t, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', padding:'4px 8px', background:'#fff', borderRadius:4, border:'1px solid var(--gray-100)' }}>
                        <span style={{ fontWeight:600 }}>{new Date(t.tripDate + 'T00:00:00').toLocaleDateString('vi-VN', { weekday:'short', day:'2-digit', month:'2-digit' })}</span>
                        <span style={{ color:'var(--gray-400)' }}>{t.departureTime} - {t.arrivalTime}</span>
                        <span style={{ fontWeight:600, color:'var(--primary)' }}>{formatPrice(t.price)}</span>
                      </div>
                    ))}
                    {bulkPreview.length > 30 && <div style={{ textAlign:'center', fontSize:'0.8rem', color:'var(--gray-400)' }}>... và {bulkPreview.length - 30} chuyến nữa</div>}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setShowBulkModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleBulkCreate} disabled={bulkSaving || bulkPreview.length === 0} id="confirm-bulk-create">
                {bulkSaving ? 'Đang tạo...' : `Tạo ${bulkPreview.length} chuyến`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TripsPage;
