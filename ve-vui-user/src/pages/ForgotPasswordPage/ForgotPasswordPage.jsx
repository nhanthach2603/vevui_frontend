// pages/ForgotPasswordPage/ForgotPasswordPage.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { authApi } from '../../services/api';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password, 4=success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const otpRefs = useRef([]);

  useEffect(() => { document.title = 'Quên mật khẩu | Vé Vui'; }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError(err.message || 'Không thể gửi mã xác minh');
    }
    setLoading(false);
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.verifyOtp(email, code);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Mã OTP không chính xác');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const code = otp.join('');
      await authApi.resetPassword(email, code, newPassword);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Không thể đặt lại mật khẩu');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Không thể gửi lại mã');
    }
    setLoading(false);
  };

  return (
    <div className="forgot-page">
      {/* Left panel */}
      <div className="forgot-left">
        <div className="forgot-left-content">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">🚌</div>
            <div className="auth-logo-text"><span className="ve">Vé</span> <span className="vui">Vui</span></div>
          </Link>
          <div className="forgot-left-main">
            <h1>Đặt lại <span>mật khẩu</span></h1>
            <p>
              Không nhớ mật khẩu? Đừng lo, chúng tôi sẽ giúp bạn đặt lại mật khẩu chỉ trong vài bước đơn giản.
            </p>
          </div>
        </div>
        <div className="auth-bubble ab1" />
        <div className="auth-bubble ab2" />
        <div className="auth-bubble ab3" />
      </div>

      {/* Right panel */}
      <div className="forgot-right">
        <div className="forgot-form-wrapper">
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <Link to="/dang-nhap" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              <FiArrowLeft /> Quay lại đăng nhập
            </Link>
          </div>

          {/* Step indicators */}
          {step <= 3 && (
            <div className="forgot-steps">
              <div className={`forgot-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
                <div className="forgot-step-num">{step > 1 ? <FiCheck size={14}/> : '1'}</div>
                <span>Email</span>
              </div>
              <div className={`forgot-step-connector ${step > 1 ? 'done' : ''}`} />
              <div className={`forgot-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
                <div className="forgot-step-num">{step > 2 ? <FiCheck size={14}/> : '2'}</div>
                <span>OTP</span>
              </div>
              <div className={`forgot-step-connector ${step > 2 ? 'done' : ''}`} />
              <div className={`forgot-step ${step >= 3 ? 'active' : ''}`}>
                <div className="forgot-step-num">3</div>
                <span>Mật khẩu</span>
              </div>
            </div>
          )}

          {/* Step 1: Enter email */}
          {step === 1 && (
            <form className="forgot-form" onSubmit={handleSendOtp}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Quên mật khẩu?</h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: 'var(--space-2)' }}>
                Nhập email tài khoản của bạn. Chúng tôi sẽ gửi mã xác minh 6 chữ số để đặt lại mật khẩu.
              </p>

              <div className="form-group">
                <label className="form-label"><FiMail size={14} /> Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  autoFocus
                  id="forgot-email"
                />
              </div>

              {error && <div className="auth-error">⚠️ {error}</div>}

              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }} type="submit" disabled={loading} id="forgot-send-otp">
                {loading ? 'Đang gửi...' : 'Gửi mã xác minh'}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <form className="forgot-form" onSubmit={handleVerifyOtp}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Nhập mã xác minh</h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: 'var(--space-2)' }}>
                Mã 6 chữ số đã được gửi về <strong>{email}</strong>
              </p>

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
                    id={`otp-input-${i}`}
                  />
                ))}
              </div>

              <div className="forgot-resend">
                <button type="button" onClick={handleResend} disabled={resendTimer > 0 || loading} id="forgot-resend-otp">
                  {resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : 'Gửi lại mã'}
                </button>
              </div>

              {error && <div className="auth-error">⚠️ {error}</div>}

              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }} type="submit" disabled={loading} id="forgot-verify-otp">
                {loading ? 'Đang xác minh...' : 'Xác minh'}
              </button>
            </form>
          )}

          {/* Step 3: New password */}
          {step === 3 && (
            <form className="forgot-form" onSubmit={handleResetPassword}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Đặt mật khẩu mới</h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: 'var(--space-2)' }}>
                Nhập mật khẩu mới cho tài khoản <strong>{email}</strong>
              </p>

              <div className="form-group">
                <label className="form-label"><FiLock size={14} /> Mật khẩu mới</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  minLength={6}
                  required
                  autoFocus
                  id="forgot-new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label"><FiLock size={14} /> Xác nhận mật khẩu</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  minLength={6}
                  required
                  id="forgot-confirm-password"
                />
              </div>

              {error && <div className="auth-error">⚠️ {error}</div>}

              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }} type="submit" disabled={loading} id="forgot-reset-password">
                {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="forgot-success">
              <div className="forgot-success-icon">✅</div>
              <h3>Đặt lại mật khẩu thành công!</h3>
              <p>Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ.</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 'var(--space-5)', padding: '14px 32px', fontSize: '1rem' }}
                onClick={() => navigate('/dang-nhap')}
                id="forgot-go-login"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

          <div className="forgot-back">
            <Link to="/dang-nhap">Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
