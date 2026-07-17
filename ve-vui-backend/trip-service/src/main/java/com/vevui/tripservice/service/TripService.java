package com.vevui.tripservice.service; // Package chứa tầng xử lý business logic

// ── JSON processing ──
import com.fasterxml.jackson.core.type.TypeReference; // Đọc kiểu generic (List<String>) từ JSON
import com.fasterxml.jackson.databind.ObjectMapper;   // Serialize/deserialize JSON

import com.vevui.tripservice.dto.TripDto;
import com.vevui.tripservice.entity.*;
import com.vevui.tripservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// ── Spring Cache ──
import org.springframework.cache.annotation.CacheEvict;  // Xóa cache khi dữ liệu thay đổi
import org.springframework.cache.annotation.Cacheable;   // Đọc cache, miss → query DB → lưu cache

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  TripService — Tầng xử lý nghiệp vụ cho Trip Service
 *
 *  Quản lý 5 nhóm chức năng:
 *  1. ROUTE    : CRUD tuyến xe (có cache Redis 30 phút)
 *  2. BUS TYPE : CRUD loại xe
 *  3. BUS      : CRUD xe cụ thể
 *  4. TRIP     : CRUD chuyến + tìm kiếm (có cache Redis 5 phút)
 *  5. SEAT     : Xem sơ đồ ghế + khóa ghế khi đặt vé
 *
 *  Đặc biệt: lockSeats() được gọi bởi order-service qua Feign
 *  khi khách đặt vé — cần xử lý atomic để tránh race condition.
 * ╚══════════════════════════════════════════════════════════╝
 */
@Slf4j            // Tự sinh logger: log.info(), log.warn()...
@Service          // Đăng ký là Spring Bean kiểu Service
@RequiredArgsConstructor // Sinh constructor inject tất cả field final
public class TripService {

    // ── Inject các Repository qua constructor ──
    private final TripRepository tripRepository;           // Truy cập bảng trips
    private final RouteRepository routeRepository;         // Truy cập bảng routes
    private final BusRepository busRepository;             // Truy cập bảng buses
    private final BusTypeRepository busTypeRepository;     // Truy cập bảng bus_types
    private final PickupPointRepository pickupPointRepository; // Truy cập bảng pickup_points
    private final TripPickupPointRepository tripPickupPointRepository; // Truy cập bảng trip_pickup_points
    private final CityRepository cityRepository;             // Truy cập bảng cities
    private final ObjectMapper objectMapper;               // Để parse/serialize bookedSeats JSON

    // ════════════════════════════════════════════════════════
    // 1. ROUTE OPERATIONS — Quản lý tuyến đường
    // ════════════════════════════════════════════════════════

    /**
     * Lấy tất cả tuyến đang hoạt động (active=true)
     * GET /api/routes
     *
     * @Cacheable: Spring kiểm tra Redis trước khi query DB
     * - Cache hit  → trả về ngay từ Redis (nhanh ~1ms)
     * - Cache miss → query DB, lưu kết quả vào Redis với key "routes::all"
     */
    @Cacheable(value = "routes", key = "'all'")
    public List<TripDto.RouteDto> getAllRoutes() {
        return routeRepository.findByActiveTrue().stream()
                .map(this::toRouteDto)      // Chuyển Route entity → RouteDto
                .collect(Collectors.toList());
    }

    /**
     * Admin: Lấy TẤT CẢ tuyến (kể cả inactive) với phân trang
     * GET /api/admin/routes?page=0&size=20
     * Không dùng cache vì admin cần dữ liệu mới nhất
     */
    public Page<TripDto.RouteDto> getAllRoutesAdmin(Pageable pageable) {
        return routeRepository.findAll(pageable).map(this::toRouteDto);
    }

    /**
     * Lấy các tuyến phổ biến — hiển thị trên trang chủ
     * GET /api/routes?popularOnly=true
     * Cache riêng với key "routes::popular"
     */
    @Cacheable(value = "routes", key = "'popular'")
    public List<TripDto.RouteDto> getPopularRoutes() {
        return routeRepository.findByPopularTrueAndActiveTrue().stream()
                .map(this::toRouteDto)
                .collect(Collectors.toList());
    }

    /** Lấy chi tiết 1 tuyến theo ID */
    public TripDto.RouteDto getRouteById(Long id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuyến: " + id));
        return toRouteDto(route);
    }

    /**
     * Admin: Tạo tuyến mới
     * POST /api/admin/routes
     *
     * @CacheEvict(allEntries=true): sau khi tạo tuyến mới → xóa TẤT CẢ cache "routes"
     * (cả "routes::all" và "routes::popular") để lần sau query lại từ DB
     */
    @CacheEvict(value = "routes", allEntries = true)
    public TripDto.RouteDto createRoute(TripDto.CreateRouteRequest req) {
        Route route = Route.builder()
                .fromCity(req.getFromCity())
                .toCity(req.getToCity())
                .distanceKm(req.getDistanceKm())
                .durationMinutes(req.getDurationMinutes())
                .basePrice(req.getBasePrice())
                .stops(req.getStops())
                .imageUrl(req.getImageUrl())
                .popular(Boolean.TRUE.equals(req.getPopular())) // Xử lý null-safe (null → false)
                .build();
        return toRouteDto(routeRepository.save(route));
    }

    /**
     * Admin: Cập nhật tuyến (partial update — chỉ cập nhật field được gửi lên)
     * PUT /api/admin/routes/{id}
     * @CacheEvict: xóa cache sau khi thay đổi
     */
    @CacheEvict(value = "routes", allEntries = true)
    public TripDto.RouteDto updateRoute(Long id, TripDto.CreateRouteRequest req) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuyến: " + id));
        // Chỉ cập nhật field nào được gửi (null = không muốn thay đổi)
        if (req.getFromCity() != null) route.setFromCity(req.getFromCity());
        if (req.getToCity() != null) route.setToCity(req.getToCity());
        if (req.getBasePrice() != null) route.setBasePrice(req.getBasePrice());
        if (req.getPopular() != null) route.setPopular(req.getPopular());
        if (req.getStops() != null) route.setStops(req.getStops());
        if (req.getActive() != null) route.setActive(req.getActive());
        return toRouteDto(routeRepository.save(route));
    }

    /**
     * Admin: Xóa mềm tuyến (chỉ set active=false, không xóa DB)
     * DELETE /api/admin/routes/{id}
     * → Giữ lại lịch sử các chuyến đã chạy trên tuyến này
     */
    @CacheEvict(value = "routes", allEntries = true)
    public void deleteRoute(Long id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuyến: " + id));
        route.setActive(false); // Soft delete: ẩn tuyến khỏi danh sách công khai
        routeRepository.save(route);
    }

    // ════════════════════════════════════════════════════════
    // 2. BUS TYPE OPERATIONS — Quản lý loại xe
    // ════════════════════════════════════════════════════════

    /** Lấy tất cả loại xe (STANDARD, VIP, SLEEPER, LIMOUSINE) */
    public List<TripDto.BusTypeDto> getAllBusTypes() {
        return busTypeRepository.findAll().stream().map(this::toBusTypeDto).collect(Collectors.toList());
    }

    /** Lấy chi tiết 1 loại xe theo ID */
    public TripDto.BusTypeDto getBusTypeById(Long id) {
        BusType busType = busTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại xe: " + id));
        return toBusTypeDto(busType);
    }

    /** Admin: Tạo loại xe mới */
    public TripDto.BusTypeDto createBusType(TripDto.CreateBusTypeRequest req) {
        BusType busType = BusType.builder()
                .name(req.getName())
                .code(req.getCode())
                .totalSeats(req.getTotalSeats())
                .description(req.getDescription())
                .icon(req.getIcon() != null ? req.getIcon() : "🚌") // Default icon nếu không truyền
                .build();
        return toBusTypeDto(busTypeRepository.save(busType));
    }

    /** Admin: Cập nhật loại xe (partial update) */
    public TripDto.BusTypeDto updateBusType(Long id, TripDto.CreateBusTypeRequest req) {
        BusType busType = busTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại xe: " + id));
        if (req.getName() != null) busType.setName(req.getName());
        if (req.getCode() != null) busType.setCode(req.getCode());
        if (req.getTotalSeats() != null) busType.setTotalSeats(req.getTotalSeats());
        if (req.getDescription() != null) busType.setDescription(req.getDescription());
        if (req.getIcon() != null) busType.setIcon(req.getIcon());
        return toBusTypeDto(busTypeRepository.save(busType));
    }

    /** Admin: Xóa thật loại xe (hard delete — chỉ khi chưa có xe nào thuộc loại này) */
    public void deleteBusType(Long id) {
        BusType busType = busTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại xe: " + id));
        busTypeRepository.delete(busType); // Hard delete — cẩn thận nếu có xe đang dùng loại này
    }

    // ════════════════════════════════════════════════════════
    // 3. BUS OPERATIONS — Quản lý xe cụ thể
    // ════════════════════════════════════════════════════════

    /** Lấy tất cả xe (không phân trang) */
    public List<TripDto.BusDto> getAllBuses() {
        return busRepository.findAll().stream().map(this::toBusDto).collect(Collectors.toList());
    }

    /** Admin: Lấy danh sách xe có phân trang */
    public Page<TripDto.BusDto> getAllBusesAdmin(Pageable pageable) {
        return busRepository.findAll(pageable).map(this::toBusDto);
    }

    /**
     * Admin: Xóa xe
     * - Xe không có chuyến nào → hard delete (xóa khỏi DB)
     * - Xe có chuyến liên kết → soft delete (chuyển sang INACTIVE, giữ lịch sử)
     */
    public void deleteBus(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + id));
        long tripCount = tripRepository.countByBusId(id);
        if (tripCount > 0) {
            bus.setStatus(Bus.Status.INACTIVE);
            busRepository.save(bus);
            log.info("Bus {} set to INACTIVE (has {} trips)", id, tripCount);
        } else {
            busRepository.delete(bus);
            log.info("Bus {} permanently deleted", id);
        }
    }

    /** Admin: Tạo xe mới — tìm BusType trước để lấy totalSeats */
    public TripDto.BusDto createBus(TripDto.CreateBusRequest req) {
        BusType busType = busTypeRepository.findById(req.getBusTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại xe: " + req.getBusTypeId()));

        Bus bus = Bus.builder()
                .plateNumber(req.getPlateNumber())
                .name(req.getName())
                .busType(busType)
                .status(Bus.Status.ACTIVE) // Xe mới tạo mặc định ACTIVE
                .build();
        return toBusDto(busRepository.save(bus));
    }

    // ════════════════════════════════════════════════════════
    // 4. TRIP OPERATIONS — Quản lý chuyến đi
    // ════════════════════════════════════════════════════════

    /** Admin: Lấy tất cả chuyến có phân trang */
    public Page<TripDto.TripResponse> getAllTripsAdmin(Pageable pageable) {
        return tripRepository.findByStatusNot(Trip.Status.COMPLETED, pageable).map(this::toTripResponse);
    }

    /** Admin: Tìm chuyến theo từ khóa */
    public List<TripDto.TripResponse> searchTripsAdmin(String q) {
        return tripRepository.searchByKeyword(q.toLowerCase()).stream()
                .map(this::toTripResponse)
                .collect(Collectors.toList());
    }

    /**
     * Admin: Xóa mềm chuyến — đặt status = CANCELLED
     * @CacheEvict: xóa cache trips sau khi hủy chuyến
     */
    @CacheEvict(value = "trips", allEntries = true)
    public void deleteTrip(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + id));
        trip.setStatus(Trip.Status.CANCELLED); // Soft delete = CANCELLED
        tripRepository.save(trip);
        log.info("Trip {} set to CANCELLED", id);
    }

    /**
     * Tìm chuyến đi theo tuyến + ngày (PUBLIC API)
     * GET /api/trips/search?from=Hà Nội&to=Đà Nẵng&date=2024-07-09
     *
     * @Cacheable: key = "trips::Hà Nội-Đà Nẵng-2024-07-09"
     * → Cache tự động theo combination (from, to, date)
     * → TTL = 5 phút (cấu hình trong RedisConfig)
     */
    @Cacheable(value = "trips", key = "#fromCity + '-' + #toCity + '-' + #date")
    public List<TripDto.TripResponse> searchTrips(String fromCity, String toCity, String date) {
        LocalDate tripDate = LocalDate.parse(date); // Parse "2024-07-09" → LocalDate
        // Loại bỏ dấu tiếng Việt trước khi query DB
        // VD: "TP. Hồ Chí Minh" → "TP. Ho Chi Minh" để LIKE match được
        String normFrom = removeDiacritics(fromCity);
        String normTo = removeDiacritics(toCity);
        List<Trip> trips = tripRepository.searchTrips(normFrom, normTo, tripDate);
        log.info("Search trips: {} ({}) → {} ({}) on {} → {} results", fromCity, normFrom, toCity, normTo, date, trips.size());
        return trips.stream().map(this::toTripResponse).collect(Collectors.toList());
    }

    /**
     * Loại bỏ dấu tiếng Việt khỏi chuỗi
     * "TP. Hồ Chí Minh" → "TP. Ho Chi Minh"
     * "Đà Lạt" → "Da Lat"
     * "Huế" → "Hue"
     *
     * Dùng NFD để tách chữ cái và dấu thành 2 ký tự riêng,
     * sau đó xóa tất cả ký hiệu kết hợp (dấu).
     * Thay thế Đ/đ bằng D/d vì NFD trên một số JVM không decompose đúng.
     */
    private String removeDiacritics(String input) {
        if (input == null) return null;
        // Bước 1: NFD tách "Hồ" → "H" + "o" + "̂" + "̃"
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        // Bước 2: Xóa tất cả ký hiệu Combining Diacritical Marks (U+0300–U+036F)
        String result = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        // Bước 3: Xử lý Đ/đ — một số JVM không decompose đúng U+0110/U+0111
        result = result.replace('\u0110', 'D'); // Đ → D
        result = result.replace('\u0111', 'd'); // đ → d
        return result;
    }

    /**
     * Lấy tất cả chuyến sắp khởi hành — cho trang Lịch trình công khai
     * GET /api/trips/schedule
     */
    public List<TripDto.TripResponse> getScheduleTrips() {
        return tripRepository.findUpcomingTrips().stream()
                .map(this::toTripResponse)
                .collect(Collectors.toList());
    }

    /** Lấy chi tiết 1 chuyến theo ID */
    public TripDto.TripResponse getTripById(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + id));
        return toTripResponse(trip);
    }

    /**
     * Admin: Tạo chuyến mới
     * availableSeats được tự động set = busType.totalSeats khi tạo
     * → Số ghế trống ban đầu = tổng số ghế của xe
     */
    @CacheEvict(value = "trips", allEntries = true)
    public TripDto.TripResponse createTrip(TripDto.CreateTripRequest req) {
        Route route = routeRepository.findById(req.getRouteId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuyến: " + req.getRouteId()));
        Bus bus = busRepository.findById(req.getBusId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + req.getBusId()));

        Trip trip = Trip.builder()
                .route(route)
                .bus(bus)
                .tripDate(LocalDate.parse(req.getTripDate()))         // "2024-07-09" → LocalDate
                .departureTime(LocalTime.parse(req.getDepartureTime())) // "08:30" → LocalTime
                .arrivalTime(LocalTime.parse(req.getArrivalTime()))
                .price(req.getPrice())
                .availableSeats(bus.getBusType().getTotalSeats()) // Lấy từ BusType — không truyền từ ngoài
                .build();

        return toTripResponse(tripRepository.save(trip));
    }

    @CacheEvict(value = "trips", allEntries = true)
    public TripDto.BatchCreateTripResponse batchCreateTrips(TripDto.BatchCreateTripRequest req) {
        List<String> errors = new ArrayList<>();
        int created = 0;
        int failed = 0;
        for (TripDto.CreateTripRequest tripReq : req.getTrips()) {
            try {
                createTrip(tripReq);
                created++;
            } catch (Exception e) {
                failed++;
                errors.add(tripReq.getTripDate() + ": " + e.getMessage());
            }
        }
        return TripDto.BatchCreateTripResponse.builder()
                .created(created)
                .failed(failed)
                .errors(errors)
                .build();
    }

    public List<TripDto.AvailableDateDto> getAvailableDates(String from, String to, String month) {
        List<Route> matchedRoutes = routeRepository.findAll().stream()
                .filter(r -> r.getActive() != null && r.getActive())
                .filter(r -> matchesCity(r.getFromCity(), from) && matchesCity(r.getToCity(), to))
                .collect(Collectors.toList());
        if (matchedRoutes.isEmpty()) return List.of();

        List<Long> routeIds = matchedRoutes.stream().map(Route::getId).collect(Collectors.toList());
        LocalDate start;
        LocalDate end;
        if (month != null && !month.isBlank()) {
            start = LocalDate.parse(month + "-01");
            end = start.plusMonths(1).minusDays(1);
        } else {
            start = LocalDate.now();
            end = start.plusMonths(3);
        }
        List<Trip> trips = tripRepository.findByRouteIdInAndTripDateBetweenAndStatusNot(routeIds, start, end, Trip.Status.CANCELLED);
        Map<String, Integer> dateCount = new LinkedHashMap<>();
        for (Trip t : trips) {
            String date = t.getTripDate().toString();
            dateCount.merge(date, 1, Integer::sum);
        }
        return dateCount.entrySet().stream()
                .map(e -> TripDto.AvailableDateDto.builder().date(e.getKey()).tripCount(e.getValue()).build())
                .collect(Collectors.toList());
    }

    private boolean matchesCity(String routeCity, String searchCity) {
        if (routeCity == null || searchCity == null) return false;
        String a = routeCity.toLowerCase().replaceAll("[\\s.]+", "");
        String b = searchCity.toLowerCase().replaceAll("[\\s.]+", "");
        return a.contains(b) || b.contains(a);
    }

    /** Admin: Cập nhật chuyến (partial update) */
    @CacheEvict(value = "trips", allEntries = true)
    public TripDto.TripResponse updateTrip(Long id, TripDto.CreateTripRequest req) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + id));
        if (req.getRouteId() != null) {
            Route route = routeRepository.findById(req.getRouteId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuyến: " + req.getRouteId()));
            trip.setRoute(route);
        }
        if (req.getBusId() != null) {
            Bus bus = busRepository.findById(req.getBusId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + req.getBusId()));
            trip.setBus(bus);
        }
        if (req.getTripDate() != null)      trip.setTripDate(LocalDate.parse(req.getTripDate()));
        if (req.getDepartureTime() != null) trip.setDepartureTime(LocalTime.parse(req.getDepartureTime()));
        if (req.getArrivalTime() != null)   trip.setArrivalTime(LocalTime.parse(req.getArrivalTime()));
        if (req.getPrice() != null)         trip.setPrice(req.getPrice());
        return toTripResponse(tripRepository.save(trip));
    }

    /** Admin: Cập nhật thông tin xe */
    public TripDto.BusDto updateBus(Long id, TripDto.CreateBusRequest req) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + id));
        if (req.getPlateNumber() != null) bus.setPlateNumber(req.getPlateNumber());
        if (req.getName() != null)        bus.setName(req.getName());
        if (req.getBusTypeId() != null) {
            BusType busType = busTypeRepository.findById(req.getBusTypeId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại xe: " + req.getBusTypeId()));
            bus.setBusType(busType);
        }
        return toBusDto(busRepository.save(bus));
    }

    // ════════════════════════════════════════════════════════
    // 5. SEAT LOCKING — Khóa ghế khi đặt vé
    //    Được gọi bởi order-service qua Feign Client
    // ════════════════════════════════════════════════════════

    /**
     * Khóa ghế khi order-service xác nhận đặt vé
     * POST /api/trips/{id}/lock-seats
     *
     * @Transactional: toàn bộ thao tác trong 1 transaction
     * → Nếu lỗi giữa chừng → rollback (tránh trừ ghế mà không cập nhật bookedSeats)
     *
     * Logic:
     * 1. Kiểm tra ghế yêu cầu có conflict không (đã được đặt chưa)
     * 2. Kiểm tra còn đủ chỗ không
     * 3. Cập nhật atomic qua @Modifying query (tránh race condition)
     */
    @Transactional
    public TripDto.SeatLockResponse lockSeats(Long tripId, List<String> seats) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + tripId));

        // Parse danh sách ghế đã đặt từ JSON string → List<String>
        List<String> currentBooked = parseSeats(trip.getBookedSeats());

        // Tìm ghế bị conflict (yêu cầu đặt ghế đã có người đặt rồi)
        List<String> conflicts = seats.stream()
                .filter(currentBooked::contains) // Lọc ghế có trong currentBooked
                .collect(Collectors.toList());

        if (!conflicts.isEmpty()) {
            // Trả về lỗi với danh sách ghế conflict (không throw exception — order-service xử lý)
            return TripDto.SeatLockResponse.builder()
                    .success(false)
                    .message("Ghế đã được đặt: " + String.join(", ", conflicts))
                    .build();
        }

        // Kiểm tra số chỗ còn trống có đủ không
        if (trip.getAvailableSeats() < seats.size()) {
            return TripDto.SeatLockResponse.builder()
                    .success(false)
                    .message("Không đủ chỗ trống")
                    .build();
        }

        // Thêm ghế mới vào danh sách đã đặt
        currentBooked.addAll(seats);

        // Cập nhật atomic: bookedSeats (JSON) + availableSeats (trừ đi)
        // Dùng @Modifying query thay vì save() để tránh race condition
        tripRepository.lockSeats(tripId, serializeSeats(currentBooked), seats.size());
        log.info("Locked seats {} for trip {}", seats, tripId);

        return TripDto.SeatLockResponse.builder()
                .success(true)
                .message("Khóa ghế thành công")
                .build();
    }

    // ════════════════════════════════════════════════════════
    // 6. PICKUP POINTS — Điểm đón/trả khách
    // ════════════════════════════════════════════════════════

    /**
     * Lấy danh sách điểm đón/trả theo thành phố
     * GET /api/pickup-points?city=Hà Nội
     */
    public List<TripDto.PickupPointDto> getPickupPoints(String city) {
        return pickupPointRepository.findByCityAndActiveTrueOrderByTimeOffset(city)
                .stream().map(this::toPickupDto).collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════
    // 7. SEAT MAP GENERATION — Sinh sơ đồ ghế
    // ════════════════════════════════════════════════════════

    /**
     * Sinh sơ đồ ghế theo loại xe
     * GET /api/trips/{id}/seats
     *
     * Thuật toán:
     * - LIMOUSINE/SLEEPER: 2 ghế/hàng
     * - STANDARD/VIP    : 4 ghế/hàng
     * - Đặt tên ghế theo pattern: A1, A2, B1, B2... (hàng + số thứ tự)
     * - Ghế trong bookedSeats → status = "booked", còn lại → "available"
     * - SLEEPER có 2 tầng: tầng 1 (floor=1) và tầng 2 (floor=2)
     */
    public TripDto.SeatMapResponse getSeatMap(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + tripId));

        BusType busType = trip.getBus().getBusType();
        List<String> bookedSeats = parseSeats(trip.getBookedSeats()); // Parse ghế đã đặt
        int totalSeats = busType.getTotalSeats();
        String code = busType.getCode(); // "STANDARD", "VIP", "SLEEPER", "LIMOUSINE"

        // Xác định số ghế mỗi hàng dựa theo loại xe
        int seatsPerRow = code.equals("LIMOUSINE") ? 2 : code.equals("SLEEPER") ? 2 : 4;
        String letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // Ký tự đánh số hàng

        List<List<TripDto.SeatDto>> rows = new ArrayList<>();
        int seatCount = 0;

        // Duyệt từng hàng (A, B, C...) và tạo các ghế trong hàng
        for (int r = 0; r < letters.length() && seatCount < totalSeats; r++) {
            List<TripDto.SeatDto> row = new ArrayList<>();
            for (int s = 1; s <= seatsPerRow && seatCount < totalSeats; s++) {
                String seatId = letters.charAt(r) + String.valueOf(s); // "A1", "A2"...
                row.add(TripDto.SeatDto.builder()
                        .id(seatId)
                        .label(seatId)
                        // Kiểm tra ghế trong danh sách booked → "booked" hoặc "available"
                        .status(bookedSeats.contains(seatId) ? "booked" : "available")
                        // SLEEPER: nửa sau là tầng 2 (floor=2), nửa đầu tầng 1 (floor=1)
                        .floor(code.equals("SLEEPER") && r >= (totalSeats / seatsPerRow / 2) ? 2 : 1)
                        .build());
                seatCount++;
            }
            rows.add(row);
        }

        return TripDto.SeatMapResponse.builder()
                .tripId(tripId)
                .busType(busType.getCode())
                .totalSeats(totalSeats)
                .availableSeats(trip.getAvailableSeats())
                .seatRows(rows)
                .build();
    }

    // ════════════════════════════════════════════════════════
    // 8. ADMIN UTILITIES
    // ════════════════════════════════════════════════════════

    /**
     * Admin: Thay đổi trạng thái chuyến
     * PUT /api/admin/trips/{id}/status
     * Body: { "status": "DEPARTED" }
     */
    @CacheEvict(value = "trips", allEntries = true) // Xóa cache sau khi đổi status
    public TripDto.TripResponse updateTripStatus(Long id, String status) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + id));
        trip.setStatus(Trip.Status.valueOf(status)); // Parse String → Enum
        return toTripResponse(tripRepository.save(trip));
    }

    /**
     * Admin: Lấy thống kê chuyến theo trạng thái
     * GET /api/admin/trips/stats
     */
    public TripDto.TripStatsResponse getTripStats() {
        return TripDto.TripStatsResponse.builder()
                .total(tripRepository.count())                            // Tổng số chuyến
                .scheduled(tripRepository.countByStatus(Trip.Status.SCHEDULED))  // Đang lên lịch
                .departed(tripRepository.countByStatus(Trip.Status.DEPARTED))    // Đã xuất bến
                .cancelled(tripRepository.countByStatus(Trip.Status.CANCELLED))  // Đã hủy
                .completed(tripRepository.countByStatus(Trip.Status.COMPLETED))  // Đã hoàn thành
                .build();
    }

    /** Admin: Tìm kiếm xe theo từ khóa (biển số, tên xe) */
    public List<TripDto.BusDto> searchBusesAdmin(String q) {
        return busRepository.searchByKeyword(q.toLowerCase()).stream()
                .map(this::toBusDto)
                .collect(Collectors.toList());
    }

    /** Admin: Lấy chi tiết 1 xe */
    public TripDto.BusDto getBusById(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + id));
        return toBusDto(bus);
    }

    /**
     * Admin: Thay đổi trạng thái xe (ACTIVE/MAINTENANCE/INACTIVE)
     * PUT /api/admin/buses/{id}/status
     */
    @CacheEvict(value = "trips", allEntries = true)
    public TripDto.BusDto updateBusStatus(Long id, String status) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + id));
        bus.setStatus(Bus.Status.valueOf(status)); // Parse String → Enum
        return toBusDto(busRepository.save(bus));
    }

    /**
     * Admin: Cập nhật thông tin vi phạm giao thông của xe
     * PUT /api/admin/buses/{id}/violation
     *
     * Nếu violationDate + violationExpiry đều null → xóa vi phạm
     * Nếu có giá trị → cập nhật và chuyển trạng thái xe sang MAINTENANCE
     */
    @CacheEvict(value = "trips", allEntries = true)
    public TripDto.BusDto updateBusViolation(Long id, TripDto.UpdateBusViolationRequest req) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + id));
        bus.setViolationDate(req.getViolationDate());
        bus.setViolationExpiry(req.getViolationExpiry());
        bus.setViolationReason(req.getViolationReason());
        // Nếu có vi phạm → tự động chuyển sang MAINTENANCE
        // Nếu xóa vi phạm → tự động chuyển lại ACTIVE
        if (req.getViolationDate() != null && req.getViolationExpiry() != null) {
            bus.setStatus(Bus.Status.MAINTENANCE);
        } else if (bus.getStatus() == Bus.Status.MAINTENANCE) {
            bus.setStatus(Bus.Status.ACTIVE);
        }
        return toBusDto(busRepository.save(bus));
    }

    // ════════════════════════════════════════════════════════
    // 6B. ADMIN PICKUP POINTS — Quản lý Điểm đón/trả
    // ════════════════════════════════════════════════════════

    public List<TripDto.PickupPointDto> getAllPickupPointsAdmin() {
        return pickupPointRepository.findAllByOrderByCityAsc()
            .stream().map(this::toPickupDto).collect(Collectors.toList());
    }

    public List<TripDto.PickupPointDto> getPickupPointsByCityAdmin(String city) {
        return pickupPointRepository.findByCityOrderByName(city)
            .stream().map(this::toPickupDto).collect(Collectors.toList());
    }

    public TripDto.PickupPointDto createPickupPoint(TripDto.CreatePickupPointRequest req) {
        PickupPoint pp = PickupPoint.builder()
            .city(req.getCity())
            .name(req.getName())
            .timeOffset(req.getTimeOffset() != null ? req.getTimeOffset() : "0 phút")
            .type(PickupPoint.PointType.valueOf(req.getType() != null ? req.getType() : "BOTH"))
            .active(true)
            .build();
        return toPickupDto(pickupPointRepository.save(pp));
    }

    public TripDto.PickupPointDto updatePickupPoint(Long id, TripDto.UpdatePickupPointRequest req) {
        PickupPoint pp = pickupPointRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy điểm đón/trả: " + id));
        if (req.getCity() != null) pp.setCity(req.getCity());
        if (req.getName() != null) pp.setName(req.getName());
        if (req.getTimeOffset() != null) pp.setTimeOffset(req.getTimeOffset());
        if (req.getType() != null) pp.setType(PickupPoint.PointType.valueOf(req.getType()));
        if (req.getActive() != null) pp.setActive(req.getActive());
        return toPickupDto(pickupPointRepository.save(pp));
    }

    public void deletePickupPoint(Long id) {
        PickupPoint pp = pickupPointRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy điểm đón/trả: " + id));
        pp.setActive(false);
        pickupPointRepository.save(pp);
    }

    // ════════════════════════════════════════════════════════
    // TRIP ↔ PICKUP POINTS
    // ════════════════════════════════════════════════════════

    public List<TripDto.TripPickupPointDto> getTripPickupPoints(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + tripId));
        return tripPickupPointRepository.findByTripId(tripId)
            .stream().map(tp -> {
                PickupPoint pp = tp.getPickupPoint();
                return TripDto.TripPickupPointDto.builder()
                    .id(tp.getId())
                    .tripId(tripId)
                    .pickupPointId(pp.getId())
                    .pickupPointName(pp.getName())
                    .city(pp.getCity())
                    .timeOffset(pp.getTimeOffset())
                    .type(pp.getType().name())
                    .role(tp.getRole().name())
                    .build();
            }).collect(Collectors.toList());
    }

    public List<TripDto.TripPickupPointDto> saveTripPickupPoints(Long tripId, TripDto.SaveTripPickupPointsRequest req) {
        Trip trip = tripRepository.findById(tripId)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + tripId));
        tripPickupPointRepository.deleteByTripId(tripId);

        List<TripPickupPoint> saved = new ArrayList<>();
        if (req.getPickupPointIds() != null) {
            for (Long ppId : req.getPickupPointIds()) {
                PickupPoint pp = pickupPointRepository.findById(ppId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy điểm đón/trả: " + ppId));
                saved.add(tripPickupPointRepository.save(TripPickupPoint.builder()
                    .trip(trip).pickupPoint(pp).role(TripPickupPoint.PointRole.PICKUP).build()));
            }
        }
        if (req.getDropoffPointIds() != null) {
            for (Long ppId : req.getDropoffPointIds()) {
                PickupPoint pp = pickupPointRepository.findById(ppId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy điểm đón/trả: " + ppId));
                saved.add(tripPickupPointRepository.save(TripPickupPoint.builder()
                    .trip(trip).pickupPoint(pp).role(TripPickupPoint.PointRole.DROPOFF).build()));
            }
        }
        return saved.stream().map(tp -> {
            PickupPoint pp = tp.getPickupPoint();
            return TripDto.TripPickupPointDto.builder()
                .id(tp.getId())
                .tripId(tripId)
                .pickupPointId(pp.getId())
                .pickupPointName(pp.getName())
                .city(pp.getCity())
                .timeOffset(pp.getTimeOffset())
                .type(pp.getType().name())
                .role(tp.getRole().name())
                .build();
        }).collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════
    // CITY OPERATIONS — Quản lý tỉnh/thành phố
    // ════════════════════════════════════════════════════════

    public List<TripDto.CityDto> getAllCities() {
        return cityRepository.findByActiveTrueOrderByName().stream()
                .map(this::toCityDto).collect(Collectors.toList());
    }

    public List<TripDto.CityDto> getAllCitiesAdmin() {
        return cityRepository.findAllByOrderByName().stream()
                .map(this::toCityDto).collect(Collectors.toList());
    }

    public TripDto.CityDto createCity(TripDto.CreateCityRequest req) {
        List<City> existing = cityRepository.findAllByOrderByName();
        for (City c : existing) {
            if (c.getName().equalsIgnoreCase(req.getName())) {
                if (c.getActive()) {
                    throw new IllegalArgumentException("Thành phố đã tồn tại: " + req.getName());
                }
                c.setActive(true);
                return toCityDto(cityRepository.save(c));
            }
        }
        City city = City.builder().name(req.getName()).active(true).build();
        return toCityDto(cityRepository.save(city));
    }

    public TripDto.CityDto updateCity(Long id, TripDto.CreateCityRequest req) {
        City city = cityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành phố: " + id));
        if (req.getName() != null) city.setName(req.getName());
        if (req.getActive() != null) city.setActive(req.getActive());
        return toCityDto(cityRepository.save(city));
    }

    public void deleteCity(Long id) {
        City city = cityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành phố: " + id));
        city.setActive(false);
        cityRepository.save(city);
    }

    public void permanentDeleteCity(Long id) {
        City city = cityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành phố: " + id));
        cityRepository.delete(city);
    }

    // ════════════════════════════════════════════════════════
    // ── PRIVATE HELPER METHODS ──
    // ════════════════════════════════════════════════════════

    /**
     * Parse JSON string → List<String>
     * Input : "[\"A1\",\"A2\",\"B3\"]"
     * Output: ["A1", "A2", "B3"]
     * Nếu null/blank hoặc lỗi → trả về list rỗng (an toàn)
     */
    private List<String> parseSeats(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>(); // Tránh crash nếu JSON bị corrupt
        }
    }

    /**
     * Serialize List<String> → JSON string
     * Input : ["A1", "A2", "B3"]
     * Output: "[\"A1\",\"A2\",\"B3\"]"
     */
    private String serializeSeats(List<String> seats) {
        try {
            return objectMapper.writeValueAsString(seats);
        } catch (Exception e) {
            return "[]"; // Fallback an toàn
        }
    }

    /**
     * Chuyển Route entity → RouteDto
     * (DTO không có active, createdAt, updatedAt — frontend không cần)
     */
    private TripDto.RouteDto toRouteDto(Route r) {
        TripDto.RouteDto dto = new TripDto.RouteDto();
        dto.setId(r.getId());
        dto.setFromCity(r.getFromCity());
        dto.setToCity(r.getToCity());
        dto.setDistanceKm(r.getDistanceKm());
        dto.setDurationMinutes(r.getDurationMinutes());
        dto.setBasePrice(r.getBasePrice());
        dto.setStops(r.getStops());
        dto.setImageUrl(r.getImageUrl());
        dto.setPopular(r.getPopular());
        dto.setActive(r.getActive());
        return dto;
    }

    /**
     * Chuyển Bus entity → BusDto
     * Bao gồm cả thông tin busType (name, code, totalSeats)
     */
    private TripDto.BusDto toBusDto(Bus b) {
        TripDto.BusDto dto = new TripDto.BusDto();
        dto.setId(b.getId());
        dto.setPlateNumber(b.getPlateNumber());
        dto.setName(b.getName());
        dto.setStatus(b.getStatus().name()); // Enum → String: "ACTIVE"
        dto.setViolationDate(b.getViolationDate());
        dto.setViolationExpiry(b.getViolationExpiry());
        dto.setViolationReason(b.getViolationReason());
        if (b.getBusType() != null) {        // Null-check an toàn
            dto.setBusTypeId(b.getBusType().getId());
            dto.setBusTypeName(b.getBusType().getName());
            dto.setBusTypeCode(b.getBusType().getCode()); // "SLEEPER", "VIP"...
            dto.setTotalSeats(b.getBusType().getTotalSeats());
        }
        return dto;
    }

    /** Chuyển BusType entity → BusTypeDto */
    private TripDto.BusTypeDto toBusTypeDto(BusType bt) {
        TripDto.BusTypeDto dto = new TripDto.BusTypeDto();
        dto.setId(bt.getId());
        dto.setName(bt.getName());
        dto.setCode(bt.getCode());
        dto.setTotalSeats(bt.getTotalSeats());
        dto.setDescription(bt.getDescription());
        dto.setIcon(bt.getIcon());
        return dto;
    }

    /**
     * Chuyển Trip entity → TripResponse
     * Bao gồm: thông tin chuyến + RouteDto + BusDto + danh sách ghế đã đặt
     */
    public List<TripDto.TripResponse> getActiveTrips() {
        return tripRepository.findActiveTrips().stream()
                .map(this::toTripResponse)
                .collect(Collectors.toList());
    }

    public List<TripDto.TripResponse> getCompletedTrips() {
        return tripRepository.findByStatusOrderByTripDateDescDepartureTimeDesc(Trip.Status.COMPLETED)
                .stream().map(this::toTripResponse).collect(Collectors.toList());
    }

    public List<TripDto.TripResponse> searchCompletedTrips(String q) {
        return tripRepository.searchCompletedTrips(q.toLowerCase()).stream()
                .map(this::toTripResponse).collect(Collectors.toList());
    }

    public List<TripDto.TripResponse> getCompletedTripsByDate(String date) {
        return tripRepository.findCompletedTripsByDate(LocalDate.parse(date)).stream()
                .map(this::toTripResponse).collect(Collectors.toList());
    }

    @CacheEvict(value = "trips", allEntries = true)
    public TripDto.TripResponse confirmTripCompleted(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + id));
        trip.setStatus(Trip.Status.COMPLETED);
        return toTripResponse(tripRepository.save(trip));
    }

    private TripDto.TripResponse toTripResponse(Trip t) {
        TripDto.TripResponse dto = new TripDto.TripResponse();
        dto.setId(t.getId());
        dto.setTripDate(t.getTripDate().toString());
        dto.setDepartureTime(t.getDepartureTime().toString());
        dto.setArrivalTime(t.getArrivalTime().toString());
        dto.setPrice(t.getPrice());
        dto.setAvailableSeats(t.getAvailableSeats());
        dto.setBookedSeats(parseSeats(t.getBookedSeats()));
        dto.setStatus(t.getStatus().name());
        dto.setRealTimeStatus(calculateRealTimeStatus(t));
        dto.setRoute(toRouteDto(t.getRoute()));
        dto.setBus(toBusDto(t.getBus()));
        return dto;
    }

    private String calculateRealTimeStatus(Trip t) {
        if (t.getStatus() == Trip.Status.CANCELLED) return "CANCELLED";
        if (t.getStatus() == Trip.Status.COMPLETED) return "COMPLETED";

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        if (t.getTripDate().isAfter(today)) return "SCHEDULED";
        if (t.getTripDate().isBefore(today)) {
            if (t.getStatus() == Trip.Status.SCHEDULED) return "MISSED";
            if (t.getStatus() == Trip.Status.COMPLETED) return "COMPLETED";
            return "COMPLETED";
        }

        if (t.getStatus() == Trip.Status.DEPARTED) return "IN_PROGRESS";

        if (t.getStatus() == Trip.Status.SCHEDULED) {
            long minutesUntil = java.time.Duration.between(currentTime, t.getDepartureTime()).toMinutes();
            if (minutesUntil <= 0) return "DEPARTING_NOW";
            if (minutesUntil <= 30) return "PREPARING";
            return "SCHEDULED";
        }

        return t.getStatus().name();
    }

    /** Chuyển PickupPoint entity → PickupPointDto */
    private TripDto.PickupPointDto toPickupDto(PickupPoint p) {
        TripDto.PickupPointDto dto = new TripDto.PickupPointDto();
        dto.setId(p.getId());
        dto.setCity(p.getCity());
        dto.setName(p.getName());
        dto.setTimeOffset(p.getTimeOffset());
        dto.setType(p.getType().name()); // Enum → String: "PICKUP", "DROPOFF", "BOTH"
        return dto;
    }

    private TripDto.CityDto toCityDto(City c) {
        TripDto.CityDto dto = new TripDto.CityDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setActive(c.getActive());
        return dto;
    }
}