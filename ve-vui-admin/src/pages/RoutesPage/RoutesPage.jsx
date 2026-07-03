// pages/RoutesPage/RoutesPage.jsx
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiSearch, FiMapPin } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchRoutes, createRoute, updateRoute, deleteRoute, formatPrice, formatDuration } from '../../services/apiService';

const RoutesPage = () => {
  const [routes, setRoutes]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showModal, setModal]   = useState(false);
  const [editItem, setEdit]     = useState(null);
  const [form, setForm]         = useState({ fromCity:'', toCity:'', distanceKm:'', durationMinutes:'', basePrice:'', active:true });
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { document.title = 'Tuyến đường | Vé Vui Admin'; }, []);

  useEffect(() => {
    fetchRoutes().then(data => {
      setRoutes(data?.content || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = routes.filter(r =>
    (r.fromCity || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.toCity || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEdit(null);
    setForm({ fromCity:'', toCity:'', distanceKm:'', durationMinutes:'', basePrice:'', active:true });
    setModal(true);
  };

  const openEdit = (r) => {
    setEdit(r);
    setForm({ fromCity: r.fromCity, toCity: r.toCity, distanceKm: r.distanceKm, durationMinutes: r.durationMinutes, basePrice: r.basePrice, active: r.active !== false });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.fromCity || !form.toCity || !form.distanceKm) return;
    setSaving(true);
    const body = { fromCity: form.fromCity, toCity: form.toCity, distanceKm: +form.distanceKm, durationMinutes: +form.durationMinutes, basePrice: +form.basePrice };
    try {
      if (editItem) {
        const updated = await updateRoute(editItem.id, body);
        setRoutes(rs => rs.map(r => r.id === editItem.id ? updated : r));
      } else {
        const created = await createRoute(body);
        setRoutes(rs => [...rs, created]);
      }
      setModal(false);
    } catch (e) { alert('Lỗi: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteRoute(id);
      setRoutes(rs => rs.filter(r => r.id !== id));
    } catch (e) { alert('Lỗi: ' + e.message); }
    setDeleteId(null);
  };


  return (
    <AdminLayout title="Tuyến đường">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý tuyến đường</h1>
          <p className="page-subtitle">{routes.length} tuyến đường {loading ? '(đang tải...)' : ''}</p>
        </div>
        <button className="a-btn a-btn-primary" onClick={openAdd} id="add-route">
          <FiPlus size={15}/> Thêm tuyến
        </button>
      </div>

      {/* Search */}
      <div className="a-card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="a-card-body" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, maxWidth:360 }}>
            <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
            <input className="a-input" placeholder="Tìm tuyến đường..." value={search} onChange={e => setSearch(e.target.value)} id="route-search" style={{ border:'none', boxShadow:'none', padding:'4px 0', fontSize:'0.9rem' }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="a-card">
        <div style={{ overflowX:'auto' }}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Tuyến</th>
                <th>Khoảng cách</th>
                <th>Thời gian</th>
                <th>Giá cơ bản</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ color:'var(--primary)', fontSize:'0.85rem' }}><FiMapPin /></span>
                      <div>
                        <div style={{ fontWeight:700 }}>{r.fromCity}</div>
                        <div style={{ fontSize:'0.8rem', color:'var(--gray-400)' }}>→ {r.toCity}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.distanceKm} km</td>
                  <td>{formatDuration(r.durationMinutes)}</td>
                  <td style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(r.basePrice)}</td>
                  <td>
                    <span className={`a-badge ${r.active !== false ? 'a-badge-green' : 'a-badge-gray'}`}>
                      {r.active !== false ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openEdit(r)} id={`edit-route-${r.id}`}>
                        <FiEdit2 size={14}/>
                      </button>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setDeleteId(r.id)} style={{ color:'var(--danger)' }} id={`delete-route-${r.id}`}>
                        <FiTrash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Chỉnh sửa tuyến' : 'Thêm tuyến mới'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Điểm đi *</label>
                  <input className="a-input" placeholder="TP. Hồ Chí Minh" value={form.fromCity} onChange={e => setForm(f=>({...f,fromCity:e.target.value}))} id="route-from" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Điểm đến *</label>
                  <input className="a-input" placeholder="Đà Lạt" value={form.toCity} onChange={e => setForm(f=>({...f,toCity:e.target.value}))} id="route-to" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Khoảng cách (km) *</label>
                  <input className="a-input" type="number" placeholder="290" value={form.distanceKm} onChange={e => setForm(f=>({...f,distanceKm:e.target.value}))} id="route-distance" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Thời gian (phút)</label>
                  <input className="a-input" type="number" placeholder="360" value={form.durationMinutes} onChange={e => setForm(f=>({...f,durationMinutes:e.target.value}))} id="route-duration" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Giá cơ bản (₫)</label>
                  <input className="a-input" type="number" placeholder="180000" value={form.basePrice} onChange={e => setForm(f=>({...f,basePrice:e.target.value}))} id="route-price" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSave} disabled={saving} id="save-route">{saving ? 'Đang lưu...' : 'Lưu tuyến'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">Xác nhận xóa</div>
              <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc muốn xóa tuyến đường này? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDelete(deleteId)} id="confirm-delete-route">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default RoutesPage;
