// pages/RoutesPage/RoutesPage.jsx
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiSearch, FiMapPin } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { routes as initialRoutes, formatPrice, formatDuration } from '../../services/adminData';

const RoutesPage = () => {
  const [routes, setRoutes]     = useState(initialRoutes);
  const [search, setSearch]     = useState('');
  const [showModal, setModal]   = useState(false);
  const [editItem, setEdit]     = useState(null);
  const [form, setForm]         = useState({ from:'', to:'', distance:'', duration:'', basePrice:'', active:true });
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { document.title = 'Tuyến đường | Vé Vui Admin'; }, []);

  const filtered = routes.filter(r =>
    r.from.toLowerCase().includes(search.toLowerCase()) ||
    r.to.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEdit(null);
    setForm({ from:'', to:'', distance:'', duration:'', basePrice:'', active:true });
    setModal(true);
  };

  const openEdit = (r) => {
    setEdit(r);
    setForm({ from: r.from, to: r.to, distance: r.distance, duration: r.duration, basePrice: r.basePrice, active: r.active });
    setModal(true);
  };

  const handleSave = () => {
    if (!form.from || !form.to || !form.distance) return;
    if (editItem) {
      setRoutes(rs => rs.map(r => r.id === editItem.id ? { ...r, ...form, distance: +form.distance, duration: +form.duration, basePrice: +form.basePrice } : r));
    } else {
      const newR = { id: `r${Date.now()}`, ...form, distance: +form.distance, duration: +form.duration, basePrice: +form.basePrice };
      setRoutes(rs => [...rs, newR]);
    }
    setModal(false);
  };

  const handleToggle = (id) => setRoutes(rs => rs.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const handleDelete = (id) => { setRoutes(rs => rs.filter(r => r.id !== id)); setDeleteId(null); };

  return (
    <AdminLayout title="Tuyến đường">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý tuyến đường</h1>
          <p className="page-subtitle">{routes.length} tuyến đường · {routes.filter(r=>r.active).length} đang hoạt động</p>
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
                        <div style={{ fontWeight:700 }}>{r.from}</div>
                        <div style={{ fontSize:'0.8rem', color:'var(--gray-400)' }}>→ {r.to}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.distance} km</td>
                  <td>{formatDuration(r.duration)}</td>
                  <td style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(r.basePrice)}</td>
                  <td>
                    <span className={`a-badge ${r.active ? 'a-badge-green' : 'a-badge-gray'}`}>
                      {r.active ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => handleToggle(r.id)} title={r.active?'Tạm dừng':'Kích hoạt'} id={`toggle-route-${r.id}`}>
                        {r.active ? <FiToggleRight size={16} style={{color:'var(--success)'}} /> : <FiToggleLeft size={16} />}
                      </button>
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
                  <input className="a-input" placeholder="TP. Hồ Chí Minh" value={form.from} onChange={e => setForm(f=>({...f,from:e.target.value}))} id="route-from" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Điểm đến *</label>
                  <input className="a-input" placeholder="Đà Lạt" value={form.to} onChange={e => setForm(f=>({...f,to:e.target.value}))} id="route-to" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Khoảng cách (km) *</label>
                  <input className="a-input" type="number" placeholder="290" value={form.distance} onChange={e => setForm(f=>({...f,distance:e.target.value}))} id="route-distance" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Thời gian (phút)</label>
                  <input className="a-input" type="number" placeholder="360" value={form.duration} onChange={e => setForm(f=>({...f,duration:e.target.value}))} id="route-duration" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Giá cơ bản (₫)</label>
                  <input className="a-input" type="number" placeholder="180000" value={form.basePrice} onChange={e => setForm(f=>({...f,basePrice:e.target.value}))} id="route-price" />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Trạng thái</label>
                  <select className="a-input a-select" value={form.active} onChange={e => setForm(f=>({...f,active:e.target.value==='true'}))} id="route-status">
                    <option value="true">Hoạt động</option>
                    <option value="false">Tạm dừng</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSave} id="save-route">Lưu tuyến</button>
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
