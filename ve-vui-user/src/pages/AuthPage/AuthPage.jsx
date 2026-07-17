// pages/AuthPage/AuthPage.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLock, FiPhone, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { authApi, ApiError } from '../../services/api';
import './AuthPage.css';

const AuthPage = () => {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { login, register, isLoggedIn } = useAuth();

  const isRegisterPath = location.pathname === '/dang-ky';
  const [mode, setMode] = useState(isRegisterPath ? 'register' : 'login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });

  // Register OTP state
  const [registerStep, setRegisterStep] = useState(1); // 1=form, 2=otp
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const otpRefs = useRef([]);

  useEffect(() => {
    document.title = mode === 'login' ? 'Đăng nhập | Vé Vui' : 'Đăng ký | Vé Vui';
    if (isLoggedIn) {
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [mode, isLoggedIn]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Reset register state when switching modes
  useEffect(() => {
    setRegisterStep(1);
    setOtp(['', '', '', '', '', '']);
    setError('');
  }, [mode]);

  const handle = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setError('');
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Step 1: Login or Register (send OTP)
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        if (!form.email || !form.password) {
          setError('Vui lòng nhập đầy đủ thông tin');
          setLoading(false);
          return;
        }
        await login(form.email, form.password);
        const from = location.state?.from || '/';
        navigate(from, { replace: true });
      } else {
        // Register step 1: send OTP
        if (!form.name || !form.email || !form.password) {
          setError('Vui lòng nhập đầy đủ thông tin');
          setLoading(false);
          return;
        }
        if (form.password.length < 6) {
          setError('Mật khẩu phải ít nhất 6 ký tự');
          setLoading(false);
          return;
        }
        await authApi.registerSendOtp({
          fullName: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
        });
        setRegisterStep(2);
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Email hoặc mật khẩu không đúng');
        else if (err.status === 409) setError('Email này đã được đăng ký. Vui lòng đăng nhập.');
        else if (err.status === 400) setError(err.message || 'Thông tin không hợp lệ');
        else setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
      } else {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP + create account
  const handleVerifyRegisterOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.registerVerify(form.email, code);
      // Store tokens + user data
      localStorage.setItem('vevui_user', JSON.stringify(res));
      localStorage.setItem('vevui_access_token', res.accessToken);
      localStorage.setItem('vevui_refresh_token', res.refreshToken);
      window.location.href = '/';
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) setError(err.message || 'Mã OTP không chính xác');
        else setError('Có lỗi xảy ra. Vui lòng thử lại.');
      } else {
        setError('Không thể kết nối đến máy chủ.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegisterOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      await authApi.registerSendOtp({
        fullName: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Không thể gửi lại mã');
    }
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
          <div className="auth-bubble ab1" />
          <div className="auth-bubble ab2" />
          <div className="auth-bubble ab3" />
        </div>
      </div>

      {/* Right form */}
      <div className="auth-right">
        <div className="auth-form-wrapper animate-fadeInRight">
          {/* Tabs — only show when in login mode or register step 1 */}
          {(mode === 'login' || registerStep === 1) && (
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setError(''); }}
              >
                Đăng nhập
              </button>
              <button
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => { setMode('register'); setError(''); }}
              >
                Đăng ký
              </button>
            </div>
          )}

          {/* Register OTP header */}
          {mode === 'register' && registerStep === 2 && (
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <button
                type="button"
                onClick={() => { setRegisterStep(1); setOtp(['', '', '', '', '', '']); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'var(--font-primary)', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                id="reg-back-to-form"
              >
                ← Quay lại
              </button>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 'var(--space-3)', marginBottom: 4 }}>Xác minh email</h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                Mã 6 chữ số đã được gửi về <strong>{form.email}</strong>
              </p>
            </div>
          )}

          {/* === LOGIN FORM === */}
          {mode === 'login' && (
            <form onSubmit={submit} className="auth-form" id="auth-form">
              <div className="form-group">
                <label className="form-label"><FiMail size={14} /> Email *</label>
                <input className="form-input" placeholder="email@example.com" type="email" value={form.email} onChange={handle('email')} id="auth-email" required />
              </div>
              <div className="form-group">
                <label className="form-label"><FiLock size={14} /> Mật khẩu *</label>
                <div className="password-wrapper">
                  <input className="form-input" placeholder="••••••••" type={showPw ? 'text' : 'password'} value={form.password} onChange={handle('password')} id="auth-password" required minLength={6} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                    {showPw ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div className="auth-forgot"><Link to="/quen-mat-khau">Quên mật khẩu?</Link></div>
              {error && <div className="auth-error">⚠️ {error}</div>}
              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8 }} type="submit" disabled={loading} id="auth-submit">
                {loading ? <span className="loading-dots">Đang xử lý<span>.</span><span>.</span><span>.</span></span> : 'Đăng nhập'}
              </button>
            </form>
          )}

          {/* === REGISTER FORM (Step 1) === */}
          {mode === 'register' && registerStep === 1 && (
            <form onSubmit={submit} className="auth-form" id="auth-form">
              <div className="form-group">
                <label className="form-label"><FiUser size={14} /> Họ và tên *</label>
                <input className="form-input" placeholder="Nguyễn Văn A" value={form.name} onChange={handle('name')} id="reg-name" required />
              </div>
              <div className="form-group">
                <label className="form-label"><FiPhone size={14} /> Số điện thoại</label>
                <input className="form-input" placeholder="0901234567" value={form.phone} onChange={handle('phone')} type="tel" id="reg-phone" />
              </div>
              <div className="form-group">
                <label className="form-label"><FiMail size={14} /> Email *</label>
                <input className="form-input" placeholder="email@example.com" type="email" value={form.email} onChange={handle('email')} id="auth-email" required />
              </div>
              <div className="form-group">
                <label className="form-label"><FiLock size={14} /> Mật khẩu *</label>
                <div className="password-wrapper">
                  <input className="form-input" placeholder="••••••••" type={showPw ? 'text' : 'password'} value={form.password} onChange={handle('password')} id="auth-password" required minLength={6} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                    {showPw ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              {error && <div className="auth-error">⚠️ {error}</div>}
              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8 }} type="submit" disabled={loading} id="auth-submit">
                {loading ? <span className="loading-dots">Đang gửi OTP<span>.</span><span>.</span><span>.</span></span> : 'Gửi mã xác minh'}
              </button>
            </form>
          )}

          {/* === REGISTER OTP (Step 2) === */}
          {mode === 'register' && registerStep === 2 && (
            <form onSubmit={handleVerifyRegisterOtp} className="auth-form" id="auth-register-otp">
              <div className="forgot-otp-inputs">
                {otp.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                    id={`reg-otp-${i}`}
                  />
                ))}
              </div>
              <div className="forgot-resend" style={{ marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={handleResendRegisterOtp} disabled={resendTimer > 0 || loading} id="reg-resend-otp">
                  {resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : 'Gửi lại mã'}
                </button>
              </div>
              {error && <div className="auth-error">⚠️ {error}</div>}
              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8 }} type="submit" disabled={loading} id="reg-verify-otp">
                {loading ? <span className="loading-dots">Đang xác minh<span>.</span><span>.</span><span>.</span></span> : 'Xác minh & Tạo tài khoản'}
              </button>
            </form>
          )}

          {/* Social + Terms — only in login/register form mode */}
          {(mode === 'login' || registerStep === 1) && (
            <>
              <div className="auth-divider"><span>hoặc</span></div>
              <div className="auth-social">
                <button className="social-auth-btn google">🇬 Đăng nhập với Google</button>
                <button className="social-auth-btn fb">📘 Đăng nhập với Facebook</button>
              </div>
              <p className="auth-terms">
                Bằng cách đăng ký, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a> của Vé Vui.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
