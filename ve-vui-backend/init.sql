-- ════════════════════════════════════════════
--  VÉ VUI — Database Initialization Script
--  Creates schemas, tables, and seeds initial data
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
GRANT ALL PRIVILEGES ON db_users.* TO 'vevui'@'%';
GRANT ALL PRIVILEGES ON db_trips.* TO 'vevui'@'%';
GRANT ALL PRIVILEGES ON db_orders.* TO 'vevui'@'%';
GRANT ALL PRIVILEGES ON db_news.* TO 'vevui'@'%';
FLUSH PRIVILEGES;

-- ═══════════════════════════════════════════
-- db_trips: Create tables
-- ═══════════════════════════════════════════
USE db_trips;

CREATE TABLE IF NOT EXISTS bus_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    total_seats INT NOT NULL,
    description VARCHAR(255),
    icon VARCHAR(10) DEFAULT '🚌'
);

CREATE TABLE IF NOT EXISTS buses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    bus_type_id BIGINT NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    violation_date VARCHAR(10) DEFAULT NULL,
    violation_expiry VARCHAR(10) DEFAULT NULL,
    violation_reason VARCHAR(500) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_type_id) REFERENCES bus_types(id)
);

CREATE TABLE IF NOT EXISTS routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    distance_km INT NOT NULL,
    duration_minutes INT NOT NULL,
    base_price NUMERIC(12,0) NOT NULL,
    stops VARCHAR(500),
    image_url VARCHAR(500),
    popular BIT(1) NOT NULL DEFAULT 0,
    active BIT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pickup_points (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    time_offset VARCHAR(50),
    type VARCHAR(255) NOT NULL,
    active BIT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS trips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_id BIGINT NOT NULL,
    bus_id BIGINT NOT NULL,
    trip_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    price NUMERIC(12,0) NOT NULL,
    available_seats INT NOT NULL,
    booked_seats VARCHAR(1000) DEFAULT '',
    status VARCHAR(255) NOT NULL DEFAULT 'SCHEDULED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    INDEX idx_trip_route_date (route_id, trip_date)
);

-- ═══════════════════════════════════════════
-- db_trips: Seed data
-- ═══════════════════════════════════════════

-- Bus Types
INSERT INTO bus_types (id, name, code, total_seats, description, icon) VALUES
(1, 'Ghe ngoi thuong', 'STANDARD', 45, 'Xe ghe ngoi thuong tien loi, 45 cho', '🚌'),
(2, 'Ghe ngoi VIP', 'VIP', 34, 'Xe ghe VIP rong rai, 34 cho cao cap', '🚌'),
(3, 'Giuong nam', 'SLEEPER', 34, 'Xe giuong nam 2 tang, 34 giuong', '🚌'),
(4, 'Limousine', 'LIMOUSINE', 22, 'Xe Limousine sang trong 22 cho', '🚐')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Buses
INSERT INTO buses (id, plate_number, name, bus_type_id, status) VALUES
(1, '51B-12345', 'Xe 45 Cho', 1, 'ACTIVE'),
(2, '51B-67890', 'Xe 34 Cho Nam', 3, 'ACTIVE'),
(3, '51C-11111', 'Xe Limousine', 4, 'ACTIVE'),
(4, '51C-22222', 'Xe VIP', 2, 'ACTIVE'),
(5, '51D-33333', 'Xe Giuong Nam Cabin', 3, 'MAINTENANCE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Routes (ASCII-safe names — JDBC reads UTF-8 garbled, so use non-diacritics)
INSERT INTO routes (id, from_city, to_city, distance_km, duration_minutes, base_price, stops, image_url, popular, active) VALUES
(1, 'TP. Ho Chi Minh', 'Da Lat', 290, 360, 180000, 'Binh Chanh,Dau Giay,Bao Loc', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600', TRUE, TRUE),
(2, 'TP. Ho Chi Minh', 'Nha Trang', 445, 540, 250000, 'Phan Thiet,Cam Ranh', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', TRUE, TRUE),
(3, 'TP. Ho Chi Minh', 'Vung Tau', 100, 150, 120000, 'Nga ba Vung Tau', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', TRUE, TRUE),
(4, 'TP. Ho Chi Minh', 'Da Nang', 960, 960, 450000, 'Nha Trang,Quang Ngai', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600', TRUE, TRUE),
(5, 'Hai Phong', 'Quang Ninh', 200, 240, 160000, NULL, NULL, FALSE, TRUE),
(6, 'TP. Ho Chi Minh', 'Hue', 200, 2222, 2222, NULL, NULL, FALSE, TRUE)
ON DUPLICATE KEY UPDATE from_city=VALUES(from_city);

-- Trips (for today and tomorrow)
INSERT INTO trips (id, route_id, bus_id, trip_date, departure_time, arrival_time, price, available_seats, booked_seats, status) VALUES
(1,  1, 1, CURDATE(), '06:00:00', '12:00:00', 180000, 35, '["A1","A2","B3"]', 'SCHEDULED'),
(2,  1, 2, CURDATE(), '08:30:00', '14:30:00', 220000, 25, '["A1","A2","A3","B1"]', 'SCHEDULED'),
(3,  1, 4, CURDATE(), '13:00:00', '19:00:00', 260000, 30, '["A1"]', 'SCHEDULED'),
(4,  1, 3, CURDATE(), '21:00:00', '03:00:00', 350000, 8,  '["A1","A2","B1","B2","C1"]', 'SCHEDULED'),
(5,  1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:00:00', '13:00:00', 180000, 40, '[]', 'SCHEDULED'),
(6,  1, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:30:00', '01:30:00', 220000, 25, '["A1","B2"]', 'SCHEDULED'),
(7,  2, 2, CURDATE(), '07:00:00', '16:00:00', 250000, 15, '["A1","A2"]', 'SCHEDULED'),
(8,  2, 3, CURDATE(), '20:00:00', '05:00:00', 320000, 10, '["A1","B2"]', 'SCHEDULED'),
(9,  2, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '06:30:00', '15:30:00', 250000, 38, '["A1"]', 'SCHEDULED'),
(10, 3, 1, CURDATE(), '06:00:00', '08:30:00', 120000, 30, '["A1"]', 'SCHEDULED'),
(11, 3, 3, CURDATE(), '09:00:00', '11:30:00', 180000, 18, '["A1","A2","B1"]', 'SCHEDULED'),
(12, 4, 2, CURDATE(), '18:00:00', '10:00:00', 450000, 20, '[]', 'SCHEDULED'),
(13, 4, 3, CURDATE(), '19:30:00', '11:30:00', 550000, 6,  '["A1","A2"]', 'SCHEDULED')
ON DUPLICATE KEY UPDATE price=VALUES(price);

-- Pickup Points (ASCII-safe city names)
INSERT INTO pickup_points (id, city, name, time_offset, type, active) VALUES
(1, 'TP. Ho Chi Minh', 'Van phong 292 Dinh Bo Linh, Q. Binh Thanh', '-30 phut', 'BOTH', TRUE),
(2, 'TP. Ho Chi Minh', 'Van phong 468 Dien Bien Phu, Q.3', '-20 phut', 'BOTH', TRUE),
(3, 'TP. Ho Chi Minh', 'Ben xe Mien Dong', '0 phut', 'BOTH', TRUE),
(4, 'TP. Ho Chi Minh', 'Ben xe An Suong, Q.12', '+10 phut', 'BOTH', TRUE),
(5, 'Da Lat', 'Ben xe Lien tinh Da Lat', '0 phut', 'BOTH', TRUE),
(6, 'Da Lat', 'Van phong 9 Nguyen Chi Thanh', '+10 phut', 'BOTH', TRUE),
(7, 'Nha Trang', 'Ben xe Phia Nam Nha Trang', '0 phut', 'BOTH', TRUE),
(8, 'Nha Trang', 'Van phong 58/8 Tran Phu, Nha Trang', '+15 phut', 'BOTH', TRUE),
(9, 'Vung Tau', 'Ben xe Vung Tau', '0 phut', 'BOTH', TRUE),
(10, 'Da Nang', 'Ben xe Da Nang', '0 phut', 'BOTH', TRUE),
(11, 'Da Nang', 'Van phong 76 Hung Vuong, Da Nang', '+10 phut', 'BOTH', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ═══════════════════════════════════════════
-- db_orders: Create tables
-- ═══════════════════════════════════════════
USE db_orders;

CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(30) PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    customer_id BIGINT,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    seats VARCHAR(500) NOT NULL,
    pickup_point_id BIGINT,
    dropoff_point_id BIGINT,
    total_price NUMERIC(12,0) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    from_city VARCHAR(100),
    to_city VARCHAR(100),
    trip_date VARCHAR(255),
    departure_time VARCHAR(255),
    arrival_time VARCHAR(255),
    booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    discount_rate DOUBLE NOT NULL,
    max_uses INT NOT NULL DEFAULT 100,
    used_count INT NOT NULL DEFAULT 0,
    active BIT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO coupons (id, code, discount_rate, max_uses, used_count, active) VALUES
(1, 'VEVUI10',  0.10, 1000, 0, TRUE),
(2, 'SUMMER20', 0.20, 500,  0, TRUE),
(3, 'NEWUSER',  0.15, 300,  0, TRUE)
ON DUPLICATE KEY UPDATE discount_rate=VALUES(discount_rate);

-- ═══════════════════════════════════════════
-- db_news: Create tables
-- ═══════════════════════════════════════════
USE db_news;

CREATE TABLE IF NOT EXISTS news (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    excerpt VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(500),
    author VARCHAR(100) DEFAULT 'Vé Vui Team',
    views BIGINT NOT NULL DEFAULT 0,
    featured BIT(1) NOT NULL DEFAULT 0,
    published BIT(1) NOT NULL DEFAULT 1,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- News seed (ASCII-safe category names for JDBC compatibility)
INSERT INTO news (id, slug, title, excerpt, content, category, image_url, author, views, featured, published) VALUES
(1, 've-vui-khuyen-mai-mua-he-2024',
   'Vé Vui khuyến mãi mùa hè - Giảm đến 30% toàn bộ tuyến!',
   'Nhân dịp mùa hè rực rỡ, Vé Vui tung chương trình khuyến mãi đặc biệt với mức giảm lên đến 30% cho tất cả các tuyến trong tháng 6, 7, 8.',
   '<p>Mùa hè 2024 đã đến! Vé Vui trân trọng thông báo chương trình khuyến mãi đặc biệt với mức giảm lên đến 30% cho tất cả các tuyến. Sử dụng mã <strong>SUMMER20</strong> để nhận ưu đãi.</p>',
   'Khuyen mai', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
   'Vé Vui Team', 1520, TRUE, TRUE),
(2, 'tuyen-moi-hcm-phu-quoc',
   'Khai trương tuyến mới TP.HCM - Phú Quốc, xuất phát từ tháng 7',
   'Vé Vui chính thức mở tuyến xe khách đến thiên đường biển đảo Phú Quốc, với xe Limousine cao cấp.',
   '<p>Đáp ứng nhu cầu du lịch ngày càng cao, Vé Vui khai trương tuyến mới TP.HCM - Phú Quốc với đội xe Limousine 22 chỗ cao cấp.</p>',
   'Tin tuc', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
   'Vé Vui Team', 892, TRUE, TRUE),
(3, 'huong-dan-dat-ve-tren-dien-thoai',
   'Hướng dẫn đặt vé trực tuyến trên điện thoại chỉ 2 phút',
   'Đặt vé nhanh chóng, tiện lợi ngay trên website Vé Vui mà không cần ra bến xe.',
   '<p>Bước 1: Truy cập website vevui.vn<br>Bước 2: Chọn điểm đi và điểm đến<br>Bước 3: Chọn ngày đi<br>Bước 4: Chọn chuyến phù hợp<br>Bước 5: Chọn ghế và thanh toán</p>',
   'Huong dan', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
   'Vé Vui Team', 2341, FALSE, TRUE),
(4, 'kinh-nghiem-di-da-lat-tu-hcm',
   '10 kinh nghiệm du lịch Đà Lạt từ TP.HCM bằng xe khách',
   'Những mẹo hay giúp chuyến đi Đà Lạt của bạn trở nên dễ dàng và thú vị hơn khi di chuyển bằng xe khách.',
   '<p>Đà Lạt - thành phố ngàn hoa luôn là điểm đến yêu thích. Hãy cùng Vé Vui khám phá 10 mẹo hay để có chuyến đi hoàn hảo.</p>',
   'Du lich', 'https://images.unsplash.com/photo-1563492065-6135a42ab0a9?w=800',
   'Vé Vui Team', 3150, FALSE, TRUE),
(5, 'chinh-sach-hoan-doi-ve-moi',
   'Chính sách hoàn - đổi vé mới nhất tại Vé Vui',
   'Cập nhật chính sách hoàn vé và đổi vé linh hoạt nhất, đảm bảo quyền lợi tối đa cho hành khách.',
   '<p>Vé Vui luôn đặt sự hài lòng của khách hàng lên hàng đầu. Chính sách hoàn vé mới nhất: trước 24h - hoàn 100%, trước 2h - hoàn 50%, sau giờ khởi hành - không hoàn.</p>',
   'Thong bao', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
   'Vé Vui Team', 780, FALSE, TRUE),
(6, 'xe-limousine-cao-cap-moi',
   'Ra mắt đội xe Limousine cao cấp: Sang trọng - Tiện nghi - Đúng giờ',
   'Vé Vui đầu tư thêm 10 xe Limousine 22 chỗ cao cấp, nâng cao trải nghiệm hành khách trên các tuyến dài.',
   '<p>Với mong muốn mang lại trải nghiệm tốt nhất, Vé Vui vừa đưa vào vận hành 10 xe Limousine 22 chỗ mới nhất, trang bị đầy đủ tiện nghi hiện đại.</p>',
   'Tin tuc', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
   'Vé Vui Team', 1100, FALSE, TRUE)
ON DUPLICATE KEY UPDATE title=VALUES(title);

CREATE TABLE IF NOT EXISTS news_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    active BIT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO news_categories (id, name, sort_order, active) VALUES
(1, 'Khuyen mai', 1, TRUE),
(2, 'Tin tuc', 2, TRUE),
(3, 'Huong dan', 3, TRUE),
(4, 'Du lich', 4, TRUE),
(5, 'Thong bao', 5, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ═══════════════════════════════════════════
-- db_users: Create tables
-- ═══════════════════════════════════════════
USE db_users;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15) UNIQUE,
    role VARCHAR(255) NOT NULL DEFAULT 'USER',
    enabled BIT(1) NOT NULL DEFAULT 1,
    refresh_token VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin user: admin@vevui.vn / admin123
INSERT INTO users (full_name, email, password, phone, role, enabled)
VALUES ('Admin Vé Vui', 'admin@vevui.vn',
        '$2a$10$L5DcBzy6Tc6gVbtZbF3INez6TQEHtCY1YXLnIRrRWxuvB7iuAGijO',
        '0900000001', 'ADMIN', TRUE)
ON DUPLICATE KEY UPDATE role=VALUES(role);
