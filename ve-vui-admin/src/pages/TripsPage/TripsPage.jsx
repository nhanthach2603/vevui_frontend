// pages/TripsPage/TripsPage.jsx
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  trips as initialTrips, routes, buses, busTypes,
  getRoute, getBus, getBusType, formatPrice
} from '../../services/adminData';

const isPenalized = (b) => {
  if (!b.violationExpiry) return false;
  return new Date(b.violationExpiry) >= new Date(new Date().toDateString());
};

const TripsPage = () => {
  const [trips, setTrips]       = useState(initialTrips);
  const [search, setSearch]     = useState('');
  const [dateFilter, setDate]   = useState('');
  const [showModal, setModal]   = useState(false);
  const [editItem, setEdit]     = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm]         = useState({ routeId:'r1', busId:'bus1', date:'', departureTime:'06:00', arrivalTime:'12:00', price:'', status:'active' });

  useEffect(() => { document.title = 'Chuyến đi | Vé Vui Admin'; }, []);

  const filtered = trips.filter(t => {
    const route = getRoute(t.routeId);
    const matchSearch = !search ||
      route?.from.toLowerCase().includes(search.toLowerCase()) ||
      route?.to.toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || t.date === dateFilter;
    return matchSearch && matchDate;
  });

  const openAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setEdit(null);
    setForm({ routeId:'r1', busId:'bus1', date:today, departureTime:'06:00', arrivalTime:'12:00', price:'', status:'active' });
    setModal(true);
  };

  const openEdit = (t) => {
    setEdit(t);
    setForm({ routeId:t.routeId, busId:t.busId, date:t.date, departureTime:t.departureTime, arrivalTime:t.arrivalTime, price:t.price, status:t.status });
    setModal(true);
  };

  const handleSave = () => {
    if (!form.date || !form.price) return;
    if (editItem) {
      setTrips(ts => ts.map(t => t.id === editItem.id ? { ...t, ...form, price: +form.price, bookedSeats: t.bookedSeats } : t));
    } else {
      setTrips(ts => [...ts, { id:`trip${Date.now()}`, ...form, price:+form.price, bookedSeats:0 }]);
    }
    setModal(false);
  };

  const handleDelete = (id) => { setTrips(ts => ts.filter(t => t.id !== id)); setDeleteId(null); };

  return (
    <AdminLayout title="Chuyến đi">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý chuyến đi</h1>
          <p className="page-subtitle">{trips.length} chuyến · {trips.filter(t=>t.status==='active').length} đang hoạt động</p>
        </div>
        <button className="a-btn a-btn-primary" onClick={openAdd} id="add-trip">
          <FiPlus size={15}/> Thêm chuyến
        </button>
      </div>

      {/* Filters */}
      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-body" style={{ padding:'1rem 1.5rem', display:'flex', gap:'var(--sp-4)', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:200 }}>
            <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
            <input className="a-input" placeholder="Tìm tuyến..." value={search} onChange={e=>setSearch(e.target.value)} id="trip-search" style={{ border:'none', boxShadow:'none', padding:'4px 0' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <FiCalendar size={14} style={{ color:'var(--gray-400)' }} />
            <input className="a-input" type="date" value={dateFilter} onChange={e=>setDate(e.target.value)} id="trip-date-filter" style={{ width:'auto' }} />
            {dateFilter && <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setDate('')}>×</button>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="a-card">
        <div style={{ overflowX:'auto' }}>
          <table className="a-table">
            <thead>
              <tr><th>Ngày</th><th>Tuyến</th><th>Giờ đi</th><th>Xe</th><th>Loại xe</th><th>Giá vé</th><th>Đặt/Tổng</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const route   = getRoute(t.routeId);
                const bus     = getBus(t.busId);
                const busType = getBusType(bus?.typeId);
                const total   = busType?.seats || 34;
                const pct     = Math.round((t.bookedSeats / total) * 100);
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight:700 }}>
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}
                    </td>
                    <td>
                      <div style={{ fontWeight:700 }}>{route?.from?.replace('TP. Hồ Chí Minh','HCM')}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>→ {route?.to}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight:800, fontSize:'1rem' }}>{t.departureTime}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>→ {t.arrivalTime}</div>
                    </td>
                    <td><code style={{ fontWeight:700, fontSize:'0.82rem' }}>{bus?.plateNumber}</code></td>
                    <td><span className="a-badge a-badge-blue">{busType?.name}</span></td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(t.price)}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:100 }}>
                        <div style={{ flex:1, height:6, background:'var(--gray-100)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background: pct>80?'var(--danger)':pct>50?'var(--warning)':'var(--success)', transition:'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize:'0.78rem', fontWeight:700, whiteSpace:'nowrap' }}>{t.bookedSeats}/{total}</span>
                      </div>
                    </td>
                    <td><span className={`a-badge ${t.status==='active'?'a-badge-green':'a-badge-gray'}`}>{t.status==='active'?'Hoạt động':'Dừng'}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openEdit(t)} id={`edit-trip-${t.id}`}><FiEdit2 size={14}/></button>
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setDeleteId(t.id)} style={{ color:'var(--danger)' }} id={`delete-trip-${t.id}`}><FiTrash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--gray-400)' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🔍</div>
              <p>Không tìm thấy chuyến xe phù hợp</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Chỉnh sửa chuyến' : 'Thêm chuyến mới'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Tuyến đường *</label>
                  <select className="a-input a-select" value={form.routeId} onChange={e=>setForm(f=>({...f,routeId:e.target.value}))} id="trip-route">
                    {routes.map(r => <option key={r.id} value={r.id}>{r.from} → {r.to}</option>)}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Xe *</label>
                  <select className="a-input a-select" value={form.busId} onChange={e=>setForm(f=>({...f,busId:e.target.value}))} id="trip-bus">
                    {buses.filter(b => b.status === 'active' && !isPenalized(b)).map(b => {
                      const bt = getBusType(b.typeId);
                      return <option key={b.id} value={b.id}>{b.plateNumber} — {bt?.name}</option>;
                    })}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Ngày chạy *</label>
                  <input className="a-input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} id="trip-date" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Giá vé (₫) *</label>
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
                <div className="a-form-group">
                  <label className="a-label">Trạng thái</label>
                  <select className="a-input a-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} id="trip-status">
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSave} id="save-trip">Lưu chuyến</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header"><div className="modal-title">Xác nhận xóa</div><button className="modal-close" onClick={() => setDeleteId(null)}>×</button></div>
            <div className="modal-body"><p>Xóa chuyến này sẽ ảnh hưởng đến vé đã đặt. Chắc chắn tiếp tục?</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDelete(deleteId)} id="confirm-delete-trip">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TripsPage;
