-- ════════════════════════════════════════════
--  VÉ VUI — Database Initialization Script
--  Creates schemas and seeds initial data
-- ════════════════════════════════════════════

-- Create databases
CREATE DATABASE IF NOT EXISTS db_users CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db_trips CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db_orders CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db_news CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ensure UTF-8 encoding for client connections
SET NAMES utf8mb4;
SET CHARACTER_SET_CLIENT = utf8mb4;
SET CHARACTER_SET_RESULTS = utf8mb4;

-- Grant privileges
GRANT ALL PRIVILEGES ON db_users.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON db_trips.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON db_orders.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON db_news.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- ── Seed data for db_trips ──────────────────
USE db_trips;

-- Bus Types
INSERT INTO bus_types (id, name, code, total_seats, description, icon) VALUES
(1, 'Ghế ngồi thường', 'STANDARD', 45, 'Xe ghế ngồi thường tiện lợi, 45 chỗ', '🚌'),
(2, 'Ghế ngồi VIP', 'VIP', 34, 'Xe ghế VIP rộng rãi, 34 chỗ cao cấp', '🚌'),
(3, 'Giường nằm', 'SLEEPER', 34, 'Xe giường nằm 2 tầng, 34 giường', '🚌'),
(4, 'Limousine', 'LIMOUSINE', 22, 'Xe Limousine sang trọng 22 chỗ', '🚐')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Buses
INSERT INTO buses (id, plate_number, name, bus_type_id, status) VALUES
(1, '51B-12345', 'Xe Ghế Thường 45 Chỗ', 1, 'ACTIVE'),
(2, '51B-67890', 'Xe Giường Nằm 34 Chỗ', 3, 'ACTIVE'),
(3, '51C-11111', 'Xe Limousine 22 Chỗ', 4, 'ACTIVE'),
(4, '51C-22222', 'Xe VIP 34 Chỗ', 2, 'ACTIVE'),
(5, '51D-33333', 'Xe Giường Nằm Cabin', 3, 'MAINTENANCE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Routes
INSERT INTO routes (id, from_city, to_city, distance_km, duration_minutes, base_price, stops, image_url, popular, active) VALUES
(1, 'TP. Hồ Chí Minh', 'Đà Lạt', 290, 360, 180000, 'Bình Chánh,Dầu Giây,Bảo Lộc', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600', TRUE, TRUE),
(2, 'TP. Hồ Chí Minh', 'Nha Trang', 445, 540, 250000, 'Phan Thiết,Cam Ranh', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', TRUE, TRUE),
(3, 'TP. Hồ Chí Minh', 'Vũng Tàu', 100, 150, 120000, 'Ngã ba Vũng Tàu', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', TRUE, TRUE),
(4, 'TP. Hồ Chí Minh', 'Đà Nẵng', 960, 960, 450000, 'Nha Trang,Quảng Ngãi', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600', TRUE, TRUE),
(5, 'TP. Hồ Chí Minh', 'Cần Thơ', 170, 240, 150000, 'Bến xe Miền Tây,Vĩnh Long', 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=600', FALSE, TRUE),
(6, 'TP. Hồ Chí Minh', 'Quy Nhơn', 690, 780, 350000, 'Nha Trang,Tuy Hòa', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600', FALSE, TRUE),
(7, 'TP. Hồ Chí Minh', 'Huế', 1090, 1020, 520000, 'Đà Nẵng', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600', FALSE, TRUE),
(8, 'TP. Hồ Chí Minh', 'Phan Thiết', 190, 270, 140000, 'Bình Thuận', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', FALSE, TRUE)
ON DUPLICATE KEY UPDATE from_city=VALUES(from_city);

-- Trips (for today and tomorrow)
INSERT INTO trips (id, route_id, bus_id, trip_date, departure_time, arrival_time, price, available_seats, booked_seats, status) VALUES
(1,  1, 1, CURDATE(), '06:00:00', '12:00:00', 180000, 20, '["A1","A2","B3","C4"]', 'SCHEDULED'),
(2,  1, 2, CURDATE(), '08:30:00', '14:30:00', 220000, 12, '["A1","A2","A3","B1","B2"]', 'SCHEDULED'),
(3,  1, 4, CURDATE(), '13:00:00', '19:00:00', 260000, 30, '["A1"]', 'SCHEDULED'),
(4,  1, 3, CURDATE(), '21:00:00', '05:00:00', 350000, 8,  '["A1","A2","B1","B2","C1","C2","D1"]', 'SCHEDULED'),
(5,  1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:00:00', '13:00:00', 180000, 40, '[]', 'SCHEDULED'),
(6,  1, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:30:00', '01:30:00', 220000, 25, '["A1","B2"]', 'SCHEDULED'),
(7,  2, 2, CURDATE(), '07:00:00', '16:00:00', 250000, 15, '["A1","A2","B1"]', 'SCHEDULED'),
(8,  2, 3, CURDATE(), '20:00:00', '05:00:00', 320000, 10, '["A1","A2","B1","B2","C1"]', 'SCHEDULED'),
(9,  2, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '06:30:00', '15:30:00', 250000, 38, '["A1"]', 'SCHEDULED'),
(10, 3, 1, CURDATE(), '06:00:00', '08:30:00', 120000, 30, '["A1","B2"]', 'SCHEDULED'),
(11, 3, 3, CURDATE(), '09:00:00', '11:30:00', 180000, 18, '["A1","A2","B1","B2"]', 'SCHEDULED'),
(12, 4, 2, CURDATE(), '18:00:00', '10:00:00', 450000, 20, '[]', 'SCHEDULED'),
(13, 4, 3, CURDATE(), '19:30:00', '11:30:00', 550000, 6,  '["A1","A2","B1","B2","C1","C2"]', 'SCHEDULED')
ON DUPLICATE KEY UPDATE price=VALUES(price);

-- Pickup Points
INSERT INTO pickup_points (id, city, name, time_offset, type, active) VALUES
(1, 'TP. Hồ Chí Minh', 'Văn phòng 292 Đinh Bộ Lĩnh, Q. Bình Thạnh', '-30 phút', 'BOTH', TRUE),
(2, 'TP. Hồ Chí Minh', 'Văn phòng 468 Điện Biên Phủ, Q.3', '-20 phút', 'BOTH', TRUE),
(3, 'TP. Hồ Chí Minh', 'Bến xe Miền Đông', '0 phút', 'BOTH', TRUE),
(4, 'TP. Hồ Chí Minh', 'Bến xe An Sương, Q.12', '+10 phút', 'BOTH', TRUE),
(5, 'Đà Lạt', 'Bến xe Liên tỉnh Đà Lạt', '0 phút', 'BOTH', TRUE),
(6, 'Đà Lạt', 'Văn phòng 9 Nguyễn Chí Thanh', '+10 phút', 'BOTH', TRUE),
(7, 'Nha Trang', 'Bến xe Phía Nam Nha Trang', '0 phút', 'BOTH', TRUE),
(8, 'Nha Trang', 'Văn phòng 58/8 Trần Phú, Nha Trang', '+15 phút', 'BOTH', TRUE),
(9, 'Vũng Tàu', 'Bến xe Vũng Tàu', '0 phút', 'BOTH', TRUE),
(10, 'Đà Nẵng', 'Bến xe Đà Nẵng', '0 phút', 'BOTH', TRUE),
(11, 'Đà Nẵng', 'Văn phòng 76 Hùng Vương, Đà Nẵng', '+10 phút', 'BOTH', TRUE),
(12, 'Cần Thơ', 'Bến xe Cần Thơ', '0 phút', 'BOTH', TRUE),
(13, 'Phan Thiết', 'Bến xe Phan Thiết', '0 phút', 'BOTH', TRUE),
(14, 'Huế', 'Bến xe Huế', '0 phút', 'BOTH', TRUE),
(15, 'Quy Nhơn', 'Bến xe Quy Nhơn', '0 phút', 'BOTH', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ── Seed data for db_orders ─────────────────
USE db_orders;

-- Coupon codes (matching frontend mock codes)
INSERT INTO coupons (id, code, discount_rate, max_uses, used_count, active) VALUES
(1, 'VEVUI10',  0.10, 1000, 0, TRUE),
(2, 'SUMMER20', 0.20, 500,  0, TRUE),
(3, 'NEWUSER',  0.15, 300,  0, TRUE)
ON DUPLICATE KEY UPDATE discount_rate=VALUES(discount_rate);

-- ── Seed data for db_news ───────────────────
USE db_news;

INSERT INTO news (id, slug, title, excerpt, content, category, image_url, author, views, featured, published) VALUES
(1, 've-vui-khuyen-mai-mua-he-2024',
   'Vé Vui khuyến mãi mùa hè - Giảm đến 30% toàn bộ tuyến!',
   'Nhân dịp mùa hè rực rỡ, Vé Vui tung chương trình khuyến mãi đặc biệt với mức giảm lên đến 30% cho tất cả các tuyến trong tháng 6, 7, 8.',
   '<p>Mùa hè 2024 đã đến! Vé Vui trân trọng thông báo chương trình khuyến mãi đặc biệt với mức giảm lên đến 30% cho tất cả các tuyến. Sử dụng mã <strong>SUMMER20</strong> để nhận ưu đãi.</p>',
   'Khuyến mãi', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
   'Vé Vui Team', 1520, TRUE, TRUE),
(2, 'tuyen-moi-hcm-phu-quoc',
   'Khai trương tuyến mới TP.HCM - Phú Quốc, xuất phát từ tháng 7',
   'Vé Vui chính thức mở tuyến xe khách đến thiên đường biển đảo Phú Quốc, với xe Limousine cao cấp.',
   '<p>Đáp ứng nhu cầu du lịch ngày càng cao, Vé Vui khai trương tuyến mới TP.HCM - Phú Quốc với đội xe Limousine 22 chỗ cao cấp.</p>',
   'Tin tức', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
   'Vé Vui Team', 892, TRUE, TRUE),
(3, 'huong-dan-dat-ve-tren-dien-thoai',
   'Hướng dẫn đặt vé trực tuyến trên điện thoại chỉ 2 phút',
   'Đặt vé nhanh chóng, tiện lợi ngay trên website Vé Vui mà không cần ra bến xe.',
   '<p>Bước 1: Truy cập website vevui.vn<br>Bước 2: Chọn điểm đi và điểm đến<br>Bước 3: Chọn ngày đi<br>Bước 4: Chọn chuyến phù hợp<br>Bước 5: Chọn ghế và thanh toán</p>',
   'Hướng dẫn', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
   'Vé Vui Team', 2341, FALSE, TRUE),
(4, 'kinh-nghiem-di-da-lat-tu-hcm',
   '10 kinh nghiệm du lịch Đà Lạt từ TP.HCM bằng xe khách',
   'Những mẹo hay giúp chuyến đi Đà Lạt của bạn trở nên dễ dàng và thú vị hơn khi di chuyển bằng xe khách.',
   '<p>Đà Lạt - thành phố ngàn hoa luôn là điểm đến yêu thích. Hãy cùng Vé Vui khám phá 10 mẹo hay để có chuyến đi hoàn hảo.</p>',
   'Du lịch', 'https://images.unsplash.com/photo-1563492065-6135a42ab0a9?w=800',
   'Vé Vui Team', 3150, FALSE, TRUE),
(5, 'chinh-sach-hoan-doi-ve-moi',
   'Chính sách hoàn - đổi vé mới nhất tại Vé Vui',
   'Cập nhật chính sách hoàn vé và đổi vé linh hoạt nhất, đảm bảo quyền lợi tối đa cho hành khách.',
   '<p>Vé Vui luôn đặt sự hài lòng của khách hàng lên hàng đầu. Chính sách hoàn vé mới nhất: trước 24h - hoàn 100%, trước 2h - hoàn 50%, sau giờ khởi hành - không hoàn.</p>',
   'Thông báo', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
   'Vé Vui Team', 780, FALSE, TRUE),
(6, 'xe-limousine-cao-cap-moi',
   'Ra mắt đội xe Limousine cao cấp: Sang trọng - Tiện nghi - Đúng giờ',
   'Vé Vui đầu tư thêm 10 xe Limousine 22 chỗ cao cấp, nâng cao trải nghiệm hành khách trên các tuyến dài.',
   '<p>Với mong muốn mang lại trải nghiệm tốt nhất, Vé Vui vừa đưa vào vận hành 10 xe Limousine 22 chỗ mới nhất, trang bị đầy đủ tiện nghi hiện đại.</p>',
   'Tin tức', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
   'Vé Vui Team', 1100, FALSE, TRUE)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- ── Seed admin user for db_users ────────────
USE db_users;

-- Admin user: admin@vevui.vn / admin123
-- Password hash: BCrypt of 'admin123'
INSERT INTO users (full_name, email, password, phone, role, enabled)
VALUES ('Admin Vé Vui', 'admin@vevui.vn',
        '$2a$10$L5DcBzy6Tc6gVbtZbF3INez6TQEHtCY1YXLnIRrRWxuvB7iuAGijO',
        '0900000001', 'ADMIN', TRUE)
ON DUPLICATE KEY UPDATE role=VALUES(role);
