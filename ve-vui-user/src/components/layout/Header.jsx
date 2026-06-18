// components/layout/Header.jsx
import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiTruck, FiPhone, FiUser, FiMenu, FiX, FiLogOut, FiCreditCard } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { NAV_LINKS } from '../../constants/routes';
import './Header.css';

const Header = ({ transparent = false }) => {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparent]);

  const isSolid = !transparent || scrolled;

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : 'U';

  return (
    <>
      <header className={`header ${isSolid ? 'header-solid' : 'header-transparent'}`}>
        <div className="header-inner">
          {/* Logo */}
          <Link to="/" className="header-logo" onClick={() => setMenuOpen(false)}>
            <div className="header-logo-icon">🎫</div>
            <div className="header-logo-text">
              <div className="header-logo-name">
                <span className="ve">Vé</span>
                <span className="vui"> Vui</span>
              </div>
              <span className="header-logo-tagline">Đặt vé xe dễ dàng</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Navigation chính">
            <ul className="header-nav">
              {NAV_LINKS.map(link => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) => isActive ? 'active' : ''}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions */}
          <div className="header-actions">
            <div className="header-hotline">
              <FiPhone size={14} />
              <span>1900 6067</span>
            </div>

            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link to="/tai-khoan/ve-cua-toi" className="header-user-btn">
                  <div className="header-avatar">{initials}</div>
                  <span>{user.name?.split(' ').pop()}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="header-user-btn"
                  title="Đăng xuất"
                  style={{ padding: '8px 12px' }}
                >
                  <FiLogOut size={16} />
                </button>
              </div>
            ) : (
              <Link to="/dang-nhap" className="header-user-btn">
                <FiUser size={16} />
                <span>Đăng nhập</span>
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              className="header-mobile-toggle"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <ul className="mobile-menu-nav">
          {NAV_LINKS.map(link => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) => isActive ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mobile-menu-footer">
          {isLoggedIn ? (
            <>
              <Link to="/tai-khoan/ve-cua-toi" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
                <FiCreditCard /> Vé của tôi
              </Link>
              <button className="btn btn-ghost" onClick={handleLogout}>
                <FiLogOut /> Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/dang-nhap" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
                <FiUser /> Đăng nhập
              </Link>
              <Link to="/dang-ky" className="btn btn-outline" onClick={() => setMenuOpen(false)}>
                Đăng ký
              </Link>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            <FiPhone size={14} /> Hotline: <strong style={{ color: 'var(--primary)' }}>1900 6067</strong>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 998, top: 72 }}
        />
      )}
    </>
  );
};

export default Header;
