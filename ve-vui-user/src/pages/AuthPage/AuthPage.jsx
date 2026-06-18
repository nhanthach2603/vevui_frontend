// pages/AuthPage/AuthPage.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiUser, FiLock, FiPhone, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './AuthPage.css';

const AuthPage = () => {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const { login, register, isLoggedIn } = useAuth();

  const isRegister = params.get('mode') === 'register';
  const [mode, setMode] = useState(isRegister ? 'register' : 'login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });

  useEffect(() => {
    document.title = mode === 'login' ? 'Đăng nhập | Vé Vui' : 'Đăng ký | Vé Vui';
    if (isLoggedIn) navigate('/');
  }, [mode, isLoggedIn]);

  const handle = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    if (mode === 'login') {
      if (!form.email || !form.password) { setError('Vui lòng nhập đầy đủ thông tin'); setLoading(false); return; }
      login({ name: form.email.split('@')[0], email: form.email });
    } else {
      if (!form.name || !form.phone || !form.email || !form.password) { setError('Vui lòng nhập đầy đủ thông tin'); setLoading(false); return; }
      register({ name: form.name, phone: form.phone, email: form.email });
    }
    navigate('/');
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">🎫</div>
            <div className="auth-logo-text">
              <span className="ve">Vé</span><span className="vui"> Vui</span>
            </div>
          </Link>
          <div className="auth-left-main animate-fadeInLeft">
            <h1>Chào mừng đến với<br /><span>Vé Vui!</span></h1>
            <p>Đặt vé xe khách trực tuyến dễ dàng — hơn 200 tuyến, hơn 500 ngàn hành khách tin dùng mỗi tháng.</p>
            <div className="auth-features">
              {['Đặt vé chỉ 2 phút', 'Giá tốt nhất đảm bảo', 'Hoàn tiền 100% nếu hủy trước 24h', 'Vé điện tử gửi ngay qua email'].map(f => (
                <div key={f} className="auth-feature"><span>✓</span> {f}</div>
              ))}
            </div>
          </div>
          {/* Decorative bubbles */}
          <div className="auth-bubble ab1" />
          <div className="auth-bubble ab2" />
          <div className="auth-bubble ab3" />
        </div>
      </div>

      {/* Right form */}
      <div className="auth-right">
        <div className="auth-form-wrapper animate-fadeInRight">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Đăng nhập</button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Đăng ký</button>
          </div>

          <form onSubmit={submit} className="auth-form" id="auth-form">
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label"><FiUser size={14} /> Họ và tên</label>
                  <input className="form-input" placeholder="Nguyễn Văn A" value={form.name} onChange={handle('name')} id="reg-name" />
                </div>
                <div className="form-group">
                  <label className="form-label"><FiPhone size={14} /> Số điện thoại</label>
                  <input className="form-input" placeholder="0901234567" value={form.phone} onChange={handle('phone')} type="tel" id="reg-phone" />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label"><FiMail size={14} /> Email</label>
              <input className="form-input" placeholder="email@example.com" type="email" value={form.email} onChange={handle('email')} id="auth-email" />
            </div>
            <div className="form-group">
              <label className="form-label"><FiLock size={14} /> Mật khẩu</label>
              <div className="password-wrapper">
                <input className="form-input" placeholder="••••••••" type={showPw ? 'text' : 'password'} value={form.password} onChange={handle('password')} id="auth-password" />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="auth-forgot"><a href="#">Quên mật khẩu?</a></div>
            )}

            {error && <div className="auth-error">⚠️ {error}</div>}

            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8 }} type="submit" disabled={loading} id="auth-submit">
              {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="auth-divider"><span>hoặc</span></div>
          <div className="auth-social">
            <button className="social-auth-btn google">🇬 Đăng nhập với Google</button>
            <button className="social-auth-btn fb">📘 Đăng nhập với Facebook</button>
          </div>

          <p className="auth-terms">
            Bằng cách đăng ký, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a> của Vé Vui.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
