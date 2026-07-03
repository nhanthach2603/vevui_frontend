// pages/SettingsPage/SettingsPage.jsx
import { useEffect, useState } from 'react';
import { FiSave, FiUser, FiLock, FiGlobe, FiBell } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchUsers } from '../../services/apiService';

const SettingsPage = () => {
  useEffect(() => { document.title = 'Cài đặt | Vé Vui Admin'; }, []);

  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const adminData = (() => {
    try { return JSON.parse(localStorage.getItem('vevui_admin') || '{}'); } catch { return {}; }
  })();

  const [profile, setProfile] = useState({
    name: adminData.name || '',
    email: adminData.username || '',
    phone: '',
  });

  const [password, setPassword] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  const [notifications, setNotifications] = useState({
    newTicket: true,
    cancelTicket: true,
    dailyReport: false,
    promotion: true,
  });

  useEffect(() => {
    // Load profile from API
    const loadProfile = async () => {
      try {
        const data = await fetchUsers(0, 1);
        const adminUser = data?.content?.find(u => u.email === adminData.username) || data?.content?.[0];
        if (adminUser) {
          setProfile({
            name: adminUser.fullName || adminData.name || '',
            email: adminUser.email || adminData.username || '',
            phone: adminUser.phone || '',
          });
        }
      } catch {}
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save (backend doesn't have profile update for admin yet)
    await new Promise(r => setTimeout(r, 500));
    // Update localStorage with new name
    const stored = JSON.parse(localStorage.getItem('vevui_admin') || '{}');
    stored.name = profile.name;
    localStorage.setItem('vevui_admin', JSON.stringify(stored));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Hồ sơ', icon: <FiUser size={15} /> },
    { id: 'password', label: 'Mật khẩu', icon: <FiLock size={15} /> },
    { id: 'notifications', label: 'Thông báo', icon: <FiBell size={15} /> },
    { id: 'system', label: 'Hệ thống', icon: <FiGlobe size={15} /> },
  ];

  return (
    <AdminLayout title="Cài đặt">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cài đặt hệ thống</h1>
          <p className="page-subtitle">Quản lý tài khoản và tùy chỉnh ứng dụng</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--sp-5)' }}>
        {/* Tabs sidebar */}
        <div className="a-card" style={{ padding: 'var(--sp-3)', height: 'fit-content' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '10px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--primary-bg)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.875rem',
                transition: 'all 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="a-card" style={{ padding: 'var(--sp-5)' }}>
          {saved && (
            <div style={{
              padding: '10px 16px', borderRadius: 8, marginBottom: 'var(--sp-4)',
              background: '#ECFDF5', color: '#065F46', fontWeight: 600, fontSize: '0.875rem',
            }}>
              Đã lưu thành công!
            </div>
          )}

          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>Thông tin cá nhân</h3>
              <div style={{ display: 'grid', gap: 'var(--sp-4)', maxWidth: 480 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>Họ tên</label>
                  <input
                    className="a-input"
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    id="settings-name"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>Email</label>
                  <input
                    className="a-input"
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    id="settings-email"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>Số điện thoại</label>
                  <input
                    className="a-input"
                    value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    id="settings-phone"
                  />
                </div>
                <button className="a-btn a-btn-primary" style={{ width: 'fit-content' }} onClick={handleSave} id="save-profile">
                  <FiSave size={15} /> Lưu thay đổi
                </button>
              </div>
            </div>
          )}

          {/* Password tab */}
          {activeTab === 'password' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>Đổi mật khẩu</h3>
              <div style={{ display: 'grid', gap: 'var(--sp-4)', maxWidth: 480 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>Mật khẩu hiện tại</label>
                  <input
                    className="a-input"
                    type="password"
                    value={password.current}
                    onChange={e => setPassword({ ...password, current: e.target.value })}
                    id="settings-current-pw"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>Mật khẩu mới</label>
                  <input
                    className="a-input"
                    type="password"
                    value={password.newPass}
                    onChange={e => setPassword({ ...password, newPass: e.target.value })}
                    id="settings-new-pw"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>Xác nhận mật khẩu mới</label>
                  <input
                    className="a-input"
                    type="password"
                    value={password.confirm}
                    onChange={e => setPassword({ ...password, confirm: e.target.value })}
                    id="settings-confirm-pw"
                  />
                </div>
                <button className="a-btn a-btn-primary" style={{ width: 'fit-content' }} onClick={handleSave} id="save-password">
                  <FiSave size={15} /> Cập nhật mật khẩu
                </button>
              </div>
            </div>
          )}

          {/* Notifications tab */}
          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>Tùy chọn thông báo</h3>
              <div style={{ display: 'grid', gap: 'var(--sp-3)', maxWidth: 480 }}>
                {[
                  { key: 'newTicket', label: 'Vé mới đặt', desc: 'Nhận thông báo khi có vé mới' },
                  { key: 'cancelTicket', label: 'Vé bị hủy', desc: 'Thông báo khi khách hủy vé' },
                  { key: 'dailyReport', label: 'Báo cáo hàng ngày', desc: 'Gửi báo cáo doanh thu mỗi ngày' },
                  { key: 'promotion', label: 'Khuyến mãi', desc: 'Thông báo về chương trình khuyến mãi' },
                ].map(item => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: 8, border: '1px solid var(--gray-100)',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                      id={`notif-${item.key}`}
                    />
                  </label>
                ))}
                <button className="a-btn a-btn-primary" style={{ width: 'fit-content', marginTop: 8 }} onClick={handleSave} id="save-notifications">
                  <FiSave size={15} /> Lưu cài đặt
                </button>
              </div>
            </div>
          )}

          {/* System tab */}
          {activeTab === 'system' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>Thông tin hệ thống</h3>
              <div style={{ display: 'grid', gap: 0, maxWidth: 480 }}>
                {[
                  ['Ứng dụng', 'Vé Vui Admin'],
                  ['Phiên bản', '1.0.0'],
                  ['Framework', 'React 19 + Vite 8'],
                  ['Ngôn ngữ', 'Tiếng Việt'],
                  ['ENV', 'Development'],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '12px 0',
                    borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem',
                  }}>
                    <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                    <span style={{ fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
