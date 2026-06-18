// pages/BusesPage/BusesPage.jsx
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiTruck } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { buses as initialBuses, busTypes } from '../../services/adminData';

const STATUS_COLORS = {
  active:      { cls: 'a-badge-green',  label: 'Hoạt động' },
  maintenance: { cls: 'a-badge-orange', label: 'Bảo dưỡng' },
  inactive:    { cls: 'a-badge-gray',   label: 'Ngừng hoạt động' },
};

const BusesPage = () => {
  const [buses, setBuses]       = useState(initialBuses);
  const [search, setSearch]     = useState('');
  const [showModal, setModal]   = useState(false);
  const [editItem, setEdit]     = useState(null);
  const [form, setForm]         = useState({ plateNumber:'', typeId:'bt1', status:'active', description:'' });
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { document.title = 'Quản lý xe | Vé Vui Admin'; }, []);

  const filtered = buses.filter(b =>
    b.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.description.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setEdit(null); setForm({ plateNumber:'', typeId:'bt1', status:'active', description:'' }); setModal(true); };
  const openEdit = (b) => { setEdit(b); setForm({ plateNumber:b.plateNumber, typeId:b.typeId, status:b.status, description:b.description }); setModal(true); };

  const handleSave = () => {
    if (!form.plateNumber) return;
    if (editItem) {
      setBuses(bs => bs.map(b => b.id === editItem.id ? { ...b, ...form } : b));
    } else {
      setBuses(bs => [...bs, { id: `bus${Date.now()}`, ...form }]);
    }
    setModal(false);
  };

  const handleDelete = (id) => { setBuses(bs => bs.filter(b => b.id !== id)); setDeleteId(null); };

  return (
    <AdminLayout title="Quản lý xe">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý xe</h1>
          <p className="page-subtitle">{buses.length} xe · {buses.filter(b=>b.status==='active').length} hoạt động · {buses.filter(b=>b.status==='maintenance').length} bảo dưỡng</p>
        </div>
        <button className="a-btn a-btn-primary" onClick={openAdd} id="add-bus">
          <FiPlus size={15}/> Thêm xe
        </button>
      </div>

      {/* Bus type stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'var(--sp-4)', marginBottom:'var(--sp-5)' }}>
        {busTypes.map(bt => {
          const count = buses.filter(b => b.typeId === bt.id).length;
          return (
            <div key={bt.id} className="a-card" style={{ padding:'var(--sp-4) var(--sp-5)', display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
              <div style={{ width:40, height:40, background:'var(--primary-bg)', borderRadius:'var(--r-md)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)', flexShrink:0 }}>
                <FiTruck />
              </div>
              <div>
                <div style={{ fontSize:'0.75rem', color:'var(--gray-500)', fontWeight:600 }}>{bt.name}</div>
                <div style={{ fontSize:'1.5rem', fontWeight:900, color:'var(--gray-900)' }}>{count}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-body" style={{ padding:'1rem 1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, maxWidth:360 }}>
            <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
            <input className="a-input" placeholder="Tìm xe..." value={search} onChange={e=>setSearch(e.target.value)} id="bus-search" style={{ border:'none', boxShadow:'none', padding:'4px 0', fontSize:'0.9rem' }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="a-card">
        <div style={{ overflowX:'auto' }}>
          <table className="a-table">
            <thead>
              <tr><th>Biển số</th><th>Loại xe</th><th>Số chỗ</th><th>Mô tả</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const bt = busTypes.find(t => t.id === b.typeId);
                const st = STATUS_COLORS[b.status] || STATUS_COLORS.inactive;
                return (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <FiTruck size={16} style={{ color:'var(--primary)' }} />
                        <code style={{ fontWeight:800, fontSize:'0.9rem', letterSpacing:1 }}>{b.plateNumber}</code>
                      </div>
                    </td>
                    <td><span className="a-badge a-badge-blue">{bt?.name}</span></td>
                    <td>{bt?.seats} chỗ</td>
                    <td style={{ color:'var(--gray-500)' }}>{b.description}</td>
                    <td><span className={`a-badge ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openEdit(b)} id={`edit-bus-${b.id}`}><FiEdit2 size={14}/></button>
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setDeleteId(b.id)} style={{ color:'var(--danger)' }} id={`delete-bus-${b.id}`}><FiTrash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Chỉnh sửa xe' : 'Thêm xe mới'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="a-form-group">
                <label className="a-label">Biển số xe *</label>
                <input className="a-input" placeholder="51B-12345" value={form.plateNumber} onChange={e => setForm(f=>({...f,plateNumber:e.target.value.toUpperCase()}))} id="bus-plate" style={{ textTransform:'uppercase', letterSpacing:1 }} />
              </div>
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Loại xe</label>
                  <select className="a-input a-select" value={form.typeId} onChange={e => setForm(f=>({...f,typeId:e.target.value}))} id="bus-type">
                    {busTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.seats} chỗ)</option>)}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Trạng thái</label>
                  <select className="a-input a-select" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))} id="bus-status">
                    <option value="active">Hoạt động</option>
                    <option value="maintenance">Bảo dưỡng</option>
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>
              <div className="a-form-group">
                <label className="a-label">Mô tả</label>
                <input className="a-input" placeholder="Xe Giường Nằm..." value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} id="bus-desc" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSave} id="save-bus">Lưu xe</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header"><div className="modal-title">Xác nhận xóa</div><button className="modal-close" onClick={() => setDeleteId(null)}>×</button></div>
            <div className="modal-body"><p>Xóa xe này sẽ ảnh hưởng đến các chuyến đi đang liên kết. Tiếp tục?</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDelete(deleteId)} id="confirm-delete-bus">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BusesPage;
