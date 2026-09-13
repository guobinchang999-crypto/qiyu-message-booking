-- Persistent demo bookings seeded relative to the current date so the operations
-- dashboard (今日预约 / 待到店 / 服务中 / 预计营业额 / 近 7 日趋势 / 门店排名)
-- always shows meaningful data in the local profile.
SET NAMES utf8mb4;

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
-- today: populates 今日预约 / 待到店 / 服务中 / 预计营业额
('BK-DEMO-01', @demo_customer_id, @jingan_id, @neck_id, 'SPECIFIED', @anran_id, @jingan_r02,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '11:00:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '09:50:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '11:10:00'),
 1, '林女士', '13800001234', 'MINI_PROGRAM', 'BOOKED', 168.00, 50.00, 50.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway'),
('BK-DEMO-02', @demo_customer_id, @jingan_id, @aroma_id, 'SPECIFIED', @anran_id, @jingan_r01,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '11:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '12:30:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '10:45:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '12:45:00'),
 1, '林女士', '13800001234', 'MINI_PROGRAM', 'CHECKED_IN', 338.00, 50.00, 50.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway'),
('BK-DEMO-03', @demo_customer_id, @jingan_id, @neck_id, 'SPECIFIED', @anran_id, @jingan_r01,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '14:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '15:00:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '13:50:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '15:10:00'),
 1, '林女士', '13800001234', 'MINI_PROGRAM', 'IN_SERVICE', 168.00, 50.00, 50.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway'),
('BK-DEMO-04', @other_customer_id, @xujiahui_id, @tuina_id, 'SPECIFIED', @yuanyuan_id, @xujiahui_r01,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '16:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '17:30:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '15:50:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '17:45:00'),
 1, '周女士', '13900005678', 'MINI_PROGRAM', 'IN_SERVICE', 258.00, 50.00, 50.00, (SELECT user_id FROM customer WHERE id = @other_customer_id), 'flyway'),
('BK-DEMO-05', @demo_customer_id, @xujiahui_id, @tuina_id, 'SPECIFIED', @yuanyuan_id, @xujiahui_r01,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '19:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '20:30:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '18:45:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 0 DAY), '20:45:00'),
 1, '林女士', '13800001234', 'MINI_PROGRAM', 'BOOKED', 258.00, 50.00, 50.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway'),
-- past six days: populates the 近 7 日营业额趋势 line chart
('BK-DEMO-06', @demo_customer_id, @jingan_id, @tuina_id, 'SPECIFIED', @anran_id, @jingan_r02,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -1 DAY), '15:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -1 DAY), '16:30:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -1 DAY), '14:50:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -1 DAY), '16:45:00'),
 1, '林女士', '13800001234', 'MINI_PROGRAM', 'COMPLETED', 258.00, 50.00, 258.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway'),
('BK-DEMO-07', @demo_customer_id, @jingan_id, @neck_id, 'SPECIFIED', @anran_id, @jingan_r01,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -2 DAY), '14:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -2 DAY), '15:00:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -2 DAY), '13:50:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -2 DAY), '15:10:00'),
 1, '林女士', '13800001234', 'MINI_PROGRAM', 'COMPLETED', 168.00, 50.00, 168.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway'),
('BK-DEMO-08', @other_customer_id, @xujiahui_id, @aroma_id, 'SPECIFIED', @yuanyuan_id, @xujiahui_r01,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -3 DAY), '16:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -3 DAY), '17:30:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -3 DAY), '15:45:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -3 DAY), '17:45:00'),
 1, '周女士', '13900005678', 'MINI_PROGRAM', 'COMPLETED', 338.00, 50.00, 338.00, (SELECT user_id FROM customer WHERE id = @other_customer_id), 'flyway'),
('BK-DEMO-09', @demo_customer_id, @jingan_id, @neck_id, 'SPECIFIED', @anran_id, @jingan_r02,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -4 DAY), '13:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -4 DAY), '14:00:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -4 DAY), '12:50:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -4 DAY), '14:10:00'),
 1, '林女士', '13800001234', 'MINI_PROGRAM', 'COMPLETED', 168.00, 50.00, 168.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway'),
('BK-DEMO-10', @other_customer_id, @xujiahui_id, @tuina_id, 'SPECIFIED', @yuanyuan_id, @xujiahui_r01,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -5 DAY), '18:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -5 DAY), '19:30:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -5 DAY), '17:50:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -5 DAY), '19:45:00'),
 1, '周女士', '13900005678', 'MINI_PROGRAM', 'COMPLETED', 258.00, 50.00, 258.00, (SELECT user_id FROM customer WHERE id = @other_customer_id), 'flyway'),
('BK-DEMO-11', @demo_customer_id, @jingan_id, @aroma_id, 'SPECIFIED', @anran_id, @jingan_r01,
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -6 DAY), '11:00:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -6 DAY), '12:30:00'),
 TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -6 DAY), '10:45:00'), TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL -6 DAY), '12:45:00'),
 1, '林女士', '13800001234', 'MINI_PROGRAM', 'COMPLETED', 338.00, 50.00, 338.00, (SELECT user_id FROM customer WHERE id = @demo_customer_id), 'flyway');
