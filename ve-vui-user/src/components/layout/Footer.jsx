// components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import {
  FiPhone, FiMail, FiMapPin, FiFacebook, FiYoutube,
  FiArrowRight, FiSend
} from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      {/* Wave top */}
      <div className="footer-wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#0f172a"/>
        </svg>
      </div>

      <div className="footer-body">
        <div className="container">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <div className="footer-logo-icon">🎫</div>
                <div>
                  <div className="footer-logo-name"><span>Vé</span> Vui</div>
                  <div className="footer-logo-tagline">Đặt vé xe dễ dàng</div>
                </div>
              </Link>
              <p className="footer-desc">
                Vé Vui — nền tảng đặt vé xe khách trực tuyến hàng đầu Việt Nam.
                Hơn 200 tuyến trên toàn quốc, đặt vé chỉ trong 2 phút!
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook" className="social-btn fb"><FiFacebook /></a>
                <a href="#" aria-label="Youtube"  className="social-btn yt"><FiYoutube /></a>
                <a href="#" aria-label="Zalo"     className="social-btn zl">Zalo</a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4 className="footer-col-title">Dịch vụ</h4>
              <ul className="footer-links">
                {[
                  ['/', 'Trang chủ'],
                  ['/lich-trinh', 'Lịch trình xe'],
                  ['/tra-cuu-ve', 'Tra cứu vé'],
                  ['/tin-tuc', 'Tin tức'],
                  ['/lien-he', 'Liên hệ'],
                ].map(([to, label]) => (
                  <li key={to}>
                    <Link to={to}><FiArrowRight size={12}/> {label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Info Links */}
            <div className="footer-col">
              <h4 className="footer-col-title">Thông tin</h4>
              <ul className="footer-links">
                {[
                  ['/ve-chung-toi', 'Về chúng tôi'],
                  ['/dieu-khoan-su-dung', 'Điều khoản sử dụng'],
                  ['/chinh-sach-bao-mat', 'Chính sách bảo mật'],
                  ['/hoi-dap', 'Câu hỏi thường gặp'],
                  ['/huong-dan-dat-ve', 'Hướng dẫn đặt vé'],
                ].map(([to, label]) => (
                  <li key={to}>
                    <Link to={to}><FiArrowRight size={12}/> {label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Newsletter */}
            <div className="footer-col">
              <h4 className="footer-col-title">Liên hệ</h4>
              <ul className="footer-contact">
                <li>
                  <FiPhone className="footer-contact-icon" />
                  <div>
                    <span className="label">Hotline (24/7)</span>
                    <a href="tel:19006067" className="value">1900 6067</a>
                  </div>
                </li>
                <li>
                  <FiMail className="footer-contact-icon" />
                  <div>
                    <span className="label">Email</span>
                    <a href="mailto:support@vevui.vn" className="value">support@vevui.vn</a>
                  </div>
                </li>
                <li>
                  <FiMapPin className="footer-contact-icon" />
                  <div>
                    <span className="label">Văn phòng</span>
                    <span className="value">Số 1, Đường Vui Vẻ, Q.1, TP.HCM</span>
                  </div>
                </li>
              </ul>

              <div className="footer-newsletter">
                <p className="footer-newsletter-label">Nhận khuyến mãi mới nhất</p>
                <div className="footer-newsletter-form">
                  <input type="email" placeholder="Email của bạn..." />
                  <button aria-label="Đăng ký"><FiSend /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <div className="container">
          <p>© 2024 Vé Vui. Bảo lưu mọi quyền.</p>
          <div className="footer-bottom-links">
            <Link to="/dieu-khoan-su-dung">Điều khoản</Link>
            <span>·</span>
            <Link to="/chinh-sach-bao-mat">Bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
