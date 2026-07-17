import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiHome, FiSave } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchPickupPoints, createPickupPoint, updatePickupPoint, deletePickupPoint, fetchCitiesAdmin, createCity, updateCity, deleteCity, permanentDeleteCity } from '../../services/apiService';
import SearchInput from '../../components/ui/SearchInput';

const POINT_TYPES = [
  { value: 'PICKUP', label: 'Điểm đón' },
  { value: 'DROPOFF', label: 'Điểm trả' },
  { value: 'BOTH', label: 'Cả hai' },
];

const PickupPointsPage = ({ onBack }) => {
  const [points, setPoints] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [showModal, setModal] = useState(false);
  const [editItem, setEdit] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ city: '', name: '', timeOffset: '0 phút', type: 'BOTH' });
  const [showCityModal, setShowCityModal] = useState(false);
  const [editCity, setEditCity] = useState(null);
  const [deleteCityId, setDeleteCityId] = useState(null);
  const [permDeleteCityId, setPermDeleteCityId] = useState(null);
  const [cityForm, setCityForm] = useState({ name: '' });
  const [citySaving, setCitySaving] = useState(false);

  useEffect(() => { document.title = 'Điểm đón/trả | Vé Vui Admin'; }, []);

  const loadCities = useCallback(async () => {
    try {
      const data = await fetchCitiesAdmin();
      setCities(Array.isArray(data) ? data : []);
    } catch { setCities([]); }
  }, []);

  const loadPoints = async () => {
    setLoading(true);
    try {
      const data = await fetchPickupPoints(cityFilter || undefined);
      setPoints(Array.isArray(data) ? data : []);
    } catch { setPoints([]); }
    setLoading(false);
  };

  useEffect(() => { loadCities(); }, [loadCities]);
  useEffect(() => { loadPoints(); }, [cityFilter]);

  const filtered = points.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  const activeCities = cities.filter(c => c.active !== false);

  const openAdd = () => {
    setEdit(null);
    setForm({ city: activeCities[0]?.name || '', name: '', timeOffset: '0 phút', type: 'BOTH' });
    setModal(true);
  };

  const openEdit = (p) => {
    setEdit(p);
    setForm({ city: p.city, name: p.name, timeOffset: p.timeOffset || '0 phút', type: p.type || 'BOTH' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.city || !form.name) return alert('Vui lòng nhập đầy đủ thông tin');
    setSaving(true);
    try {
      if (editItem) {
        await updatePickupPoint(editItem.id, form);
      } else {
        await createPickupPoint(form);
      }
      setModal(false);
      loadPoints();
    } catch (e) { alert('Lỗi: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deletePickupPoint(id);
      setPoints(ps => ps.filter(p => p.id !== id));
    } catch (e) { alert('Lỗi: ' + e.message); }
    setDeleteId(null);
  };

  const openAddCity = () => {
    setEditCity(null);
    setCityForm({ name: '' });
    setShowCityModal(true);
  };

  const openEditCity = (c) => {
    setEditCity(c);
    setCityForm({ name: c.name });
    setShowCityModal(true);
  };

  const handleSaveCity = async () => {
    if (!cityForm.name.trim()) return alert('Vui lòng nhập tên thành phố');
    setCitySaving(true);
    try {
      if (editCity) {
        await updateCity(editCity.id, cityForm);
      } else {
        await createCity(cityForm);
      }
      setShowCityModal(false);
      loadCities();
    } catch (e) { alert('Lỗi: ' + e.message); }
    setCitySaving(false);
  };

  const handleDeleteCity = async (id) => {
    try {
      await deleteCity(id);
      loadCities();
    } catch (e) { alert('Lỗi: ' + e.message); }
    setDeleteCityId(null);
  };

  const handleToggleCityActive = async (id, currentActive) => {
    try {
      const city = cities.find(c => c.id === id);
      await updateCity(id, { name: city.name, active: !currentActive });
      loadCities();
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  const handlePermanentDeleteCity = async (id) => {
    try {
      await permanentDeleteCity(id);
      loadCities();
    } catch (e) { alert('Lỗi: ' + e.message); }
    setPermDeleteCityId(null);
  };

  const typeLabel = (type) => {
    const t = POINT_TYPES.find(pt => pt.value === type);
    return t ? t.label : type;
  };

  const typeColor = (type) => {
    if (type === 'PICKUP') return { bg: '#ECFDF5', color: '#059669' };
    if (type === 'DROPOFF') return { bg: '#EFF6FF', color: '#2563EB' };
    return { bg: '#F5F3FF', color: '#7C3AED' };
  };

  return (
    <AdminLayout title="Điểm đón/trả">
      <div className="page-header">
        <div>
          {onBack && (
            <button className="a-btn a-btn-ghost a-btn-sm" onClick={onBack} style={{ display:'flex', alignItems:'center', gap:4, marginBottom:8 }}>
              ← Quay lại Chuyến đi
            </button>
          )}
          <h1 className="page-title">Quản lý điểm đón/trả</h1>
          <p className="page-subtitle">{points.length} điểm · {activeCities.length} tỉnh/thành {loading ? '(đang tải...)' : ''}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="a-btn a-btn-ghost" onClick={openAddCity} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <FiHome size={15}/> Tỉnh/Thành phố
          </button>
          <button className="a-btn a-btn-primary" onClick={openAdd} id="add-pickup-point">
            <FiPlus size={15}/> Thêm điểm
          </button>
        </div>
      </div>

      <div className="a-card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="a-card-body card-filter-body">
          <div className="filter-bar search-box">
            <SearchInput value={search} onChange={setSearch} placeholder="Tìm điểm đón/trả..." />
          </div>
          <div className="filter-bar filter-group">
            <FiMapPin size={14} style={{ color: 'var(--gray-400)' }} />
            <select className="a-input a-select" value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{ width: 'auto' }} id="city-filter">
              <option value="">Tất cả thành phố</option>
              {activeCities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {cityFilter && <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setCityFilter('')}>x</button>}
          </div>
        </div>
      </div>

      <div className="a-card">
        <div className="a-card-scroll">
          <table className="a-table">
            <thead>
              <tr><th>Thành phố</th><th>Tên điểm</th><th>Loại</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                  <p>Không tìm thấy điểm đón/trả</p>
                </td></tr>
              )}
              {filtered.map(p => {
                const tc = typeColor(p.type);
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.city}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiMapPin size={14} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="a-badge" style={{ background: tc.bg, color: tc.color }}>
                        {typeLabel(p.type)}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{p.timeOffset || '0 phút'}</td>
                    <td>
                      <span className="a-badge" style={{
                        background: p.active !== false ? '#ECFDF5' : '#FEF2F2',
                        color: p.active !== false ? '#059669' : '#DC2626'
                      }}>
                        {p.active !== false ? 'Hoạt động' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openEdit(p)} title="Chỉnh sửa" id={`edit-point-${p.id}`}><FiEdit2 size={14}/></button>
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setDeleteId(p.id)} style={{ color: 'var(--danger)' }} title="Xóa" id={`delete-point-${p.id}`}><FiTrash2 size={14}/></button>
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
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Chỉnh sửa điểm' : 'Thêm điểm mới'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div className="a-form-group">
                <label className="a-label">Thành phố *</label>
                <select className="a-input a-select" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} id="point-city">
                  {activeCities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="a-form-group">
                <label className="a-label">Tên điểm *</label>
                <input className="a-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Bến xe Mỹ Đình" id="point-name" />
              </div>
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Loại điểm</label>
                  <select className="a-input a-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} id="point-type">
                    {POINT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Thời gian</label>
                  <input className="a-input" value={form.timeOffset} onChange={e => setForm(f => ({ ...f, timeOffset: e.target.value }))} placeholder="VD: +30 phút" id="point-time" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSave} disabled={saving} id="save-point">{saving ? 'Đang lưu...' : 'Lưu điểm'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header"><div className="modal-title">Xác nhận xóa</div><button className="modal-close" onClick={() => setDeleteId(null)}>x</button></div>
            <div className="modal-body"><p>Điểm đón/trả này sẽ được ẩn khỏi hệ thống. Tiếp tục?</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDelete(deleteId)} id="confirm-delete-point">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {showCityModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCityModal(false)}>
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">{editCity ? 'Sửa tỉnh/thành phố' : 'Quản lý tỉnh/thành phố'}</div>
              <button className="modal-close" onClick={() => setShowCityModal(false)}>x</button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: 8 }}>
                <input className="a-input" value={cityForm.name} onChange={e => setCityForm({ name: e.target.value })} placeholder="Nhập tên tỉnh/thành phố mới..." id="city-name-input" style={{ flex: 1 }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveCity(); }}
                />
                {editCity ? (
                  <button className="a-btn a-btn-primary a-btn-sm" onClick={handleSaveCity} disabled={citySaving} id="save-city-btn">
                    <FiSave size={14}/> Lưu
                  </button>
                ) : (
                  <button className="a-btn a-btn-primary a-btn-sm" onClick={handleSaveCity} disabled={citySaving} id="add-city-btn">
                    <FiPlus size={14}/> Thêm
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {cities.length === 0 && (
                  <p style={{ textAlign: 'center', padding: 'var(--sp-4)', color: 'var(--gray-400)' }}>Chưa có tỉnh/thành phố</p>
                )}
                {cities.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px var(--sp-4)', borderBottom: '1px solid var(--gray-100)', background: editCity?.id === c.id ? 'var(--gray-50)' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiHome size={14} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      {c.active === false && <span className="a-badge" style={{ background: '#FEF2F2', color: '#DC2626', fontSize: '0.7rem' }}>Đã ẩn</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {c.active === false ? (
                        <>
                          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => handleToggleCityActive(c.id, c.active)} style={{ color: '#059669', fontWeight: 600, fontSize: '0.8rem' }} id={`show-city-${c.id}`}>
                            Hiện
                          </button>
                          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setPermDeleteCityId(c.id)} style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.8rem' }} id={`perm-delete-city-${c.id}`}>
                            Xóa
                          </button>
                        </>
                      ) : null}
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openEditCity(c)} title="Sửa" id={`edit-city-${c.id}`}><FiEdit2 size={13}/></button>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setDeleteCityId(c.id)} style={{ color: 'var(--danger)' }} title="Ẩn" id={`hide-city-${c.id}`}><FiTrash2 size={13}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => { setShowCityModal(false); setEditCity(null); setCityForm({ name: '' }); }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {deleteCityId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteCityId(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header"><div className="modal-title">Ẩn tỉnh/thành phố</div><button className="modal-close" onClick={() => setDeleteCityId(null)}>x</button></div>
            <div className="modal-body"><p>Tỉnh/thành phố sẽ bị ẩn khỏi user. Bạn vẫn có thể hiện lại sau.</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteCityId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDeleteCity(deleteCityId)} id="confirm-hide-city">Ẩn</button>
            </div>
          </div>
        </div>
      )}

      {permDeleteCityId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPermDeleteCityId(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header"><div className="modal-title">Xóa vĩnh viễn</div><button className="modal-close" onClick={() => setPermDeleteCityId(null)}>x</button></div>
            <div className="modal-body"><p>Tỉnh/thành phố sẽ bị xóa vĩnh viễn khỏi hệ thống. <strong>Không thể hoàn tác.</strong></p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setPermDeleteCityId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handlePermanentDeleteCity(permDeleteCityId)} id="confirm-perm-delete-city">Xóa vĩnh viễn</button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default PickupPointsPage;
