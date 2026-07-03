package com.vevui.tripservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vevui.tripservice.dto.TripDto;
import com.vevui.tripservice.entity.*;
import com.vevui.tripservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final RouteRepository routeRepository;
    private final BusRepository busRepository;
    private final BusTypeRepository busTypeRepository;
    private final PickupPointRepository pickupPointRepository;
    private final ObjectMapper objectMapper;

    // ── Route Operations ──

    @Cacheable(value = "routes", key = "'all'")
    public List<TripDto.RouteDto> getAllRoutes() {
        return routeRepository.findByActiveTrue().stream()
                .map(this::toRouteDto)
                .collect(Collectors.toList());
    }

    /** Admin: lấy tất cả tuyến kể cả inactive, có phân trang */
    public Page<TripDto.RouteDto> getAllRoutesAdmin(Pageable pageable) {
        return routeRepository.findAll(pageable).map(this::toRouteDto);
    }

    @Cacheable(value = "routes", key = "'popular'")
    public List<TripDto.RouteDto> getPopularRoutes() {
        return routeRepository.findByPopularTrueAndActiveTrue().stream()
                .map(this::toRouteDto)
                .collect(Collectors.toList());
    }

    public TripDto.RouteDto getRouteById(Long id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuyến: " + id));
        return toRouteDto(route);
    }

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
                .popular(Boolean.TRUE.equals(req.getPopular()))
                .build();
        return toRouteDto(routeRepository.save(route));
    }

    @CacheEvict(value = "routes", allEntries = true)
    public TripDto.RouteDto updateRoute(Long id, TripDto.CreateRouteRequest req) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuyến: " + id));
        if (req.getFromCity() != null) route.setFromCity(req.getFromCity());
        if (req.getToCity() != null) route.setToCity(req.getToCity());
        if (req.getBasePrice() != null) route.setBasePrice(req.getBasePrice());
        if (req.getPopular() != null) route.setPopular(req.getPopular());
        if (req.getStops() != null) route.setStops(req.getStops());
        return toRouteDto(routeRepository.save(route));
    }

    @CacheEvict(value = "routes", allEntries = true)
    public void deleteRoute(Long id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuyến: " + id));
        route.setActive(false);
        routeRepository.save(route);
    }

    // ── Bus Operations ──

    public List<TripDto.BusTypeDto> getAllBusTypes() {
        return busTypeRepository.findAll().stream().map(this::toBusTypeDto).collect(Collectors.toList());
    }

    public TripDto.BusTypeDto getBusTypeById(Long id) {
        BusType busType = busTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại xe: " + id));
        return toBusTypeDto(busType);
    }

    public TripDto.BusTypeDto createBusType(TripDto.CreateBusTypeRequest req) {
        BusType busType = BusType.builder()
                .name(req.getName())
                .code(req.getCode())
                .totalSeats(req.getTotalSeats())
                .description(req.getDescription())
                .icon(req.getIcon() != null ? req.getIcon() : "🚌")
                .build();
        return toBusTypeDto(busTypeRepository.save(busType));
    }

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

    public void deleteBusType(Long id) {
        BusType busType = busTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại xe: " + id));
        busTypeRepository.delete(busType);
    }

    public List<TripDto.BusDto> getAllBuses() {
        return busRepository.findAll().stream().map(this::toBusDto).collect(Collectors.toList());
    }

    /** Admin: lấy danh sách xe có phân trang */
    public Page<TripDto.BusDto> getAllBusesAdmin(Pageable pageable) {
        return busRepository.findAll(pageable).map(this::toBusDto);
    }

    /** Admin: xóa xe (soft delete — đặt status = INACTIVE) */
    public void deleteBus(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + id));
        bus.setStatus(Bus.Status.INACTIVE);
        busRepository.save(bus);
        log.info("Bus {} set to INACTIVE", id);
    }

    public TripDto.BusDto createBus(TripDto.CreateBusRequest req) {
        BusType busType = busTypeRepository.findById(req.getBusTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại xe: " + req.getBusTypeId()));

        Bus bus = Bus.builder()
                .plateNumber(req.getPlateNumber())
                .name(req.getName())
                .busType(busType)
                .status(Bus.Status.ACTIVE)
                .build();
        return toBusDto(busRepository.save(bus));
    }

    // ── Trip Search (Cached) ──

    /** Admin: lấy tất cả chuyến đi có phân trang */
    public Page<TripDto.TripResponse> getAllTripsAdmin(Pageable pageable) {
        return tripRepository.findAll(pageable).map(this::toTripResponse);
    }

    /** Admin: tìm chuyến theo keyword (fromCity, toCity, tripDate) */
    public List<TripDto.TripResponse> searchTripsAdmin(String q) {
        return tripRepository.searchByKeyword(q.toLowerCase()).stream()
                .map(this::toTripResponse)
                .collect(Collectors.toList());
    }

    /** Admin: xóa chuyến đi (soft delete — đặt status = CANCELLED) */
    @CacheEvict(value = "trips", allEntries = true)
    public void deleteTrip(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + id));
        trip.setStatus(Trip.Status.CANCELLED);
        tripRepository.save(trip);
        log.info("Trip {} set to CANCELLED", id);
    }

    @Cacheable(value = "trips", key = "#fromCity + '-' + #toCity + '-' + #date")
    public List<TripDto.TripResponse> searchTrips(String fromCity, String toCity, String date) {
        LocalDate tripDate = LocalDate.parse(date);
        List<Trip> trips = tripRepository.searchTrips(fromCity, toCity, tripDate);
        log.info("Search trips: {} → {} on {} → {} results", fromCity, toCity, date, trips.size());
        return trips.stream().map(this::toTripResponse).collect(Collectors.toList());
    }

    public TripDto.TripResponse getTripById(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + id));
        return toTripResponse(trip);
    }

    @CacheEvict(value = "trips", allEntries = true)
    public TripDto.TripResponse createTrip(TripDto.CreateTripRequest req) {
        Route route = routeRepository.findById(req.getRouteId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tuyến: " + req.getRouteId()));
        Bus bus = busRepository.findById(req.getBusId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + req.getBusId()));

        Trip trip = Trip.builder()
                .route(route)
                .bus(bus)
                .tripDate(LocalDate.parse(req.getTripDate()))
                .departureTime(LocalTime.parse(req.getDepartureTime()))
                .arrivalTime(LocalTime.parse(req.getArrivalTime()))
                .price(req.getPrice())
                .availableSeats(bus.getBusType().getTotalSeats())
                .build();

        return toTripResponse(tripRepository.save(trip));
    }

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

    // ── Seat Locking (called by order-service via Feign) ──

    @Transactional
    public TripDto.SeatLockResponse lockSeats(Long tripId, List<String> seats) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + tripId));

        List<String> currentBooked = parseSeats(trip.getBookedSeats());
        // Check for conflicts
        List<String> conflicts = seats.stream()
                .filter(currentBooked::contains)
                .collect(Collectors.toList());

        if (!conflicts.isEmpty()) {
            return TripDto.SeatLockResponse.builder()
                    .success(false)
                    .message("Ghế đã được đặt: " + String.join(", ", conflicts))
                    .build();
        }

        if (trip.getAvailableSeats() < seats.size()) {
            return TripDto.SeatLockResponse.builder()
                    .success(false)
                    .message("Không đủ chỗ trống")
                    .build();
        }

        currentBooked.addAll(seats);
        tripRepository.lockSeats(tripId, serializeSeats(currentBooked), seats.size());
        log.info("Locked seats {} for trip {}", seats, tripId);

        return TripDto.SeatLockResponse.builder()
                .success(true)
                .message("Khóa ghế thành công")
                .build();
    }

    // ── Pickup Points ──

    public List<TripDto.PickupPointDto> getPickupPoints(String city) {
        return pickupPointRepository.findByCityAndActiveTrueOrderByTimeOffset(city)
                .stream().map(this::toPickupDto).collect(Collectors.toList());
    }

    // ── Seat Map Generation ──

    public TripDto.SeatMapResponse getSeatMap(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + tripId));

        BusType busType = trip.getBus().getBusType();
        List<String> bookedSeats = parseSeats(trip.getBookedSeats());
        int totalSeats = busType.getTotalSeats();
        String code = busType.getCode();

        int seatsPerRow = code.equals("LIMOUSINE") ? 2 : code.equals("SLEEPER") ? 2 : 4;
        String letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        List<List<TripDto.SeatDto>> rows = new ArrayList<>();
        int seatCount = 0;

        for (int r = 0; r < letters.length() && seatCount < totalSeats; r++) {
            List<TripDto.SeatDto> row = new ArrayList<>();
            for (int s = 1; s <= seatsPerRow && seatCount < totalSeats; s++) {
                String seatId = letters.charAt(r) + String.valueOf(s);
                row.add(TripDto.SeatDto.builder()
                        .id(seatId)
                        .label(seatId)
                        .status(bookedSeats.contains(seatId) ? "booked" : "available")
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

    // ── Admin: Trip Status ──

    @CacheEvict(value = "trips", allEntries = true)
    public TripDto.TripResponse updateTripStatus(Long id, String status) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến: " + id));
        trip.setStatus(Trip.Status.valueOf(status));
        return toTripResponse(tripRepository.save(trip));
    }

    public TripDto.TripStatsResponse getTripStats() {
        return TripDto.TripStatsResponse.builder()
                .total(tripRepository.count())
                .scheduled(tripRepository.countByStatus(Trip.Status.SCHEDULED))
                .departed(tripRepository.countByStatus(Trip.Status.DEPARTED))
                .cancelled(tripRepository.countByStatus(Trip.Status.CANCELLED))
                .completed(tripRepository.countByStatus(Trip.Status.COMPLETED))
                .build();
    }

    // ── Admin: Bus Detail & Status ──

    public List<TripDto.BusDto> searchBusesAdmin(String q) {
        return busRepository.searchByKeyword(q.toLowerCase()).stream()
                .map(this::toBusDto)
                .collect(Collectors.toList());
    }

    public TripDto.BusDto getBusById(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + id));
        return toBusDto(bus);
    }

    @CacheEvict(value = "trips", allEntries = true)
    public TripDto.BusDto updateBusStatus(Long id, String status) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe: " + id));
        bus.setStatus(Bus.Status.valueOf(status));
        return toBusDto(busRepository.save(bus));
    }

    // ── Private helpers ──

    private List<String> parseSeats(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String serializeSeats(List<String> seats) {
        try {
            return objectMapper.writeValueAsString(seats);
        } catch (Exception e) {
            return "[]";
        }
    }

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
        return dto;
    }

    private TripDto.BusDto toBusDto(Bus b) {
        TripDto.BusDto dto = new TripDto.BusDto();
        dto.setId(b.getId());
        dto.setPlateNumber(b.getPlateNumber());
        dto.setName(b.getName());
        dto.setStatus(b.getStatus().name());
        if (b.getBusType() != null) {
            dto.setBusTypeId(b.getBusType().getId());
            dto.setBusTypeName(b.getBusType().getName());
            dto.setBusTypeCode(b.getBusType().getCode());
            dto.setTotalSeats(b.getBusType().getTotalSeats());
        }
        return dto;
    }

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
        dto.setRoute(toRouteDto(t.getRoute()));
        dto.setBus(toBusDto(t.getBus()));
        return dto;
    }

    private TripDto.PickupPointDto toPickupDto(PickupPoint p) {
        TripDto.PickupPointDto dto = new TripDto.PickupPointDto();
        dto.setId(p.getId());
        dto.setCity(p.getCity());
        dto.setName(p.getName());
        dto.setTimeOffset(p.getTimeOffset());
        dto.setType(p.getType().name());
        return dto;
    }
}
