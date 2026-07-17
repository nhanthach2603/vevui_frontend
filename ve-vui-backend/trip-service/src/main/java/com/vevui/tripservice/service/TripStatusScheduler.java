package com.vevui.tripservice.service;

import com.vevui.tripservice.entity.Trip;
import com.vevui.tripservice.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripStatusScheduler {

    private final TripRepository tripRepository;

    @Scheduled(fixedRate = 60000)
    public void updateTripStatuses() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        List<Trip> trips = tripRepository.findByTripDateAndStatusIn(today, List.of(Trip.Status.SCHEDULED, Trip.Status.DEPARTED));

        for (Trip trip : trips) {
            if (trip.getStatus() == Trip.Status.SCHEDULED) {
                if (currentTime.isAfter(trip.getDepartureTime()) || currentTime.equals(trip.getDepartureTime())) {
                    trip.setStatus(Trip.Status.DEPARTED);
                    tripRepository.save(trip);
                    log.info("Auto DEPARTED trip {} (departure {} <= now {})", trip.getId(), trip.getDepartureTime(), currentTime);
                }
            } else if (trip.getStatus() == Trip.Status.DEPARTED) {
                if (currentTime.isAfter(trip.getArrivalTime()) || currentTime.equals(trip.getArrivalTime())) {
                    trip.setStatus(Trip.Status.COMPLETED);
                    tripRepository.save(trip);
                    log.info("Auto COMPLETED trip {} (arrival {} <= now {})", trip.getId(), trip.getArrivalTime(), currentTime);
                }
            }
        }
    }
}
