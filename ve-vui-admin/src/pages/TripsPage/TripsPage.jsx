// pages/TripsPage/TripsPage.jsx
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchTrips, createTrip, updateTrip, deleteTrip, fetchPublicRoutes, fetchPublicBuses, formatPrice } from '../../services/apiService';

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

  useEffect(() => { document.title = 'Chuyến đi | Vé Vui Admin'; }, []);

  useEffect(() => {
    Promise.all([
      fetchTrips().catch(() => null),
      fetchPublicRoutes().catch(() => null),
      fetchPublicBuses().catch(() => null),
    ]).then(([tripsData, routesData, busesData]) => {
      if (tripsData?.content) setTrips(tripsData.content);
      if (Array.isArray(routesData)) setRoutes(routesData);
      if (Array.isArray(busesData)) setBuses(busesData);
      setLoading(false);
    });
  }, []);

  const filtered = trips.filter(t => {
    const matchSearch = !search ||
      (t.route?.fromCity || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.route?.toCity || '').toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || t.tripDate === dateFilter;
    return matchSearch && matchDate;
  });

  const openAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setEdit(null);
    setForm({ routeId: routes[0]?.id || '', busId: buses[0]?.id || '', tripDate: today, departureTime:'06:00', arrivalTime:'12:00', price:'' });
    setModal(true);
  };

  const openEdit = (t) => {
    setEdit(t);
    setForm({ routeId: t.route?.id || t.routeId, busId: t.bus?.id || t.busId, tripDate: t.tripDate, departureTime: t.departureTime, arrivalTime: t.arrivalTime, price: t.price });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.tripDate || !form.price) return;
    setSaving(true);
    const body = { routeId: +form.routeId, busId: +form.busId, tripDate: form.tripDate, departureTime: form.departureTime, arrivalTime: form.arrivalTime, price: +form.price };
    try {
      if (editItem) {
        const updated = await updateTrip(editItem.id, body);
        setTrips(ts => ts.map(t => t.id === editItem.id ? updated : t));
      } else {
        const created = await createTrip(body);
        setTrips(ts => [...ts, created]);
      }
      setModal(false);
    } catch (e) { alert('Loi: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTrip(id);
      setTrips(ts => ts.filter(t => t.id !== id));
    } catch (e) { alert('Loi: ' + e.message); }
    setDeleteId(null);
  };

  return (
    <AdminLayout title="Chuyen di">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quan ly chuyen di</h1>
          <p className="page-subtitle">{trips.length} chuyen {loading ? '(dang tai...)' : `· ${trips.filter(t=>t.status==='SCHEDULED').length} dang hoat dong`}</p>
        </div>
        <button className="a-btn a-btn-primary" onClick={openAdd} id="add-trip">
          <FiPlus size={15}/> Them chuyen
        </button>
      </div>

      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-body" style={{ padding:'1rem 1.5rem', display:'flex', gap:'var(--sp-4)', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:200 }}>
            <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
            <input className="a-input" placeholder="Tim tuyen..." value={search} onChange={e=>setSearch(e.target.value)} id="trip-search" style={{ border:'none', boxShadow:'none', padding:'4px 0' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <FiCalendar size={14} style={{ color:'var(--gray-400)' }} />
            <input className="a-input" type="date" value={dateFilter} onChange={e=>setDate(e.target.value)} id="trip-date-filter" style={{ width:'auto' }} />
            {dateFilter && <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setDate('')}>x</button>}
          </div>
        </div>
      </div>

      <div className="a-card">
        <div style={{ overflowX:'auto' }}>
          <table className="a-table">
            <thead>
              <tr><th>Ngay</th><th>Tuyen</th><th>Gio di</th><th>Xe</th><th>Loai xe</th><th>Gia ve</th><th>Con trong</th><th>Trang thai</th><th>Thao tac</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:'2rem', color:'var(--gray-400)' }}>
                  <p>Khong tim thay chuyen xe phu hop</p>
                </td></tr>
              )}
              {filtered.map(t => {
                const total = t.bus?.totalSeats || 34;
                const avail = t.availableSeats || 0;
                const booked = total - avail;
                const pct = Math.round((booked / total) * 100);
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight:700 }}>
                      {t.tripDate ? new Date(t.tripDate + 'T00:00:00').toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}) : '-'}
                    </td>
                    <td>
                      <div style={{ fontWeight:700 }}>{(t.route?.fromCity || '').replace('TP. Ho Chi Minh','HCM')}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>to {t.route?.toCity}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight:800, fontSize:'1rem' }}>{t.departureTime}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>to {t.arrivalTime}</div>
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
                    <td><span className={`a-badge ${t.status==='SCHEDULED'?'a-badge-green':'a-badge-gray'}`}>{t.status==='SCHEDULED'?'Hoat dong':t.status}</span></td>
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
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Chinh sua chuyen' : 'Them chuyen moi'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Tuyen duong *</label>
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
                  <label className="a-label">Ngay chay *</label>
                  <input className="a-input" type="date" value={form.tripDate} onChange={e=>setForm(f=>({...f,tripDate:e.target.value}))} id="trip-date" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Gia ve (d) *</label>
                  <input className="a-input" type="number" placeholder="180000" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} id="trip-price" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Gio khoi hanh</label>
                  <input className="a-input" type="time" value={form.departureTime} onChange={e=>setForm(f=>({...f,departureTime:e.target.value}))} id="trip-depart" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Gio den</label>
                  <input className="a-input" type="time" value={form.arrivalTime} onChange={e=>setForm(f=>({...f,arrivalTime:e.target.value}))} id="trip-arrive" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setModal(false)}>Huy</button>
              <button className="a-btn a-btn-primary" onClick={handleSave} disabled={saving} id="save-trip">{saving ? 'Dang luu...' : 'Luu chuyen'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header"><div className="modal-title">Xac nhan xoa</div><button className="modal-close" onClick={() => setDeleteId(null)}>x</button></div>
            <div className="modal-body"><p>Xoa chuyen nay se anh huong den ve da dat. Chac chan tiep tuc?</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteId(null)}>Huy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDelete(deleteId)} id="confirm-delete-trip">Xoa</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TripsPage;
