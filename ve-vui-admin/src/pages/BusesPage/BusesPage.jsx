// pages/BusesPage/BusesPage.jsx
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiTruck, FiGrid, FiAlertTriangle, FiClock, FiX } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchBuses, createBus, updateBus, deleteBus, fetchBusTypes, createBusType, updateBusType, deleteBusType } from '../../services/apiService';


const isPenalized = (b) => {
  if (!b.violationExpiry) return false;
  return new Date(b.violationExpiry) >= new Date(new Date().toDateString());
};

const STATUS_COLORS = {
  active:      { cls: 'a-badge-green',  label: 'Hoạt động' },
  maintenance: { cls: 'a-badge-orange', label: 'Bảo dưỡng' },
  penalized:   { cls: 'a-badge-red',    label: 'Đang bị phạt' },
  inactive:    { cls: 'a-badge-gray',   label: 'Ngừng hoạt động' },
};

const BusesPage = () => {
  const [tab, setTab]                     = useState('buses');
  const [buses, setBuses]                 = useState([]);
  const [busTypes, setBusTypes]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [showModal, setModal]             = useState(false);
  const [editItem, setEdit]               = useState(null);
  const [form, setForm]                   = useState({ plateNumber:'', typeId:'bt1', status:'active', description:'' });
  const [deleteId, setDeleteId]           = useState(null);
  const [showTypeModal, setTypeModal]     = useState(false);
  const [editType, setEditType]           = useState(null);
  const [typeForm, setTypeForm]           = useState({ name:'', code:'', seats:'' });
  const [deleteTypeId, setDeleteTypeId]   = useState(null);
  const [penaltyBus, setPenaltyBus]       = useState(null);
  const [penaltyForm, setPenaltyForm]     = useState({ violationDate:'', violationExpiry:'', violationReason:'' });
  const [showPenaltyDetail, setShowPenaltyDetail] = useState(null);

  useEffect(() => { document.title = 'Quản lý xe | Vé Vui Admin'; }, []);

  useEffect(() => {
    Promise.all([
      fetchBuses().catch(() => ({ content: [] })),
      fetchBusTypes().catch(() => []),
    ]).then(([busesData, typesData]) => {
      setBuses(busesData?.content || []);
      setBusTypes(Array.isArray(typesData) ? typesData : []);
      setLoading(false);
    });
  }, []);

  // ── Bus functions ──
  const filteredBuses = buses.filter(b =>
    b.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setEdit(null); setForm({ plateNumber:'', typeId: busTypes[0]?.id || '', status:'ACTIVE', name:'' }); setModal(true); };
  const openEdit = (b) => { setEdit(b); setForm({ plateNumber:b.plateNumber, typeId:b.busTypeId || '', status: isPenalized(b) ? b.status : b.status, name:b.name||'' }); setModal(true); };

  const handleSaveBus = async () => {
    if (!form.plateNumber.trim()) return;
    const body = { plateNumber: form.plateNumber, name: form.name || form.plateNumber, busTypeId: Number(form.typeId) };
    try {
      if (editItem) {
        const updated = await updateBus(editItem.id, body);
        setBuses(bs => bs.map(b => b.id === editItem.id ? updated : b));
      } else {
        const created = await createBus(body);
        setBuses(bs => [...bs, created]);
      }
      setModal(false);
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  const handleDeleteBus = async (id) => {
    try {
      await deleteBus(id);
      setBuses(bs => bs.filter(b => b.id !== id));
    } catch (e) { alert('Lỗi: ' + e.message); }
    setDeleteId(null);
  };

  // ── Penalty functions ──
  const openPenalty = (b) => {
    setPenaltyBus(b);
    setPenaltyForm({
      violationDate: b.violationDate || new Date().toISOString().split('T')[0],
      violationExpiry: b.violationExpiry || '',
      violationReason: b.violationReason || '',
    });
  };

  const handleSavePenalty = () => {
    if (!penaltyForm.violationDate || !penaltyForm.violationExpiry) return;
    if (new Date(penaltyForm.violationExpiry) < new Date(penaltyForm.violationDate)) {
      alert('Ngày hết phạt phải sau ngày phạt!');
      return;
    }
    setBuses(bs => bs.map(b => b.id === penaltyBus.id ? {
      ...b,
      violationDate: penaltyForm.violationDate,
      violationExpiry: penaltyForm.violationExpiry,
      violationReason: penaltyForm.violationReason,
    } : b));
    setPenaltyBus(null);
  };

  const handleClearPenalty = (busId) => {
    setBuses(bs => bs.map(b => b.id === busId ? {
      ...b,
      violationDate: null,
      violationExpiry: null,
      violationReason: '',
    } : b));
    setShowPenaltyDetail(null);
  };

  const penalizedCount = buses.filter(isPenalized).length;

  // ── Bus Type functions ──
  const filteredTypes = busTypes.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAddType  = () => { setEditType(null); setTypeForm({ name:'', code:'', seats:'' }); setTypeModal(true); };
  const openEditType = (t) => { setEditType(t); setTypeForm({ name:t.name, code:t.code, seats:String(t.totalSeats) }); setTypeModal(true); };

  const handleSaveType = async () => {
    if (!typeForm.name.trim() || !typeForm.seats) return;
    const seats = parseInt(typeForm.seats, 10);
    if (isNaN(seats) || seats < 1) return;
    try {
      if (editType) {
        const updated = await updateBusType(editType.id, { name: typeForm.name, code: typeForm.code.toUpperCase(), totalSeats: seats });
        setBusTypes(ts => ts.map(t => t.id === editType.id ? updated : t));
      } else {
        const created = await createBusType({ name: typeForm.name, code: typeForm.code.toUpperCase() || `TYPE_${Date.now()}`, totalSeats: seats });
        setBusTypes(ts => [...ts, created]);
      }
      setTypeModal(false);
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  const handleDeleteType = async (id) => {
    const busCount = buses.filter(b => b.busTypeId === id).length;
    if (busCount > 0) { alert(`Không thể xóa loại xe này vì đang có ${busCount} xe sử dụng.`); setDeleteTypeId(null); return; }
    try {
      await deleteBusType(id);
      setBusTypes(ts => ts.filter(t => t.id !== id));
    } catch (e) { alert('Lỗi: ' + e.message); }
    setDeleteTypeId(null);
  };

  return (
    <AdminLayout title="Quản lý xe">
      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:'var(--sp-5)' }}>
        <button className={`a-btn a-btn-sm ${tab === 'buses' ? 'a-btn-primary' : 'a-btn-ghost'}`} onClick={() => { setTab('buses'); setSearch(''); }} id="tab-buses">
          <FiTruck size={14} /> Quản lý xe
        </button>
        <button className={`a-btn a-btn-sm ${tab === 'types' ? 'a-btn-primary' : 'a-btn-ghost'}`} onClick={() => { setTab('types'); setSearch(''); }} id="tab-types">
          <FiGrid size={14} /> Loại xe
        </button>
      </div>

      {/* ══════ BUSES TAB ══════ */}
      {tab === 'buses' && (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Quản lý xe</h1>
              <p className="page-subtitle">
                {buses.length} xe · {buses.filter(b=>b.status==='active' && !isPenalized(b)).length} hoạt động
                {penalizedCount > 0 && <> · <span style={{color:'var(--danger)', fontWeight:700}}>{penalizedCount} đang bị phạt</span></>}
              </p>
            </div>
            <button className="a-btn a-btn-primary" onClick={openAdd} id="add-bus">
              <FiPlus size={15}/> Thêm xe
            </button>
          </div>

          {/* Penalty alert banner */}
          {penalizedCount > 0 && (
            <div style={{ padding:'12px 16px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r-md)', marginBottom:'var(--sp-5)', display:'flex', alignItems:'center', gap:10, fontSize:'0.875rem', color:'#991B1B' }}>
              <FiAlertTriangle size={18} />
              <span><strong>{penalizedCount} xe</strong> đang bị xử lý vi phạm giao thông và không thể hoạt động.</span>
            </div>
          )}

          {/* Bus type stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'var(--sp-4)', marginBottom:'var(--sp-5)' }}>
            {busTypes.map(bt => {
              const count = buses.filter(b => b.busTypeId === bt.id).length;
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
                  {filteredBuses.map(b => {
                    const bt = busTypes.find(t => t.id === b.busTypeId);
                    const penalized = isPenalized(b);
                    const st = penalized ? STATUS_COLORS.penalized : STATUS_COLORS[b.status] || STATUS_COLORS.inactive;
                    return (
                      <tr key={b.id} style={penalized ? { background:'#FEF2F2' } : {}}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <FiTruck size={16} style={{ color: penalized ? 'var(--danger)' : 'var(--primary)' }} />
                            <code style={{ fontWeight:800, fontSize:'0.9rem', letterSpacing:1 }}>{b.plateNumber}</code>
                          </div>
                        </td>
                        <td><span className="a-badge a-badge-blue">{bt?.name || '—'}</span></td>
                        <td>{bt?.seats || '—'} chỗ</td>
                        <td style={{ color:'var(--gray-500)' }}>{b.name}</td>
                        <td>
                          <span className={`a-badge ${st.cls}`}>{st.label}</span>
                          {penalized && (
                            <div style={{ fontSize:'0.72rem', color:'var(--danger)', marginTop:2, fontWeight:600 }}>
                              Hết hạn: {new Date(b.violationExpiry).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openEdit(b)} title="Chỉnh sửa" id={`edit-bus-${b.id}`}><FiEdit2 size={14}/></button>
                            <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openPenalty(b)} title="Xử lý vi phạm" style={penalized ? { color:'var(--danger)' } : {}} id={`penalty-bus-${b.id}`}>
                              {penalized ? <FiAlertTriangle size={14}/> : <FiClock size={14}/>}
                            </button>
                            <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setDeleteId(b.id)} style={{ color:'var(--danger)' }} id={`delete-bus-${b.id}`}><FiTrash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBuses.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--gray-400)' }}>Không tìm thấy xe nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════ BUS TYPES TAB ══════ */}
      {tab === 'types' && (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Quản lý loại xe</h1>
              <p className="page-subtitle">{busTypes.length} loại xe đang có trong hệ thống</p>
            </div>
            <button className="a-btn a-btn-primary" onClick={openAddType} id="add-type">
              <FiPlus size={15}/> Thêm loại xe
            </button>
          </div>
          <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
            <div className="a-card-body" style={{ padding:'1rem 1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, maxWidth:360 }}>
                <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
                <input className="a-input" placeholder="Tìm loại xe..." value={search} onChange={e=>setSearch(e.target.value)} id="type-search" style={{ border:'none', boxShadow:'none', padding:'4px 0', fontSize:'0.9rem' }} />
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'var(--sp-4)' }}>
            {filteredTypes.map(bt => {
              const busCount = buses.filter(b => b.busTypeId === bt.id).length;
              return (
                <div key={bt.id} className="a-card" style={{ padding:'var(--sp-5)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--sp-3)' }}>
                    <div>
                      <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'var(--gray-900)' }}>{bt.name}</h3>
                      <code style={{ fontSize:'0.78rem', color:'var(--gray-400)', fontWeight:600 }}>{bt.code}</code>
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openEditType(bt)} id={`edit-type-${bt.id}`}><FiEdit2 size={14}/></button>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setDeleteTypeId(bt.id)} style={{ color:'var(--danger)' }} id={`delete-type-${bt.id}`}><FiTrash2 size={14}/></button>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'var(--sp-5)', fontSize:'0.875rem' }}>
                    <div><span style={{ color:'var(--gray-400)' }}>Số chỗ: </span><strong style={{ color:'var(--primary)' }}>{bt.totalSeats}</strong></div>
                    <div><span style={{ color:'var(--gray-400)' }}>Đang dùng: </span><strong>{busCount} xe</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════ ADD/EDIT BUS MODAL ══════ */}
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
                  <label className="a-label">Loại xe *</label>
                  <select className="a-input a-select" value={form.typeId} onChange={e => setForm(f=>({...f,typeId:e.target.value}))} id="bus-type">
                    {busTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.totalSeats} chỗ)</option>)}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Trạng thái</label>
                  <select className="a-input a-select" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))} id="bus-status" disabled={isPenalized(editItem)}>
                    <option value="active">Hoạt động</option>
                    <option value="maintenance">Bảo dưỡng</option>
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
                  {isPenalized(editItem) && <div style={{ fontSize:'0.75rem', color:'var(--danger)', marginTop:2 }}>Xe đang bị phạt — không thể đổi trạng thái</div>}
                </div>
              </div>
              <div className="a-form-group">
                <label className="a-label">Tên xe</label>
                <input className="a-input" placeholder="Xe Giường Nằm..." value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} id="bus-name" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSaveBus} id="save-bus">Lưu xe</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete bus confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header"><div className="modal-title">Xác nhận xóa</div><button className="modal-close" onClick={() => setDeleteId(null)}>×</button></div>
            <div className="modal-body"><p>Xóa xe này sẽ ảnh hưởng đến các chuyến đi đang liên kết. Tiếp tục?</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDeleteBus(deleteId)} id="confirm-delete-bus">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ PENALTY MODAL ══════ */}
      {penaltyBus && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPenaltyBus(null)}>
          <div className="modal-box" style={{ maxWidth:520 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                <FiAlertTriangle size={18} style={{ color:'var(--danger)' }} />
                Xử lý vi phạm — {penaltyBus.plateNumber}
              </div>
              <button className="modal-close" onClick={() => setPenaltyBus(null)}>×</button>
            </div>
            <div className="modal-body">
              {isPenalized(penaltyBus) && (
                <div style={{ padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r-md)', marginBottom:'var(--sp-4)', fontSize:'0.85rem', color:'#991B1B' }}>
                  Xe này đang bị phạt đến <strong>{new Date(penaltyBus.violationExpiry).toLocaleDateString('vi-VN')}</strong>.
                  {penaltyBus.violationReason && <><br/>Lý do: {penaltyBus.violationReason}</>}
                </div>
              )}
              <div className="a-form-group">
                <label className="a-label">Ngày phạt *</label>
                <input className="a-input" type="date" value={penaltyForm.violationDate} onChange={e => setPenaltyForm(f=>({...f,violationDate:e.target.value}))} id="penalty-date" />
              </div>
              <div className="a-form-group">
                <label className="a-label">Ngày hết phạt *</label>
                <input className="a-input" type="date" value={penaltyForm.violationExpiry} onChange={e => setPenaltyForm(f=>({...f,violationExpiry:e.target.value}))} id="penalty-expiry" />
              </div>
              <div className="a-form-group">
                <label className="a-label">Lý do / Ghi chú</label>
                <textarea className="a-input" rows={2} placeholder="VD: Phạt vượt đèn đỏ, chạy quá tốc độ..." value={penaltyForm.violationReason} onChange={e => setPenaltyForm(f=>({...f,violationReason:e.target.value}))} id="penalty-reason" style={{ resize:'vertical' }} />
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent:'space-between' }}>
              <div>
                {isPenalized(penaltyBus) && (
                  <button className="a-btn a-btn-danger" onClick={() => { handleClearPenalty(penaltyBus.id); setPenaltyBus(null); }} id="clear-penalty">
                    <FiX size={14} /> Hủy phạt
                  </button>
                )}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="a-btn a-btn-ghost" onClick={() => setPenaltyBus(null)}>Đóng</button>
                <button className="a-btn a-btn-primary" onClick={handleSavePenalty} id="save-penalty">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ ADD/EDIT BUS TYPE MODAL ══════ */}
      {showTypeModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setTypeModal(false)}>
          <div className="modal-box" style={{ maxWidth:480 }}>
            <div className="modal-header">
              <div className="modal-title">{editType ? 'Chỉnh sửa loại xe' : 'Thêm loại xe mới'}</div>
              <button className="modal-close" onClick={() => setTypeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="a-form-group">
                <label className="a-label">Tên loại xe *</label>
                <input className="a-input" placeholder="VD: Ghế ngồi thường, Giường nằm VIP..." value={typeForm.name} onChange={e => setTypeForm(f=>({...f,name:e.target.value}))} id="type-name" />
              </div>
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Mã loại (code)</label>
                  <input className="a-input" placeholder="VD: STANDARD, VIP..." value={typeForm.code} onChange={e => setTypeForm(f=>({...f,code:e.target.value.toUpperCase()}))} id="type-code" style={{ textTransform:'uppercase', letterSpacing:1 }} />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Số chỗ ngồi *</label>
                  <input className="a-input" type="number" min="1" placeholder="VD: 45" value={typeForm.seats} onChange={e => setTypeForm(f=>({...f,seats:e.target.value}))} id="type-seats" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setTypeModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSaveType} id="save-type">Lưu loại xe</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete bus type confirm */}
      {deleteTypeId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTypeId(null)}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header"><div className="modal-title">Xác nhận xóa loại xe</div><button className="modal-close" onClick={() => setDeleteTypeId(null)}>×</button></div>
            <div className="modal-body"><p>Xóa loại xe này sẽ ảnh hưởng đến các xe đang sử dụng. Tiếp tục?</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteTypeId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDeleteType(deleteTypeId)} id="confirm-delete-type">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BusesPage;
