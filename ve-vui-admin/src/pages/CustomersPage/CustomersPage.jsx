// pages/CustomersPage/CustomersPage.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  FiSearch, FiEye, FiUsers, FiUserCheck, FiUserX, FiTrash2,
  FiTag, FiLock, FiUnlock, FiX, FiClock, FiCheckCircle,
  FiMapPin, FiArrowRight, FiLoader
} from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  fetchUsers, searchUsers, updateUserStatus, deleteUser,
  fetchUserTickets, cancelTicket, fetchTicketById
} from '../../services/apiService';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatPrice } from '../../services/apiService';

const STATUS_MAP = {
  PENDING:   { label: 'Chờ xác nhận', color: '#f59e0b' },
  CONFIRMED: { label: 'Đã xác nhận',  color: '#10b981' },
  USED:      { label: 'Đã sử dụng',   color: '#6b7280' },
  CANCELLED: { label: 'Đã hủy',       color: '#ef4444' },
  REFUNDED:  { label: 'Đã hoàn tiền', color: '#8b5cf6' },
};

const CustomersPage = () => {
  const [customers, setCustomers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [viewItem, setView]             = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Ticket modal
  const [ticketModal, setTicketModal]     = useState(null);
  const [tickets, setTickets]             = useState([]);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Ticket detail modal
  const [ticketDetail, setTicketDetail]     = useState(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [cancelLoading, setCancelLoading]   = useState(null);

  useEffect(() => { document.title = 'Quản lý người dùng | Vé Vui Admin'; }, []);

  // Load users + their ticket counts
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      const users = data?.content || [];
      // Fetch ticket count for each user in parallel
      const counts = await Promise.all(
        users.map(u =>
          fetchUserTickets(u.id)
            .then(tickets => ({ id: u.id, count: (tickets || []).length }))
            .catch(() => ({ id: u.id, count: 0 }))
        )
      );
      const countMap = {};
      counts.forEach(c => { countMap[c.id] = c.count; });

      const mapped = users.map(u => ({
        id: u.id,
        name: u.fullName || u.email,
        phone: u.phone || '—',
        email: u.email,
        status: u.enabled !== false ? 'ACTIVE' : 'BANNED',
        joinedAt: u.createdAt || new Date().toISOString(),
        totalTrips: countMap[u.id] || 0,
      }));
      setCustomers(mapped);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSearch = useCallback((q) => {
    setSearch(q);
    if (!q.trim()) { loadUsers(); return; }
    setSearchLoading(true);
    searchUsers(q).then(async data => {
      const users = Array.isArray(data) ? data : (data?.content || []);
      const counts = await Promise.all(
        users.map(u =>
          fetchUserTickets(u.id)
            .then(t => ({ id: u.id, count: (t || []).length }))
            .catch(() => ({ id: u.id, count: 0 }))
        )
      );
      const countMap = {};
      counts.forEach(c => { countMap[c.id] = c.count; });
      setCustomers(users.map(u => ({
        id: u.id,
        name: u.fullName || u.email,
        phone: u.phone || '—',
        email: u.email,
        status: u.enabled !== false ? 'ACTIVE' : 'BANNED',
        joinedAt: u.createdAt || new Date().toISOString(),
        totalTrips: countMap[u.id] || 0,
      })));
    }).catch(() => {}).finally(() => setSearchLoading(false));
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
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (customer) => {
    setActionLoading(customer.id);
    try {
      await deleteUser(customer.id);
      setCustomers(cs => cs.filter(c => c.id !== customer.id));
      setConfirmDialog(null);
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  // ── Xem danh sách vé ──
  const handleViewTickets = async (customer) => {
    setTicketModal(customer);
    setTicketLoading(true);
    try {
      const data = await fetchUserTickets(customer.id);
      setTickets(Array.isArray(data) ? data : (data?.content || []));
    } catch { setTickets([]); }
    finally { setTicketLoading(false); }
  };

  // ── Xem chi tiết 1 vé ──
  const handleViewTicketDetail = async (ticketId) => {
    setTicketDetailLoading(true);
    try {
      const data = await fetchTicketById(ticketId);
      setTicketDetail(data);
    } catch { setTicketDetail(null); }
    finally { setTicketDetailLoading(false); }
  };

  // ── Hủy vé ──
  const handleCancelTicket = async (ticketId) => {
    setCancelLoading(ticketId);
    try {
      await cancelTicket(ticketId);
      setTickets(prev => prev.map(t =>
        (t.id || t.ticketId) === ticketId ? { ...t, status: 'CANCELLED' } : t
      ));
      if (ticketDetail && (ticketDetail.id || ticketDetail.ticketId) === ticketId) {
        setTicketDetail(prev => ({ ...prev, status: 'CANCELLED' }));
      }
    } catch (err) { console.error(err); }
    finally { setCancelLoading(null); }
  };

  const active  = customers.filter(c => c.status === 'ACTIVE').length;
  const banned  = customers.filter(c => c.status === 'BANNED').length;

  return (
    <AdminLayout title="Quản lý người dùng">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý người dùng</h1>
          <p className="page-subtitle">{customers.length} người dùng</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid stats-grid-3">
        {[
          { icon: <FiUsers />,     label: 'Tổng người dùng', val: customers.length, color: 'blue' },
          { icon: <FiUserCheck />, label: 'Đang hoạt động',   val: active,           color: 'green' },
          { icon: <FiUserX />,     label: 'Bị khóa',           val: banned,           color: 'red' },
        ].map(s => (
          <div key={s.label} className="a-card" style={{ padding: 'var(--sp-5)', display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
            <div className={`kpi-icon ${s.color}`}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gray-900)' }}>{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="a-card" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="a-card-body card-filter-body">
          <div className="filter-bar search-box" style={{ maxWidth: 400 }}>
            <SearchInput value={search} onChange={handleSearch} placeholder="Tìm theo tên, SĐT, email..." id="customer-search" />
            {searchLoading && <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Đang tìm...</span>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="a-card">
        <div className="a-card-scroll">
          <table className="a-table">
            <thead>
              <tr><th>Người dùng</th><th>Liên hệ</th><th>Số chuyến</th><th>Ngày đăng ký</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>Không tìm thấy người dùng</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 38, height: 38, background: 'var(--primary-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>#{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.phone}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{c.email}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.totalTrips}</span>
                    <span style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}> chuyến</span>
                  </td>
                  <td>{new Date(c.joinedAt).toLocaleDateString('vi-VN')}</td>
                  <td><StatusBadge status={c.status === 'ACTIVE' ? 'CONFIRMED' : 'CANCELLED'} /></td>
                  <td>
                    <div className="action-row">
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setView(c)} title="Xem chi tiết">
                        <FiEye size={14} />
                      </button>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => handleViewTickets(c)} title="Xem vé">
                        <FiTag size={14} />
                      </button>
                      <button
                        className={`a-btn a-btn-sm ${c.status === 'ACTIVE' ? 'a-btn-ghost' : 'a-btn-success'}`}
                        style={{ fontSize: '0.75rem', ...(c.status === 'ACTIVE' ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : {}) }}
                        onClick={() => toggleStatus(c)}
                        disabled={actionLoading === c.id}
                        title={c.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                      >
                        {actionLoading === c.id ? '...' : (c.status === 'ACTIVE' ? <><FiLock size={12} /> Khóa</> : <><FiUnlock size={12} /> Mở khóa</>)}
                      </button>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDialog(c)} title="Xóa">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ View User Detail Modal ═══ */}
      {viewItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setView(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Thông tin người dùng</div>
              <button className="modal-close" onClick={() => setView(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
                <div style={{ width: 60, height: 60, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.5rem' }}>
                  {viewItem.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{viewItem.name}</div>
                  <span className={`a-badge ${viewItem.status === 'ACTIVE' ? 'a-badge-green' : 'a-badge-red'}`}>
                    {viewItem.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </div>
              </div>
              {[
                ['Số điện thoại', viewItem.phone],
                ['Email', viewItem.email],
                ['Tổng chuyến đi', `${viewItem.totalTrips} chuyến`],
                ['Ngày đăng ký', new Date(viewItem.joinedAt).toLocaleDateString('vi-VN')],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                  <span style={{ fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-primary" onClick={() => { setView(null); handleViewTickets(viewItem); }}>
                <FiTag size={14} /> Xem vé đã đặt
              </button>
              <button className="a-btn a-btn-ghost" onClick={() => setView(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Ticket History Modal ═══ */}
      {ticketModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setTicketModal(null)}>
          <div className="modal-box" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div className="modal-title">Vé đã đặt — {ticketModal.name}</div>
              <button className="modal-close" onClick={() => { setTicketModal(null); setTickets([]); }}>×</button>
            </div>
            <div className="modal-body">
              {ticketLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                  <FiLoader size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '0.5rem' }}>Đang tải...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎫</div>
                  <p>Người dùng này chưa có vé nào</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {tickets.map(t => {
                    const tid = t.id || t.ticketId;
                    const st = STATUS_MAP[t.status] || { label: t.status, color: '#6b7280' };
                    return (
                      <div
                        key={tid}
                        onClick={() => handleViewTicketDetail(tid)}
                        style={{
                          border: '1.5px solid var(--gray-100)',
                          borderRadius: '12px',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-100)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: 'var(--gray-600)' }}>#{tid}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, color: st.color, background: st.color + '15' }}>
                            {st.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <FiMapPin size={12} color="var(--primary)" />
                          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                            {t.fromCity || '—'}
                          </span>
                          <FiArrowRight size={12} color="var(--gray-400)" />
                          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                            {t.toCity || '—'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <span>
                              <FiClock size={11} style={{ verticalAlign: -1 }} />{' '}
                              {t.tripDate ? new Date(t.tripDate + 'T00:00:00').toLocaleDateString('vi-VN') : '—'}
                              {t.departureTime ? ` ${t.departureTime}` : ''}
                            </span>
                            <span>Ghế: {t.seats?.join(', ') || '—'}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {t.totalPrice ? formatPrice(t.totalPrice) : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => { setTicketModal(null); setTickets([]); }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Ticket Detail Modal ═══ */}
      {ticketDetail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setTicketDetail(null)}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">Chi tiết vé</div>
              <button className="modal-close" onClick={() => setTicketDetail(null)}>×</button>
            </div>
            <div className="modal-body">
              {ticketDetailLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                  <FiLoader size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <>
                  {/* Status badge */}
                  <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    {(() => {
                      const st = STATUS_MAP[ticketDetail.status] || { label: ticketDetail.status, color: '#6b7280' };
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, color: st.color, background: st.color + '15' }}>
                          {st.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Route */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.25rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{ticketDetail.fromCity || '—'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{ticketDetail.departureTime || '—'}</div>
                    </div>
                    <FiArrowRight size={20} color="var(--primary)" />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{ticketDetail.toCity || '—'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{ticketDetail.arrivalTime || '—'}</div>
                    </div>
                  </div>

                  {/* Info rows */}
                  {[
                    ['Mã vé', <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{ticketDetail.id || ticketDetail.ticketId}</span>],
                    ['Ngày đi', ticketDetail.tripDate ? new Date(ticketDetail.tripDate + 'T00:00:00').toLocaleDateString('vi-VN') : '—'],
                    ['Ghế', ticketDetail.seats?.join(', ') || '—'],
                    ['Hành khách', ticketDetail.customerName || '—'],
                    ['Số điện thoại', ticketDetail.phone || '—'],
                    ['Email', ticketDetail.email || '—'],
                    ['Tổng tiền', <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{ticketDetail.totalPrice ? formatPrice(ticketDetail.totalPrice) : '—'}</span>],
                    ['Ngày đặt', ticketDetail.bookedAt ? new Date(ticketDetail.bookedAt).toLocaleString('vi-VN') : '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="modal-footer" style={{ gap: '0.5rem' }}>
              {ticketDetail.status !== 'CANCELLED' && ticketDetail.status !== 'USED' && ticketDetail.status !== 'REFUNDED' && (
                <button
                  className="a-btn a-btn-sm"
                  style={{ color: 'white', background: 'var(--danger, #ef4444)', borderColor: 'var(--danger, #ef4444)' }}
                  onClick={() => handleCancelTicket(ticketDetail.id || ticketDetail.ticketId)}
                  disabled={cancelLoading === (ticketDetail.id || ticketDetail.ticketId)}
                >
                  {cancelLoading === (ticketDetail.id || ticketDetail.ticketId) ? 'Đang hủy...' : 'Hủy vé'}
                </button>
              )}
              <button className="a-btn a-btn-ghost" onClick={() => setTicketDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDialog && (
        <ConfirmDialog
          message={`Bạn có chắc muốn xóa người dùng "${confirmDialog.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={() => handleDelete(confirmDialog)}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </AdminLayout>
  );
};

export default CustomersPage;
