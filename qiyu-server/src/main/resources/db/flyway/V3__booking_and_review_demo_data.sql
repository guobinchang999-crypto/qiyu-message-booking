-- Persistent demo data for the real booking and review repositories.
SET NAMES utf8mb4;

INSERT IGNORE INTO sys_user (user_type, display_name, status, created_by)
VALUES ('CUSTOMER', '周女士', 'ENABLED', 'flyway');
SET @other_customer_user_id = (SELECT id FROM sys_user WHERE user_type = 'CUSTOMER' AND display_name = '周女士' ORDER BY id LIMIT 1);
INSERT IGNORE INTO sys_user_identity (user_id, identity_type, identifier, credential_hash, verified, status, created_by)
VALUES (@other_customer_user_id, 'MOBILE', '13900005678', NULL, 1, 'ENABLED', 'flyway');
INSERT IGNORE INTO customer (user_id, mobile, nickname, member_level, status, created_by)
VALUES (@other_customer_user_id, '13900005678', '周女士', 'REGULAR', 'ENABLED', 'flyway');

INSERT IGNORE INTO therapist (therapist_code, store_id, therapist_name, level_name, experience_years, rating,
  service_count, specify_fee_amount, status, introduction, sort_order, enabled, created_by) VALUES
('TH_XH_YUANYUAN', (SELECT id FROM store WHERE store_code = 'XUJIAHUI'), '袁媛', '资深理疗师', 7, 4.8, 960, 20.00, 'AVAILABLE', '擅长中式推拿与肌肉放松。', 20, 1, 'flyway'),
('TH_LJZ_LIN', (SELECT id FROM store WHERE store_code = 'LUJIAZUI'), '林知夏', '高级理疗师', 6, 4.9, 880, 20.00, 'AVAILABLE', '擅长芳香舒缓与肩颈调理。', 30, 1, 'flyway');

SET @demo_customer_id = (SELECT id FROM customer WHERE mobile = '13800001288');
SET @other_customer_id = (SELECT id FROM customer WHERE mobile = '13900005678');
SET @jingan_id = (SELECT id FROM store WHERE store_code = 'JINGAN');
SET @xujiahui_id = (SELECT id FROM store WHERE store_code = 'XUJIAHUI');
SET @neck_id = (SELECT id FROM service_item WHERE service_code = 'NECK_60');
SET @tuina_id = (SELECT id FROM service_item WHERE service_code = 'TUINA_90');
SET @aroma_id = (SELECT id FROM service_item WHERE service_code = 'AROMA_90');
SET @anran_id = (SELECT id FROM therapist WHERE therapist_code = 'TH_JA_ANRAN');
SET @yuanyuan_id = (SELECT id FROM therapist WHERE therapist_code = 'TH_XH_YUANYUAN');
SET @jingan_r01 = (SELECT id FROM room WHERE store_id = @jingan_id AND room_code = 'R01');
SET @jingan_r02 = (SELECT id FROM room WHERE store_id = @jingan_id AND room_code = 'R02');
SET @xujiahui_r01 = (SELECT id FROM room WHERE store_id = @xujiahui_id AND room_code = 'R01');

INSERT IGNORE INTO booking (booking_no, customer_id, store_id, service_item_id, therapist_mode, therapist_id, room_id,
  scheduled_start_at, scheduled_end_at, occupied_start_at, occupied_end_at, guest_count, contact_name, contact_mobile,
  booking_source, status, item_amount, deposit_due_amount, paid_amount, created_by_user_id, created_by) VALUES
('BK-202608-1000', @demo_customer_id, @jingan_id, @neck_id, 'SPECIFIED', @anran_id, @jingan_r02,
 '2026-08-08 10:00:00', '2026-08-08 11:00:00', '2026-08-08 09:50:00', '2026-08-08 11:10:00', 1, '林女士', '13800001234', 'MINI_PROGRAM', 'BOOKED', 168.00, 50.00, 50.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway'),
('BK-202608-1001', @demo_customer_id, @jingan_id, @aroma_id, 'SPECIFIED', @anran_id, @jingan_r01,
 '2026-08-09 19:00:00', '2026-08-09 20:30:00', '2026-08-09 18:45:00', '2026-08-09 20:45:00', 1, '林女士', '13800001234', 'MINI_PROGRAM', 'PENDING_PAYMENT', 338.00, 50.00, 0.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway'),
('BK-202608-1002', @demo_customer_id, @jingan_id, @neck_id, 'SPECIFIED', @anran_id, @jingan_r01,
 '2026-08-11 10:00:00', '2026-08-11 11:00:00', '2026-08-11 09:50:00', '2026-08-11 11:10:00', 1, '林女士', '13800001234', 'MINI_PROGRAM', 'BOOKED', 168.00, 50.00, 50.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway'),
('BK-202608-1999', @other_customer_id, @xujiahui_id, @tuina_id, 'SPECIFIED', @yuanyuan_id, @xujiahui_r01,
 '2026-08-12 15:00:00', '2026-08-12 16:30:00', '2026-08-12 14:50:00', '2026-08-12 16:45:00', 1, '周女士', '13900005678', 'MINI_PROGRAM', 'BOOKED', 258.00, 50.00, 50.00, (SELECT user_id FROM customer WHERE id = @other_customer_id), 'flyway');

INSERT IGNORE INTO checkin_record (booking_id, checkin_code, checkin_status)
SELECT id, RIGHT(CONCAT('000000', id), 6), 'WAITING' FROM booking
WHERE booking_no IN ('BK-202608-1000', 'BK-202608-1001', 'BK-202608-1002', 'BK-202608-1999');

INSERT IGNORE INTO service_review (booking_id, customer_id, store_id, therapist_id, service_item_id,
  therapist_rating, environment_rating, service_rating, tags, content, anonymous, status)
SELECT b.id, b.customer_id, b.store_id, b.therapist_id, b.service_item_id, 5, 5, 5,
       '环境安静,手法专业', '环境安静，技师会提前确认肩颈重点，结束后放松感很明显。', 0, 'PUBLISHED'
FROM booking b WHERE b.booking_no = 'BK-202608-1000';
