# 🚌 Vé Vui Backend — Microservices Architecture

Backend hệ thống đặt vé xe khách trực tuyến "Vé Vui" được xây dựng theo kiến trúc **Microservices** với **Spring Boot 3.x** và **Spring Cloud**.

---

## 🏗️ Kiến trúc Hệ thống

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (React)                    │
│  ve-vui-user (:5173)    ve-vui-admin (:5174)        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP Requests
                       ▼
┌─────────────────────────────────────────────────────┐
│               API GATEWAY  :8900                    │
│  • JWT Validation  • Rate Limiting  • CORS          │
│  • Load Balancing  • Route Forwarding               │
└──┬──────────┬──────────┬──────────┬─────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
user-svc  trip-svc  order-svc  news-svc
:8811     :8810     :8813      :8812
   │          │          │
MySQL      MySQL+    MySQL+Kafka ──► notification-svc
(db_users) Redis     (db_orders)     :8815 (Consumer)
           (db_trips)

EUREKA SERVER :8761  (Service Discovery)
REDIS :6379          (Cache + Rate Limiting)
KAFKA :9092          (Async Messaging)
MySQL :3306          (4 Schemas)
```

---

## 📦 Danh sách Services

| Service | Port | Chức năng | DB |
|---|---|---|---|
| `eureka-server` | 8761 | Service Discovery | — |
| `api-gateway` | 8900 | Gateway, JWT, Rate Limiting | Redis |
| `user-service` | 8811 | Auth, Register, Profile | MySQL (db_users) |
| `trip-service` | 8810 | Tuyến, Xe, Chuyến, Ghế | MySQL (db_trips) + Redis |
| `order-service` | 8813 | Vé, Thanh toán, Coupon | MySQL (db_orders) + Kafka |
| `news-service` | 8812 | Tin tức, Blog | MySQL (db_news) + Redis |
| `notification-service` | 8815 | Gửi email (Kafka Consumer) | — |

---

## 🚀 Khởi chạy với Docker

### Yêu cầu
- Docker Desktop (Windows)
- Docker Compose v2+
- Java 17 (để chạy local không dùng Docker)
- Maven 3.9+

### Chạy toàn bộ hệ thống

```bash
cd "d:\wed đặt vé xe\ve-vui-backend"

# Khởi chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng
docker-compose down
```

### Kiểm tra hoạt động

| URL | Mô tả |
|---|---|
| http://localhost:8761 | Eureka Dashboard |
| http://localhost:8900/actuator/health | API Gateway Health |
| http://localhost:8811/actuator/health | User Service Health |
| http://localhost:8810/actuator/health | Trip Service Health |

---

## 🏃 Chạy Local (Không Docker)

### 1. Khởi động hạ tầng (MySQL, Redis, Kafka)

```bash
# Chỉ chạy infrastructure
docker-compose up -d mysql redis zookeeper kafka
```

### 2. Chạy từng service theo thứ tự

```bash
# 1. Eureka Server
cd eureka-server && mvn spring-boot:run

# 2. API Gateway  
cd api-gateway && mvn spring-boot:run

# 3. Services (thứ tự bất kỳ)
cd user-service && mvn spring-boot:run
cd trip-service && mvn spring-boot:run
cd order-service && mvn spring-boot:run
cd news-service && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
```

---

## 🔌 API Endpoints

### 🔐 Authentication (`user-service`)

```http
POST   /api/auth/register    # Đăng ký tài khoản
POST   /api/auth/login       # Đăng nhập → JWT
POST   /api/auth/refresh     # Làm mới token
GET    /api/auth/me          # Thông tin user (cần JWT)
PUT    /api/users/{id}       # Cập nhật profile
GET    /api/admin/users      # DS khách hàng (admin)
```

### 🚌 Chuyến đi (`trip-service`)

```http
GET    /api/routes                          # Danh sách tuyến
GET    /api/routes?popularOnly=true         # Tuyến nổi bật
GET    /api/routes/{id}                     # Chi tiết tuyến
GET    /api/buses                           # Danh sách xe
GET    /api/trips/search?from=&to=&date=    # Tìm chuyến (Redis cache)
GET    /api/trips/{id}                      # Chi tiết chuyến
GET    /api/trips/{id}/seats                # Sơ đồ ghế
GET    /api/pickup-points?city=             # Điểm đón/trả

# Admin
POST   /api/admin/routes                    # Tạo tuyến
PUT    /api/admin/routes/{id}               # Cập nhật tuyến
DELETE /api/admin/routes/{id}               # Xóa tuyến
POST   /api/admin/buses                     # Thêm xe
POST   /api/admin/trips                     # Tạo chuyến
```

### 🎫 Đặt vé (`order-service`)

```http
POST   /api/tickets                         # Tạo booking (Feign → trip-service)
GET    /api/tickets/{id}                    # Tra cứu vé theo mã
GET    /api/tickets/search?phone=           # Tra cứu theo SĐT
PUT    /api/tickets/{id}/cancel             # Hủy vé
POST   /api/payment/process                 # Xử lý thanh toán
POST   /api/payment/apply-coupon            # Áp dụng mã giảm giá
GET    /api/admin/tickets                   # DS vé (admin)
```

### 📰 Tin tức (`news-service`)

```http
GET    /api/news?page=0&size=10             # Danh sách tin (có cache)
GET    /api/news/featured                   # Tin nổi bật
GET    /api/news/{slug}                     # Chi tiết + đếm lượt xem

# Admin
POST   /api/admin/news                      # Đăng bài viết
PUT    /api/admin/news/{id}                 # Cập nhật
DELETE /api/admin/news/{id}                 # Xóa
```

---

## 🔑 Tài khoản mặc định

| Role | Email | Password |
|---|---|---|
| Admin | admin@vevui.vn | admin123 |

---

## 🎟️ Mã giảm giá mặc định

| Code | Giảm giá |
|---|---|
| `VEVUI10` | 10% |
| `SUMMER20` | 20% |
| `NEWUSER` | 15% |

---

## 🔧 Công nghệ

- **Java 17** + **Spring Boot 3.2**
- **Spring Cloud 2023.0.0** (Eureka, Gateway, OpenFeign)
- **Spring Security** + **JWT** (jjwt 0.12.3)
- **Spring Data JPA** + **Hibernate** + **MySQL 8**
- **Spring Data Redis** (Lettuce client)
- **Apache Kafka** (async messaging)
- **Docker** + **Docker Compose**

---

## 📁 Cấu trúc thư mục

```
ve-vui-backend/
├── pom.xml                    # Parent Maven POM
├── docker-compose.yml         # Docker orchestration
├── init.sql                   # Database seed data
├── eureka-server/
├── api-gateway/
├── user-service/
├── trip-service/
├── order-service/
├── news-service/
└── notification-service/
```
