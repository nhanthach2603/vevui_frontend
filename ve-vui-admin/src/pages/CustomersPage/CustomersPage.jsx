// pages/CustomersPage/CustomersPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiEye, FiUsers, FiUserCheck, FiUserX, FiTrash2, FiTag, FiLock, FiUnlock } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchUsers, searchUsers, updateUserStatus, deleteUser, fetchUserTickets } from '../../services/apiService';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [viewItem, setView]       = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ticketModal, setTicketModal]     = useState(null);
  const [tickets, setTickets]             = useState([]);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { document.title = 'Khách hàng | Vé Vui Admin'; }, []);

  useEffect(() => {
    fetchUsers().then(data => {
      const mapped = (data?.content || []).map(u => ({
        id: u.id,
        name: u.fullName || u.email,
        phone: u.phone || '—',
        email: u.email,
        status: u.enabled !== false ? 'ACTIVE' : 'BANNED',
        joinedAt: u.createdAt || new Date().toISOString(),
        totalTrips: u.totalTrips || 0,
      }));
      setCustomers(mapped);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSearch = useCallback((q) => {
    setSearch(q);
    if (!q.trim()) {
      fetchUsers().then(data => {
        const mapped = (data?.content || []).map(u => ({
          id: u.id,
          name: u.fullName || u.email,
          phone: u.phone || '—',
          email: u.email,
          status: u.enabled !== false ? 'ACTIVE' : 'BANNED',
          joinedAt: u.createdAt || new Date().toISOString(),
          totalTrips: u.totalTrips || 0,
        }));
        setCustomers(mapped);
      }).catch(() => {});
      return;
    }
    setSearchLoading(true);
    searchUsers(q).then(data => {
      const mapped = (Array.isArray(data) ? data : (data?.content || [])).map(u => ({
        id: u.id,
        name: u.fullName || u.email,
        phone: u.phone || '—',
        email: u.email,
        status: u.enabled !== false ? 'ACTIVE' : 'BANNED',
        joinedAt: u.createdAt || new Date().toISOString(),
        totalTrips: u.totalTrips || 0,
      }));
      setCustomers(mapped);
      setSearchLoading(false);
    }).catch(() => setSearchLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (customer) => {
    const newStatus = customer.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    setActionLoading(customer.id);
    try {
      await updateUserStatus(customer.id, newStatus);
      setCustomers(cs => cs.map(c => c.id === customer.id ? { ...c, status: newStatus } : c));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (customer) => {
    setActionLoading(customer.id);
    try {
      await deleteUser(customer.id);
      setCustomers(cs => cs.filter(c => c.id !== customer.id));
      setConfirmDialog(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewTickets = async (customer) => {
    setTicketModal(customer);
    setTicketLoading(true);
    try {
      const data = await fetchUserTickets(customer.id);
      setTickets(Array.isArray(data) ? data : (data?.content || []));
    } catch {
      setTickets([]);
    } finally {
      setTicketLoading(false);
    }
  };

  const active   = customers.filter(c=>c.status==='ACTIVE').length;
  const banned  = customers.filter(c=>c.status==='BANNED').length;

  return (
    <AdminLayout title="Khách hàng">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý khách hàng</h1>
          <p className="page-subtitle">{customers.length} khách hàng</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'var(--sp-4)', marginBottom:'var(--sp-5)' }}>
        {[
          { icon:<FiUsers />,    label:'Tổng khách hàng', val:customers.length, color:'blue' },
          { icon:<FiUserCheck />,label:'Đang hoạt động',  val:active,           color:'green' },
          { icon:<FiUserX />,   label:'Bị khóa',          val:banned,           color:'red' },
        ].map(s => (
          <div key={s.label} className="a-card" style={{ padding:'var(--sp-5)', display:'flex', gap:'var(--sp-3)', alignItems:'center' }}>
            <div className={`kpi-icon ${s.color}`}>{s.icon}</div>
            <div><div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase' }}>{s.label}</div><div style={{ fontSize:'1.75rem', fontWeight:900, color:'var(--gray-900)' }}>{s.val}</div></div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-body" style={{ padding:'1rem 1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, maxWidth:400 }}>
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Tìm theo tên, SĐT, email..."
              id="customer-search"
            />
            {searchLoading && <span style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>Đang tìm...</span>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="a-card">
        <div style={{ overflowX:'auto' }}>
          <table className="a-table">
            <thead>
              <tr><th>Khách hàng</th><th>Liên hệ</th><th>Số chuyến</th><th>Ngày đăng ký</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:38, height:38, background:'var(--primary-bg)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)', fontWeight:800, fontSize:'1rem', flexShrink:0 }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight:700 }}>{c.name}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>#{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight:600 }}>{c.phone}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>{c.email}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight:700, color:'var(--primary)' }}>{c.totalTrips}</span>
                    <span style={{ color:'var(--gray-400)', fontSize:'0.82rem' }}> chuyến</span>
                  </td>
                  <td>{new Date(c.joinedAt).toLocaleDateString('vi-VN')}</td>
                  <td><StatusBadge status={c.status === 'ACTIVE' ? 'CONFIRMED' : 'CANCELLED'} /></td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setView(c)} id={`view-customer-${c.id}`} title="Xem chi tiết"><FiEye size={14}/></button>
                      <button
                        className="a-btn a-btn-ghost a-btn-sm a-btn-icon"
                        onClick={() => handleViewTickets(c)}
                        id={`tickets-customer-${c.id}`}
                        title="Xem vé"
                      >
                        <FiTag size={14}/>
                      </button>
                      <button
                        className={`a-btn a-btn-sm ${c.status==='ACTIVE'?'a-btn-ghost':'a-btn-success'}`}
                        style={{ fontSize:'0.75rem', ...(c.status==='ACTIVE' ? { color:'var(--danger)', borderColor:'var(--danger)' } : {}) }}
                        onClick={() => toggleStatus(c)}
                        disabled={actionLoading === c.id}
                        id={`toggle-customer-${c.id}`}
                        title={c.status==='ACTIVE'?'Khóa':'Kích hoạt'}
                      >
                        {actionLoading === c.id ? '...' : (c.status==='ACTIVE' ? <><FiLock size={12}/> Khóa</> : <><FiUnlock size={12}/> Mở khóa</>)}
                      </button>
                      <button
                        className="a-btn a-btn-ghost a-btn-sm a-btn-icon"
                        style={{ color:'var(--danger)' }}
                        onClick={() => setConfirmDialog(c)}
                        id={`delete-customer-${c.id}`}
                        title="Xóa"
                      >
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

      {/* View Modal */}
      {viewItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setView(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Thông tin khách hàng</div>
              <button className="modal-close" onClick={() => setView(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-4)', marginBottom:'var(--sp-5)' }}>
                <div style={{ width:60, height:60, background:'var(--primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:'1.5rem' }}>
                  {viewItem.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize:'1.25rem', fontWeight:800 }}>{viewItem.name}</div>
                  <span className={`a-badge ${viewItem.status==='ACTIVE'?'a-badge-green':'a-badge-red'}`}>{viewItem.status==='ACTIVE'?'Hoạt động':'Bị khóa'}</span>
                </div>
              </div>
              {[
                ['Số điện thoại', viewItem.phone],
                ['Email', viewItem.email],
                ['Tổng chuyến đi', `${viewItem.totalTrips} chuyến`],
                ['Ngày đăng ký', new Date(viewItem.joinedAt).toLocaleDateString('vi-VN')],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--gray-100)', fontSize:'0.875rem' }}>
                  <span style={{ color:'var(--gray-500)' }}>{k}</span>
                  <span style={{ fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setView(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket History Modal */}
      {ticketModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setTicketModal(null)}>
          <div className="modal-box" style={{ maxWidth:640 }}>
            <div className="modal-header">
              <div className="modal-title">Lịch sử vé — {ticketModal.name}</div>
              <button className="modal-close" onClick={() => { setTicketModal(null); setTickets([]); }}>×</button>
            </div>
            <div className="modal-body">
              {ticketLoading ? (
                <div style={{ textAlign:'center', padding:'2rem', color:'var(--gray-400)' }}>Đang tải...</div>
              ) : tickets.length === 0 ? (
                <div style={{ textAlign:'center', padding:'2rem', color:'var(--gray-400)' }}>Không có vé nào</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table className="a-table" style={{ fontSize:'0.82rem' }}>
                    <thead>
                      <tr><th>ID</th><th>Tuyến</th><th>Ngày đi</th><th>Trạng thái</th><th>Giá</th></tr>
                    </thead>
                    <tbody>
                      {tickets.map(t => (
                        <tr key={t.id || t.ticketId}>
                          <td>#{t.id || t.ticketId}</td>
                          <td>{t.routeName || t.fromLocation || '—'}</td>
                          <td>{t.departureDate ? new Date(t.departureDate).toLocaleDateString('vi-VN') : '—'}</td>
                          <td><StatusBadge status={t.status} /></td>
                          <td style={{ fontWeight:700 }}>{t.price ? `${t.price.toLocaleString('vi-VN')}đ` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => { setTicketModal(null); setTickets([]); }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={`Bạn có chắc muốn xóa khách hàng "${confirmDialog.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={() => handleDelete(confirmDialog)}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </AdminLayout>
  );
};

export default CustomersPage;
