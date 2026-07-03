// pages/LoginPage/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/apiService';
import './LoginPage.css';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Đăng nhập | Vé Vui Admin'; }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginAdmin(form.email, form.password);
      localStorage.setItem('vevui_admin', JSON.stringify({
        name: data.fullName || 'Admin',
        username: data.email,
        token: data.accessToken,
        role: data.role,
      }));
      navigate('/dashboard');
    } catch (apiErr) {
      setError(apiErr.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-page">
      {/* Left brand panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">
            <div className="login-brand-icon">🎫</div>
            <div>
              <div className="login-brand-name"><span>Vé</span> Vui Admin</div>
              <div className="login-brand-sub">Hệ thống quản lý vé xe</div>
            </div>
          </div>
          <div className="login-hero-text">
            <h1>Quản lý toàn diện<br/>hệ thống đặt vé xe</h1>
            <p>Theo dõi doanh thu, quản lý chuyến đi, xe và hành khách tập trung trên một nền tảng duy nhất.</p>
          </div>
          <div className="login-stats">
            {[['500K+','Vé đã bán'],['200+','Tuyến đường'],['50+','Đầu xe']].map(([val,label]) => (
              <div key={label} className="ls-item">
                <div className="ls-val">{val}</div>
                <div className="ls-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Floating decorative cards */}
          <div className="login-deco-card ldc-1">
            <div style={{ fontSize:'1.25rem', marginBottom:4 }}>📈</div>
            <div style={{ fontWeight:800, fontSize:'1.1rem' }}>+18.5%</div>
            <div style={{ fontSize:'0.75rem', opacity:0.75 }}>Doanh thu tháng này</div>
          </div>
          <div className="login-deco-card ldc-2">
            <div style={{ fontSize:'1.25rem', marginBottom:4 }}>🎫</div>
            <div style={{ fontWeight:800, fontSize:'1.1rem' }}>780 vé</div>
            <div style={{ fontSize:'0.75rem', opacity:0.75 }}>Bán trong tháng 6</div>
          </div>

          {/* Bubbles */}
          <div className="lb1" /><div className="lb2" /><div className="lb3" />
        </div>
      </div>

      {/* Right form */}
      <div className="login-right">
        <div className="login-form-box">
          <div className="lfb-icon">🔐</div>
          <h2 className="lfb-title">Đăng nhập Admin</h2>
          <p className="lfb-sub">Chỉ dành cho quản trị viên hệ thống</p>

          <form onSubmit={handleSubmit}>
            <div className="a-form-group" style={{ marginBottom:'var(--sp-4)' }}>
              <label className="a-label">Email</label>
              <input
                className="a-input"
                type="email"
                placeholder="admin@vevui.vn"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                id="admin-username"
                autoComplete="username"
              />
            </div>
            <div className="a-form-group" style={{ marginBottom:'var(--sp-5)' }}>
              <label className="a-label">Mật khẩu</label>
              <input
                className="a-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                id="admin-password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{ padding:'10px 14px', background:'var(--danger-bg)', color:'var(--danger)', borderRadius:'var(--r-md)', fontSize:'0.875rem', fontWeight:600, marginBottom:'var(--sp-4)' }}>
                ⚠️ {error}
              </div>
            )}

            <button className="a-btn a-btn-primary" style={{ width:'100%', padding:'14px', fontSize:'1rem' }} type="submit" disabled={loading} id="admin-login">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="login-hint">
            <div>💡 Demo: <strong>admin@vevui.vn</strong> / <strong>admin123</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
