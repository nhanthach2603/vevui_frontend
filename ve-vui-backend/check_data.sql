USE db_trips;
SELECT id, from_city, to_city FROM routes WHERE id=1;
SELECT t.id, t.route_id, t.trip_date, r.from_city, r.to_city FROM trips t JOIN routes r ON t.route_id = r.id WHERE r.from_city LIKE '%HCM%' OR r.from_city LIKE '%Ho Chi%' OR r.from_city LIKE '%H%E1%BB%93%' LIMIT 3;
