// components/layout/AdminLayout.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiMap, FiTruck, FiCalendar, FiCreditCard,
  FiUsers, FiFileText, FiBarChart2, FiSettings,
  FiBell, FiSearch, FiMenu, FiX, FiLogOut, FiChevronDown, FiMapPin
} from 'react-icons/fi';

const NAV_ITEMS = [
  {
    label: 'Tổng quan',
    items: [
      { to: '/dashboard',  label: 'Dashboard',    icon: <FiGrid /> },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      { to: '/routes',   label: 'Tuyến đường', icon: <FiMap />,       badge: null },
      { to: '/buses',    label: 'Quản lý xe',  icon: <FiTruck />,     badge: null },
      { to: '/trips',    label: 'Chuyến đi',   icon: <FiCalendar />,  badge: null },
      { to: '/tickets',  label: 'Vé đặt',      icon: <FiCreditCard />,badge: null },
      { to: '/customers',label: 'Người dùng',  icon: <FiUsers />,     badge: null },
    ],
  },
  {
    label: 'Nội dung',
    items: [
      { to: '/news',     label: 'Tin tức',    icon: <FiFileText />,  badge: null },
      { to: '/reports',  label: 'Báo cáo',    icon: <FiBarChart2 />, badge: null },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/settings', label: 'Cài đặt',   icon: <FiSettings />,  badge: null },
    ],
  },
];

const AdminLayout = ({ children, title = 'Dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('vevui_admin');
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="sidebar-brand-icon">🎫</div>
          <div>
            <div className="sidebar-brand-name"><span>Vé</span> Vui</div>
            <div className="sidebar-brand-sub">Admin Dashboard</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(section => (
            <div key={section.label}>
              <div className="sidebar-nav-label">{section.label}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                  id={`nav-${item.to.replace('/','')||'dashboard'}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            className="sidebar-nav-item"
            onClick={handleLogout}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sidebar-text)' }}
          >
            <span className="nav-icon"><FiLogOut /></span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199 }}
        />
      )}

      {/* Main */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="topbar-menu-btn" onClick={() => setSidebarOpen(o => !o)} id="sidebar-toggle">
              {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
            <div className="topbar-breadcrumb">
              <strong>{title}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-search" id="admin-search">
              <FiSearch size={14} />
              <span>Tìm kiếm...</span>
            </div>

            <button className="topbar-icon-btn" id="notifications" title="Thông báo">
              <FiBell size={16} />
              <span className="notif-dot" />
            </button>

            <div className="topbar-avatar" id="admin-profile">
              <div className="avatar-circle">A</div>
              <span className="avatar-name">Admin</span>
              <FiChevronDown size={14} style={{ color: 'var(--gray-400)' }} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
