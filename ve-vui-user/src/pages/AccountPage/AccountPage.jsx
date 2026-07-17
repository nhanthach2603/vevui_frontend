// pages/AccountPage/AccountPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FiUser, FiLock, FiCreditCard, FiPhone, FiMail, FiEdit3, FiSave,
  FiEye, FiEyeOff, FiArrowRight, FiCheckCircle, FiXCircle, FiClock,
  FiLoader, FiChevronRight
} from 'react-icons/fi';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { ticketApi, formatPrice, ApiError } from '../../services/api';
import './AccountPage.css';

const TABS = [
  { key: 'tickets', label: 'Vé của tôi', icon: FiCreditCard },
  { key: 'profile', label: 'Thông tin tài khoản', icon: FiUser },
  { key: 'password', label: 'Đổi mật khẩu', icon: FiLock },
];

const STATUS_MAP = {
  PENDING:    { label: 'Chờ xác nhận', color: '#f59e0b', icon: FiClock },
  CONFIRMED:  { label: 'Đã xác nhận', color: '#10b981', icon: FiCheckCircle },
  USED:       { label: 'Đã sử dụng',  color: '#6b7280', icon: FiCheckCircle },
  CANCELLED:  { label: 'Đã hủy',      color: '#ef4444', icon: FiXCircle },
  REFUNDED:   { label: 'Đã hoàn tiền', color: '#8b5cf6', icon: FiXCircle },
};

const AccountPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser, isLoggedIn } = useAuth();

  // Determine active tab from URL
  const getTabFromPath = () => {
    if (location.pathname.includes('thong-tin')) return 'profile';
    if (location.pathname.includes('doi-mat-khau')) return 'password';
    return 'tickets';
  };
  const [activeTab, setActiveTab] = useState(getTabFromPath());

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/dang-nhap', { state: { from: '/tai-khoan/ve-cua-toi' } });
    }
  }, [isLoggedIn]);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const switchTab = (tab) => {
    const paths = { tickets: '/tai-khoan/ve-cua-toi', profile: '/tai-khoan/thong-tin', password: '/tai-khoan/doi-mat-khau' };
    navigate(paths[tab]);
  };

  return (
    <div className="account-page">
      <Header />
      <main className="account-main">
        <div className="container">
          <div className="account-layout">
            {/* Sidebar */}
            <aside className="account-sidebar">
              <div className="account-user-card">
                <div className="account-avatar">{user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U'}</div>
                <div className="account-user-info">
                  <div className="account-user-name">{user?.name}</div>
                  <div className="account-user-email">{user?.email}</div>
                </div>
              </div>
              <nav className="account-nav">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    className={`account-nav-item ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => switchTab(tab.key)}
                  >
                    <tab.icon size={18} />
                    <span>{tab.label}</span>
                    <FiChevronRight size={14} className="nav-arrow" />
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="account-content">
              {activeTab === 'tickets' && <MyTicketsTab />}
              {activeTab === 'profile' && <ProfileTab user={user} updateUser={updateUser} />}
              {activeTab === 'password' && <PasswordTab user={user} />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// TAB: VÉ CỦA TÔI
// ═══════════════════════════════════════════════════════
const MyTicketsTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    ticketApi.getMyTickets(user.id)
      .then(data => setTickets(data || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter);

  const now = new Date();
  const upcoming = tickets.filter(t => {
    const d = new Date(t.tripInfo?.date + 'T00:00:00');
    return d >= now && (t.status === 'CONFIRMED' || t.status === 'PENDING');
  });
  const completed = tickets.filter(t => t.status === 'USED' || t.status === 'CONFIRMED' && new Date(t.tripInfo?.date + 'T00:00:00') < now);

  if (loading) {
    return (
      <div className="account-loading">
        <FiLoader size={32} className="spin" />
        <p>Đang tải danh sách vé...</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <h2 className="tab-title">Vé của tôi</h2>

      {/* Stats */}
      <div className="ticket-stats">
        <div className="stat-card">
          <div className="stat-num">{upcoming.length}</div>
          <div className="stat-label">Sắp đi</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{completed.length}</div>
          <div className="stat-label">Đã hoàn thành</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{tickets.length}</div>
          <div className="stat-label">Tổng cộng</div>
        </div>
      </div>

      {/* Filter */}
      <div className="ticket-filters">
        {['ALL', 'PENDING', 'CONFIRMED', 'USED', 'CANCELLED'].map(s => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? 'Tất cả' : STATUS_MAP[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎫</div>
          <p>Chưa có vé nào</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Đặt vé ngay <FiArrowRight />
          </button>
        </div>
      ) : (
        <div className="ticket-list">
          {filtered.map(ticket => {
            const st = STATUS_MAP[ticket.status] || { label: ticket.status, color: '#6b7280', icon: FiClock };
            const StIcon = st.icon;
            return (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <span className="ticket-id">{ticket.id}</span>
                  <span className="ticket-status" style={{ color: st.color, background: st.color + '15' }}>
                    <StIcon size={14} /> {st.label}
                  </span>
                </div>
                <div className="ticket-route">
                  <div className="ticket-city">
                    <span className="dot from" />
                    <div>
                      <div className="city-name">{ticket.tripInfo?.from}</div>
                      <div className="city-time">{ticket.tripInfo?.departureTime}</div>
                    </div>
                  </div>
                  <div className="ticket-line" />
                  <div className="ticket-city">
                    <span className="dot to" />
                    <div>
                      <div className="city-name">{ticket.tripInfo?.to}</div>
                      <div className="city-time">{ticket.tripInfo?.arrivalTime}</div>
                    </div>
                  </div>
                </div>
                <div className="ticket-details">
                  <div className="td-row">
                    <span>Ngày đi</span>
                    <span>{ticket.tripInfo?.date ? new Date(ticket.tripInfo.date + 'T00:00:00').toLocaleDateString('vi-VN') : '—'}</span>
                  </div>
                  <div className="td-row">
                    <span>Ghế</span>
                    <span>{ticket.seats?.join(', ')}</span>
                  </div>
                  <div className="td-row">
                    <span>Thành tiền</span>
                    <span className="td-price">{formatPrice(ticket.totalPrice)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// TAB: THÔNG TIN TÀI KHOẢN
// ═══════════════════════════════════════════════════════
const ProfileTab = ({ user, updateUser }) => {
  const [form, setForm] = useState({ fullName: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setMsg({ type: 'error', text: 'Họ tên phải ít nhất 2 ký tự' });
      return;
    }
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await import('../../services/api').then(m =>
        m.authApi.updateProfile(user.id, {
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
        })
      );
      updateUser({ name: form.fullName.trim(), phone: form.phone.trim() });
      setMsg({ type: 'success', text: 'Cập nhật thành công!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Có lỗi xảy ra' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <h2 className="tab-title">Thông tin tài khoản</h2>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label"><FiUser size={14} /> Họ và tên</label>
          <input
            className="form-input"
            value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div className="form-group">
          <label className="form-label"><FiMail size={14} /> Email</label>
          <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          <span className="input-hint">Email không thể thay đổi</span>
        </div>
        <div className="form-group">
          <label className="form-label"><FiPhone size={14} /> Số điện thoại</label>
          <input
            className="form-input"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="0901234567"
            type="tel"
          />
        </div>
        {msg.text && (
          <div className={`form-msg ${msg.type}`}>{msg.text}</div>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <FiLoader className="spin" size={16} /> : <><FiSave size={16} /> Lưu thay đổi</>}
        </button>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// TAB: ĐỔI MẬT KHẨU
// ═══════════════════════════════════════════════════════
const PasswordTab = ({ user }) => {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!form.oldPassword) { setMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu cũ' }); return; }
    if (!form.newPassword || form.newPassword.length < 6) { setMsg({ type: 'error', text: 'Mật khẩu mới phải ít nhất 6 ký tự' }); return; }
    if (form.newPassword !== form.confirmPassword) { setMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' }); return; }
    if (form.oldPassword === form.newPassword) { setMsg({ type: 'error', text: 'Mật khẩu mới phải khác mật khẩu cũ' }); return; }

    setLoading(true);
    try {
      const { authApi } = await import('../../services/api');
      await authApi.changePassword(form.oldPassword, form.newPassword);
      setMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Có lỗi xảy ra' });
    } finally {
      setLoading(false);
    }
  };

  const toggleShow = (field) => setShowPw(p => ({ ...p, [field]: !p[field] }));

  return (
    <div className="tab-content">
      <h2 className="tab-title">Đổi mật khẩu</h2>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label"><FiLock size={14} /> Mật khẩu hiện tại</label>
          <div className="password-field">
            <input
              className="form-input"
              type={showPw.old ? 'text' : 'password'}
              value={form.oldPassword}
              onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))}
              placeholder="Nhập mật khẩu hiện tại"
            />
            <button type="button" className="pw-toggle" onClick={() => toggleShow('old')}>
              {showPw.old ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label"><FiLock size={14} /> Mật khẩu mới</label>
          <div className="password-field">
            <input
              className="form-input"
              type={showPw.new ? 'text' : 'password'}
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="Ít nhất 6 ký tự"
            />
            <button type="button" className="pw-toggle" onClick={() => toggleShow('new')}>
              {showPw.new ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label"><FiLock size={14} /> Xác nhận mật khẩu mới</label>
          <div className="password-field">
            <input
              className="form-input"
              type={showPw.confirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Nhập lại mật khẩu mới"
            />
            <button type="button" className="pw-toggle" onClick={() => toggleShow('confirm')}>
              {showPw.confirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>
        {msg.text && (
          <div className={`form-msg ${msg.type}`}>{msg.text}</div>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <FiLoader className="spin" size={16} /> : <><FiLock size={16} /> Đổi mật khẩu</>}
        </button>
      </form>
    </div>
  );
};

export default AccountPage;
