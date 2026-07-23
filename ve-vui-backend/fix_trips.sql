USE db_trips;
DELETE FROM trips;
INSERT INTO trips (route_id, bus_id, trip_date, departure_time, arrival_time, price, available_seats, booked_seats, status) VALUES
(1, 1, '2026-07-12', '06:00', '12:00', 180000, 35, '["A1","A2","B3"]', 'SCHEDULED'),
(1, 2, '2026-07-12', '08:30', '14:30', 220000, 25, '["A1","A2","A3","B1"]', 'SCHEDULED'),
(1, 4, '2026-07-12', '13:00', '19:00', 260000, 30, '["A1"]', 'SCHEDULED'),
(1, 3, '2026-07-12', '21:00', '03:00', 350000, 8, '["A1","A2","B1","B2","C1"]', 'SCHEDULED'),
(2, 2, '2026-07-12', '07:00', '16:00', 250000, 15, '["A1","A2"]', 'SCHEDULED'),
(2, 3, '2026-07-12', '20:00', '05:00', 320000, 10, '["A1","B2"]', 'SCHEDULED'),
(3, 1, '2026-07-12', '06:00', '08:30', 120000, 30, '["A1"]', 'SCHEDULED'),
(3, 3, '2026-07-12', '09:00', '11:30', 180000, 18, '["A1","A2","B1"]', 'SCHEDULED'),
(4, 2, '2026-07-12', '18:00', '10:00', 450000, 20, '[]', 'SCHEDULED'),
(4, 3, '2026-07-12', '19:30', '11:30', 550000, 6, '["A1","A2"]', 'SCHEDULED'),
(1, 1, '2026-07-13', '07:00', '13:00', 180000, 40, '[]', 'SCHEDULED'),
(1, 2, '2026-07-13', '19:30', '01:30', 220000, 25, '["A1"]', 'SCHEDULED'),
(2, 1, '2026-07-13', '06:30', '15:30', 250000, 38, '[]', 'SCHEDULED');
SELECT id, route_id, trip_date, departure_time, status FROM trips ORDER BY trip_date, departure_time;
