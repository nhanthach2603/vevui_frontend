SET NAMES utf8mb4;
USE db_news;
SELECT id, HEX(category) as cat_hex, category FROM news LIMIT 3;
