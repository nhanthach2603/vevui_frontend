# ══════════════════════════════════════════════════════════
#  VÉ VUI — Unified Multi-stage Dockerfile
#  Build từ root với --build-arg SERVICE=<service-name>
#  Ví dụ: docker build --build-arg SERVICE=user-service .
# ══════════════════════════════════════════════════════════

# ── Stage 1: Build toàn bộ project từ root pom.xml ──────
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /workspace

# Copy root pom.xml trước để cache dependencies
COPY pom.xml ./pom.xml

# Copy tất cả pom.xml của các module (để resolve dependencies offline)
COPY eureka-server/pom.xml        ./eureka-server/pom.xml
COPY api-gateway/pom.xml          ./api-gateway/pom.xml
COPY user-service/pom.xml         ./user-service/pom.xml
COPY trip-service/pom.xml         ./trip-service/pom.xml
COPY order-service/pom.xml        ./order-service/pom.xml
COPY news-service/pom.xml         ./news-service/pom.xml
COPY notification-service/pom.xml ./notification-service/pom.xml

# Download tất cả dependencies (layer cache)
RUN mvn dependency:go-offline -B --no-transfer-progress

# Copy toàn bộ source code
COPY eureka-server/src        ./eureka-server/src
COPY api-gateway/src          ./api-gateway/src
COPY user-service/src         ./user-service/src
COPY trip-service/src         ./trip-service/src
COPY order-service/src        ./order-service/src
COPY news-service/src         ./news-service/src
COPY notification-service/src ./notification-service/src

# Build toàn bộ project (tất cả modules)
RUN mvn clean package -DskipTests -B --no-transfer-progress

# ── Stage 2: Runtime image (nhỏ gọn) ────────────────────
FROM eclipse-temurin:17-jre-alpine

ARG SERVICE
ENV SERVICE_NAME=${SERVICE}

RUN apk add --no-cache curl

WORKDIR /app

# Tạo user không có quyền root
RUN addgroup -S vevui && adduser -S vevui -G vevui
USER vevui

# Copy JAR của service được chỉ định
COPY --from=build /workspace/${SERVICE}/target/*.jar app.jar

# Expose port (override tại docker-compose)
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Djava.security.egd=file:/dev/./urandom", "app.jar"]
