-- Flyway V2: idempotent dictionaries, system security, organization and demo catalog data.
SET NAMES utf8mb4;

INSERT IGNORE INTO dict_type (type_code, type_name, description, sort_order) VALUES
('booking_status', '预约状态', '预约和服务订单统一状态', 10),
('payment_status', '支付状态', '支付与退款状态', 20),
('therapist_status', '技师状态', '技师可约和服务状态', 30),
('room_status', '房间状态', '房间占用状态', 40),
('time_slot_status', '时间槽状态', '客户端可约时间槽状态', 50),
('business_status', '营业状态', '门店营业状态', 60),
('coupon_status', '优惠券状态', '优惠券活动和客户券状态', 70),
('member_scope', '权益范围', '统一品牌权益范围', 80),
('sys_user_status', '统一用户状态', '统一登录用户状态', 90),
('schedule_status', '排班状态', '技师排班状态', 100),
('checkin_status', '签到状态', '到店签到状态', 110),
('resource_occupation_status', '资源占用状态', '技师和房间占用状态', 120),
('service_item_status', '服务项目状态', '服务项目上下架状态', 130),
('member_account_status', '会员账户状态', '会员账户和套餐状态', 140),
('review_status', '评价状态', '客户服务评价状态', 150),
('refund_status', '退款状态', '支付退款预留状态', 160),
('report_job_status', '报表任务状态', '运营报表生成任务状态', 170);

INSERT IGNORE INTO dict_item (type_code, item_code, item_label, item_value, sort_order) VALUES
('booking_status', 'PENDING_PAYMENT', '待支付', 'PENDING_PAYMENT', 10),
('booking_status', 'BOOKED', '已预约', 'BOOKED', 20),
('booking_status', 'CHECKED_IN', '已签到', 'CHECKED_IN', 30),
('booking_status', 'WAITING_SERVICE', '待服务', 'WAITING_SERVICE', 40),
('booking_status', 'IN_SERVICE', '服务中', 'IN_SERVICE', 50),
('booking_status', 'PENDING_SETTLEMENT', '待结算', 'PENDING_SETTLEMENT', 60),
('booking_status', 'COMPLETED', '已完成', 'COMPLETED', 70),
('booking_status', 'CANCELLED', '已取消', 'CANCELLED', 80),
('payment_status', 'UNPAID', '待支付', 'UNPAID', 10),
('payment_status', 'DEPOSIT_PAID', '已付订金', 'DEPOSIT_PAID', 20),
('payment_status', 'PAID', '已支付', 'PAID', 30),
('payment_status', 'REFUNDING', '退款中', 'REFUNDING', 40),
('payment_status', 'REFUNDED', '已退款', 'REFUNDED', 50),
('payment_status', 'CLOSED', '已关闭', 'CLOSED', 60),
('therapist_status', 'AVAILABLE', '可预约', 'AVAILABLE', 10),
('therapist_status', 'BUSY', '服务中', 'BUSY', 20),
('therapist_status', 'OFF_DUTY', '休息', 'OFF_DUTY', 30),
('therapist_status', 'ON_LEAVE', '请假', 'ON_LEAVE', 40),
('room_status', 'AVAILABLE', '空闲', 'AVAILABLE', 10),
('room_status', 'BOOKED', '已预约', 'BOOKED', 20),
('room_status', 'IN_USE', '使用中', 'IN_USE', 30),
('room_status', 'CLEANING', '清洁中', 'CLEANING', 40),
('room_status', 'MAINTENANCE', '维护中', 'MAINTENANCE', 50),
('time_slot_status', 'AVAILABLE', '可预约', 'AVAILABLE', 10),
('time_slot_status', 'ALMOST_FULL', '即将约满', 'ALMOST_FULL', 20),
('time_slot_status', 'FULL', '已约满', 'FULL', 30),
('time_slot_status', 'CLOSED', '不可预约', 'CLOSED', 40),
('business_status', 'OPEN', '营业中', 'OPEN', 10),
('business_status', 'CLOSED', '休息中', 'CLOSED', 20),
('business_status', 'SUSPENDED', '暂停预约', 'SUSPENDED', 30),
('coupon_status', 'DRAFT', '草稿', 'DRAFT', 10),
('coupon_status', 'ACTIVE', '投放中', 'ACTIVE', 20),
('coupon_status', 'ENDED', '已结束', 'ENDED', 30),
('coupon_status', 'UNUSED', '未使用', 'UNUSED', 40),
('coupon_status', 'USED', '已使用', 'USED', 50),
('coupon_status', 'EXPIRED', '已过期', 'EXPIRED', 60),
('member_scope', 'ALL_STORES', '全门店通用', 'ALL_STORES', 10),
('sys_user_status', 'ENABLED', '启用', 'ENABLED', 10),
('sys_user_status', 'DISABLED', '禁用', 'DISABLED', 20),
('schedule_status', 'WORK', '上班', 'WORK', 10),
('schedule_status', 'REST', '休息', 'REST', 20),
('schedule_status', 'LEAVE', '请假', 'LEAVE', 30),
('checkin_status', 'WAITING', '待签到', 'WAITING', 10),
('checkin_status', 'CHECKED_IN', '已签到', 'CHECKED_IN', 20),
('checkin_status', 'EXPIRED', '已过期', 'EXPIRED', 30),
('resource_occupation_status', 'HELD', '已锁定', 'HELD', 10),
('resource_occupation_status', 'OCCUPIED', '占用中', 'OCCUPIED', 20),
('resource_occupation_status', 'RELEASED', '已释放', 'RELEASED', 30),
('resource_occupation_status', 'CANCELLED', '已取消', 'CANCELLED', 40),
('service_item_status', 'ON_SHELF', '上架', 'ON_SHELF', 10),
('service_item_status', 'OFF_SHELF', '下架', 'OFF_SHELF', 20),
('member_account_status', 'ACTIVE', '正常', 'ACTIVE', 10),
('member_account_status', 'FROZEN', '冻结', 'FROZEN', 20),
('member_account_status', 'EXPIRED', '已过期', 'EXPIRED', 30),
('member_account_status', 'USED_UP', '已用完', 'USED_UP', 40),
('review_status', 'PUBLISHED', '已发布', 'PUBLISHED', 10),
('review_status', 'HIDDEN', '已隐藏', 'HIDDEN', 20),
('refund_status', 'REFUNDING', '退款中', 'REFUNDING', 10),
('refund_status', 'REFUNDED', '已退款', 'REFUNDED', 20),
('refund_status', 'FAILED', '退款失败', 'FAILED', 30),
('refund_status', 'CLOSED', '已关闭', 'CLOSED', 40),
('report_job_status', 'SUCCESS', '成功', 'SUCCESS', 10),
('report_job_status', 'FAILED', '失败', 'FAILED', 20);


-- Organization and stores
INSERT IGNORE INTO region (parent_id, region_code, region_name, sort_order, status) VALUES
(0, 'HQ', '栖愈总部', 10, 'ENABLED'),
((SELECT id FROM region r WHERE r.region_code = 'HQ'), 'EAST_CHINA', '华东区域', 20, 'ENABLED'),
((SELECT id FROM region r WHERE r.region_code = 'EAST_CHINA'), 'SHANGHAI', '上海区域', 30, 'ENABLED');

INSERT IGNORE INTO store (region_id, store_code, store_name, cover_url, phone, province, city, district, address, longitude, latitude, business_hours, open_time, close_time, business_status, rating, sort_order, enabled, created_by) VALUES
((SELECT id FROM region WHERE region_code = 'SHANGHAI'), 'JINGAN', '静安寺店', 'http://192.168.31.100:9000/qiyu-local/stores/jingan/cover.webp', '021-62580001', '上海市', '上海市', '静安区', '南京西路静安寺商圈 888 号', 121.4453000, 31.2237000, '10:00-22:00', '10:00:00', '22:00:00', 'OPEN', 4.9, 10, 1, 'flyway'),
((SELECT id FROM region WHERE region_code = 'SHANGHAI'), 'XUJIAHUI', '徐家汇店', 'http://192.168.31.100:9000/qiyu-local/stores/xujiahui/cover.webp', '021-64270002', '上海市', '上海市', '徐汇区', '虹桥路徐家汇商圈 188 号', 121.4365000, 31.1885000, '10:00-22:00', '10:00:00', '22:00:00', 'OPEN', 4.8, 20, 1, 'flyway'),
((SELECT id FROM region WHERE region_code = 'SHANGHAI'), 'LUJIAZUI', '陆家嘴店', 'http://192.168.31.100:9000/qiyu-local/stores/lujiazui/cover.webp', '021-58760003', '上海市', '上海市', '浦东新区', '世纪大道陆家嘴商圈 168 号', 121.5055000, 31.2397000, '10:00-22:00', '10:00:00', '22:00:00', 'OPEN', 4.8, 30, 1, 'flyway');

-- Departments
INSERT IGNORE INTO sys_dept (parent_id, dept_code, dept_name, sort_order, status) VALUES
(0, 'HQ', '栖愈总部', 10, 'ENABLED'),
((SELECT id FROM sys_dept d WHERE d.dept_code = 'HQ'), 'HQ_OPERATION', '总部运营部', 20, 'ENABLED'),
((SELECT id FROM sys_dept d WHERE d.dept_code = 'HQ'), 'EAST_CHINA_OPERATION', '华东区域运营部', 30, 'ENABLED'),
((SELECT id FROM sys_dept d WHERE d.dept_code = 'HQ'), 'STORE_JINGAN', '静安寺店', 40, 'ENABLED'),
((SELECT id FROM sys_dept d WHERE d.dept_code = 'HQ'), 'STORE_XUJIAHUI', '徐家汇店', 50, 'ENABLED'),
((SELECT id FROM sys_dept d WHERE d.dept_code = 'HQ'), 'STORE_LUJIAZUI', '陆家嘴店', 60, 'ENABLED');

-- Roles
INSERT IGNORE INTO sys_role (role_code, role_name, description, status, created_by) VALUES
('HQ_ADMIN', '超级管理员', '系统、组织与全部门店管理', 'ENABLED', 'flyway'),
('HQ_OPERATOR', '总部运营', '全部门店经营与运营数据', 'ENABLED', 'flyway'),
('REGION_MANAGER', '区域经理', '管理授权区域及下属门店', 'ENABLED', 'flyway'),
('STORE_MANAGER', '店长', '管理本门店全部业务', 'ENABLED', 'flyway'),
('RECEPTIONIST', '前台', '本门店预约、签到和结算', 'ENABLED', 'flyway'),
('THERAPIST', '技师', '查看本人预约并更新服务状态', 'ENABLED', 'flyway'),
('CUSTOMER', '客户端会员', '小程序客户身份', 'ENABLED', 'flyway');

-- Permissions
INSERT IGNORE INTO sys_permission (permission_code, permission_name, resource_code, action_code, resource_path, status, created_by) VALUES
('dashboard:read', '查看运营看板', 'dashboard', 'READ', '/api/v1/admin/dashboard', 'ENABLED', 'flyway'),
('store:read', '查看门店', 'store', 'READ', '/api/v1/admin/stores', 'ENABLED', 'flyway'),
('store:create', '创建门店', 'store', 'CREATE', '/api/v1/admin/stores', 'ENABLED', 'flyway'),
('store:update', '编辑门店', 'store', 'UPDATE', '/api/v1/admin/stores/*', 'ENABLED', 'flyway'),
('store:delete', '删除门店', 'store', 'DELETE', '/api/v1/admin/stores/*', 'ENABLED', 'flyway'),
('booking:read', '查看预约', 'booking', 'READ', '/api/v1/admin/bookings', 'ENABLED', 'flyway'),
('booking:create', '创建预约', 'booking', 'CREATE', '/api/v1/bookings', 'ENABLED', 'flyway'),
('booking:update', '修改预约', 'booking', 'UPDATE', '/api/v1/bookings/*', 'ENABLED', 'flyway'),
('booking:cancel', '取消预约', 'booking', 'CANCEL', '/api/v1/bookings/*/cancel', 'ENABLED', 'flyway'),
('booking:checkin', '预约签到', 'booking', 'CHECKIN', '/api/v1/bookings/*/checkin', 'ENABLED', 'flyway'),
('booking:change_amount', '修改预约金额', 'booking', 'CHANGE_AMOUNT', '/api/v1/admin/bookings/*/amount', 'ENABLED', 'flyway'),
('booking:export', '导出预约', 'booking', 'EXPORT', '/api/v1/admin/bookings/export', 'ENABLED', 'flyway'),
('service_order:read', '查看服务订单', 'service_order', 'READ', '/api/v1/admin/service-orders', 'ENABLED', 'flyway'),
('service_order:update', '更新服务订单', 'service_order', 'UPDATE', '/api/v1/admin/service-orders/*', 'ENABLED', 'flyway'),
('schedule:read', '查看排班', 'schedule', 'READ', '/api/v1/admin/schedules', 'ENABLED', 'flyway'),
('schedule:manage', '管理排班', 'schedule', 'MANAGE', '/api/v1/admin/schedules/*', 'ENABLED', 'flyway'),
('therapist:read', '查看技师', 'therapist', 'READ', '/api/v1/admin/therapists', 'ENABLED', 'flyway'),
('therapist:manage', '管理技师', 'therapist', 'MANAGE', '/api/v1/admin/therapists/*', 'ENABLED', 'flyway'),
('service:read', '查看服务项目', 'service', 'READ', '/api/v1/admin/services', 'ENABLED', 'flyway'),
('service:manage', '管理服务项目', 'service', 'MANAGE', '/api/v1/admin/services/*', 'ENABLED', 'flyway'),
('room:read', '查看房间', 'room', 'READ', '/api/v1/admin/rooms', 'ENABLED', 'flyway'),
('room:manage', '管理房间', 'room', 'MANAGE', '/api/v1/admin/rooms/*', 'ENABLED', 'flyway'),
('customer:read', '查看客户', 'customer', 'READ', '/api/v1/admin/customers', 'ENABLED', 'flyway'),
('customer:reveal_phone', '查看完整手机号', 'customer', 'REVEAL_PHONE', '/api/v1/admin/customers/*/phone', 'ENABLED', 'flyway'),
('member:read', '查看会员', 'member', 'READ', '/api/v1/admin/members', 'ENABLED', 'flyway'),
('member:manage', '管理会员', 'member', 'MANAGE', '/api/v1/admin/members/*', 'ENABLED', 'flyway'),
('coupon:read', '查看优惠券', 'coupon', 'READ', '/api/v1/admin/coupons', 'ENABLED', 'flyway'),
('coupon:manage', '管理优惠券', 'coupon', 'MANAGE', '/api/v1/admin/coupons/*', 'ENABLED', 'flyway'),
('report:read', '查看经营报表', 'report', 'READ', '/api/v1/admin/reports', 'ENABLED', 'flyway'),
('report:export', '导出经营报表', 'report', 'EXPORT', '/api/v1/admin/reports/export', 'ENABLED', 'flyway'),
('system:user:manage', '管理系统用户', 'system_user', 'MANAGE', '/api/v1/admin/system/users', 'ENABLED', 'flyway'),
('system:role:manage', '管理角色权限', 'system_role', 'MANAGE', '/api/v1/admin/system/roles', 'ENABLED', 'flyway'),
('system:menu:manage', '管理系统菜单', 'system_menu', 'MANAGE', '/api/v1/admin/system/menus', 'ENABLED', 'flyway'),
('system:dict:manage', '管理数据字典', 'system_dict', 'MANAGE', '/api/v1/admin/system/dictionaries', 'ENABLED', 'flyway'),
('system:org:manage', '管理组织部门', 'system_org', 'MANAGE', '/api/v1/admin/system/organizations', 'ENABLED', 'flyway'),
('audit:read', '查看审计日志', 'audit', 'READ', '/api/v1/admin/system/audit-logs', 'ENABLED', 'flyway'),
('media:manage', '管理媒体资源', 'media', 'MANAGE', '/api/v1/admin/media', 'ENABLED', 'flyway');

-- Menus
INSERT IGNORE INTO sys_menu (parent_id, menu_code, menu_name, menu_type, route_path, permission_code, sort_order, status, created_by) VALUES
(0, 'DASHBOARD', '运营看板', 'MENU', '/dashboard', 'dashboard:read', 10, 'ENABLED', 'flyway'),
(0, 'STORE_OPERATION', '门店运营', 'DIRECTORY', NULL, NULL, 20, 'ENABLED', 'flyway'),
(0, 'CUSTOMER_OPERATION', '客户运营', 'DIRECTORY', NULL, NULL, 30, 'ENABLED', 'flyway'),
(0, 'REPORT_CENTER', '报表中心', 'DIRECTORY', NULL, NULL, 40, 'ENABLED', 'flyway'),
(0, 'SYSTEM_MANAGEMENT', '系统管理', 'DIRECTORY', NULL, NULL, 50, 'ENABLED', 'flyway');

SET @store_operation_menu_id = (SELECT id FROM sys_menu WHERE menu_code = 'STORE_OPERATION' LIMIT 1);
SET @customer_operation_menu_id = (SELECT id FROM sys_menu WHERE menu_code = 'CUSTOMER_OPERATION' LIMIT 1);
SET @report_center_menu_id = (SELECT id FROM sys_menu WHERE menu_code = 'REPORT_CENTER' LIMIT 1);
SET @system_management_menu_id = (SELECT id FROM sys_menu WHERE menu_code = 'SYSTEM_MANAGEMENT' LIMIT 1);

INSERT IGNORE INTO sys_menu (parent_id, menu_code, menu_name, menu_type, route_path, permission_code, sort_order, status, created_by) VALUES
(@store_operation_menu_id, 'STORE', '门店管理', 'MENU', '/stores', 'store:read', 10, 'ENABLED', 'flyway'),
(@store_operation_menu_id, 'BOOKING', '预约管理', 'MENU', '/appointments', 'booking:read', 20, 'ENABLED', 'flyway'),
(@store_operation_menu_id, 'CHECKIN', '到店核销', 'MENU', '/checkin', 'booking:checkin', 30, 'ENABLED', 'flyway'),
(@store_operation_menu_id, 'SERVICE_ORDER', '服务订单', 'MENU', '/service-orders', 'service_order:read', 40, 'ENABLED', 'flyway'),
(@store_operation_menu_id, 'SCHEDULE', '排班管理', 'MENU', '/schedule', 'schedule:read', 50, 'ENABLED', 'flyway'),
(@store_operation_menu_id, 'THERAPIST', '技师管理', 'MENU', '/therapists', 'therapist:read', 60, 'ENABLED', 'flyway'),
(@store_operation_menu_id, 'SERVICE', '服务项目', 'MENU', '/services', 'service:read', 70, 'ENABLED', 'flyway'),
(@store_operation_menu_id, 'ROOM', '房间管理', 'MENU', '/rooms', 'room:read', 80, 'ENABLED', 'flyway'),
(@customer_operation_menu_id, 'CUSTOMER', '客户管理', 'MENU', '/customers', 'customer:read', 10, 'ENABLED', 'flyway'),
(@customer_operation_menu_id, 'MEMBER', '会员管理', 'MENU', '/members', 'member:read', 20, 'ENABLED', 'flyway'),
(@customer_operation_menu_id, 'COUPON', '优惠券', 'MENU', '/coupons', 'coupon:read', 30, 'ENABLED', 'flyway'),
(@report_center_menu_id, 'REPORT', '经营报表', 'MENU', '/reports', 'report:read', 10, 'ENABLED', 'flyway'),
(@system_management_menu_id, 'SYSTEM_ORG', '组织部门', 'MENU', '/system/organizations', 'system:org:manage', 10, 'ENABLED', 'flyway'),
(@system_management_menu_id, 'SYSTEM_USER', '系统用户', 'MENU', '/system/users', 'system:user:manage', 20, 'ENABLED', 'flyway'),
(@system_management_menu_id, 'SYSTEM_ROLE', '角色权限', 'MENU', '/system/roles', 'system:role:manage', 30, 'ENABLED', 'flyway'),
(@system_management_menu_id, 'SYSTEM_MENU', '菜单管理', 'MENU', '/system/menus', 'system:menu:manage', 40, 'ENABLED', 'flyway'),
(@system_management_menu_id, 'SYSTEM_DICT', '数据字典', 'MENU', '/system/dictionaries', 'system:dict:manage', 50, 'ENABLED', 'flyway'),
(@system_management_menu_id, 'AUDIT_LOG', '审计日志', 'MENU', '/system/audit-logs', 'audit:read', 60, 'ENABLED', 'flyway');

-- Users and identities. NULL password hashes use the local development credential adapter.
INSERT INTO sys_user (user_type, display_name, status, created_by)
SELECT 'STAFF', '超级管理员', 'ENABLED', 'flyway'
WHERE NOT EXISTS (SELECT 1 FROM sys_user_identity WHERE identity_type = 'PASSWORD' AND identifier = 'admin');
SET @admin_user_id = COALESCE(
  (SELECT user_id FROM sys_user_identity WHERE identity_type = 'PASSWORD' AND identifier = 'admin' LIMIT 1),
  LAST_INSERT_ID()
);
INSERT IGNORE INTO sys_user_identity (user_id, identity_type, identifier, credential_hash, verified, status, created_by)
VALUES (@admin_user_id, 'PASSWORD', 'admin', NULL, 1, 'ENABLED', 'flyway');

INSERT INTO sys_user (user_type, display_name, status, created_by)
SELECT 'STAFF', '静安寺店店长', 'ENABLED', 'flyway'
WHERE NOT EXISTS (SELECT 1 FROM sys_user_identity WHERE identity_type = 'PASSWORD' AND identifier = 'manager');
SET @manager_user_id = COALESCE(
  (SELECT user_id FROM sys_user_identity WHERE identity_type = 'PASSWORD' AND identifier = 'manager' LIMIT 1),
  LAST_INSERT_ID()
);
INSERT IGNORE INTO sys_user_identity (user_id, identity_type, identifier, credential_hash, verified, status, created_by)
VALUES (@manager_user_id, 'PASSWORD', 'manager', NULL, 1, 'ENABLED', 'flyway');

INSERT INTO sys_user (user_type, display_name, status, created_by)
SELECT 'STAFF', '沈安然', 'ENABLED', 'flyway'
WHERE NOT EXISTS (SELECT 1 FROM sys_user_identity WHERE identity_type = 'PASSWORD' AND identifier = 'employee');
SET @employee_user_id = COALESCE(
  (SELECT user_id FROM sys_user_identity WHERE identity_type = 'PASSWORD' AND identifier = 'employee' LIMIT 1),
  LAST_INSERT_ID()
);
INSERT IGNORE INTO sys_user_identity (user_id, identity_type, identifier, credential_hash, verified, status, created_by)
VALUES (@employee_user_id, 'PASSWORD', 'employee', NULL, 1, 'ENABLED', 'flyway');

INSERT INTO sys_user (user_type, display_name, status, created_by)
SELECT 'CUSTOMER', '栖愈会员', 'ENABLED', 'flyway'
WHERE NOT EXISTS (SELECT 1 FROM sys_user_identity WHERE identity_type = 'MOBILE' AND identifier = '13800001288');
SET @customer_user_id = COALESCE(
  (SELECT user_id FROM sys_user_identity WHERE identity_type = 'MOBILE' AND identifier = '13800001288' LIMIT 1),
  LAST_INSERT_ID()
);
INSERT IGNORE INTO sys_user_identity (user_id, identity_type, identifier, credential_hash, verified, status, created_by)
VALUES (@customer_user_id, 'MOBILE', '13800001288', NULL, 1, 'ENABLED', 'flyway');

INSERT IGNORE INTO staff (user_id, employee_no, primary_store_id, position_name, mobile, status, created_by) VALUES
(@admin_user_id, 'HQ0001', NULL, '超级管理员', '13800000001', 'ENABLED', 'flyway'),
(@manager_user_id, 'JA0001', (SELECT id FROM store WHERE store_code = 'JINGAN'), '店长', '13800000002', 'ENABLED', 'flyway'),
(@employee_user_id, 'JA0101', (SELECT id FROM store WHERE store_code = 'JINGAN'), '技师', '13800000003', 'ENABLED', 'flyway');

INSERT IGNORE INTO customer (user_id, mobile, nickname, member_level, status, created_by) VALUES
(@customer_user_id, '13800001288', '栖愈会员', 'GOLD', 'ENABLED', 'flyway');

INSERT IGNORE INTO sys_user_dept (user_id, dept_id, is_primary) VALUES
(@admin_user_id, (SELECT id FROM sys_dept WHERE dept_code = 'HQ_OPERATION'), 1),
(@manager_user_id, (SELECT id FROM sys_dept WHERE dept_code = 'STORE_JINGAN'), 1),
(@employee_user_id, (SELECT id FROM sys_dept WHERE dept_code = 'STORE_JINGAN'), 1);

INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES
(@admin_user_id, (SELECT id FROM sys_role WHERE role_code = 'HQ_ADMIN')),
(@manager_user_id, (SELECT id FROM sys_role WHERE role_code = 'STORE_MANAGER')),
(@employee_user_id, (SELECT id FROM sys_role WHERE role_code = 'THERAPIST')),
(@customer_user_id, (SELECT id FROM sys_role WHERE role_code = 'CUSTOMER'));

INSERT IGNORE INTO sys_role_permission (role_id, permission_id, effect)
SELECT r.id, p.id, 'ALLOW' FROM sys_role r CROSS JOIN sys_permission p WHERE r.role_code = 'HQ_ADMIN';

INSERT IGNORE INTO sys_role_permission (role_id, permission_id, effect)
SELECT r.id, p.id, 'ALLOW'
FROM sys_role r CROSS JOIN sys_permission p
WHERE r.role_code = 'STORE_MANAGER'
  AND p.permission_code IN (
    'dashboard:read', 'store:read', 'booking:read', 'booking:create', 'booking:update',
    'booking:cancel', 'booking:checkin', 'service_order:read', 'service_order:update',
    'schedule:read', 'schedule:manage', 'therapist:read', 'therapist:manage',
    'service:read', 'room:read', 'room:manage', 'customer:read', 'customer:reveal_phone',
    'member:read', 'coupon:read', 'report:read'
  );

INSERT IGNORE INTO sys_role_permission (role_id, permission_id, effect)
SELECT r.id, p.id, 'ALLOW'
FROM sys_role r CROSS JOIN sys_permission p
WHERE r.role_code = 'THERAPIST'
  AND p.permission_code IN ('booking:read', 'booking:update', 'schedule:read', 'customer:read');

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id FROM sys_role r CROSS JOIN sys_menu m WHERE r.role_code = 'HQ_ADMIN';

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM sys_role r CROSS JOIN sys_menu m
WHERE r.role_code = 'STORE_MANAGER'
  AND (m.permission_code IS NULL OR m.permission_code IN (
    'dashboard:read', 'store:read', 'booking:read', 'booking:checkin',
    'service_order:read', 'schedule:read', 'therapist:read', 'service:read',
    'room:read', 'customer:read', 'member:read', 'coupon:read', 'report:read'
  ));

INSERT IGNORE INTO sys_role_data_scope (role_id, resource_code, action_code, scope_type)
SELECT r.id, resources.resource_code, '*', 'ALL_STORES'
FROM sys_role r
JOIN (
  SELECT 'store' resource_code UNION ALL SELECT 'booking' UNION ALL SELECT 'service_order'
  UNION ALL SELECT 'schedule' UNION ALL SELECT 'therapist' UNION ALL SELECT 'room'
  UNION ALL SELECT 'customer' UNION ALL SELECT 'member' UNION ALL SELECT 'coupon'
  UNION ALL SELECT 'report'
) resources
WHERE r.role_code = 'HQ_ADMIN';

INSERT IGNORE INTO sys_role_data_scope (role_id, resource_code, action_code, scope_type)
SELECT r.id, resources.resource_code, '*', 'PRIMARY_STORE'
FROM sys_role r
JOIN (
  SELECT 'store' resource_code UNION ALL SELECT 'booking' UNION ALL SELECT 'service_order'
  UNION ALL SELECT 'schedule' UNION ALL SELECT 'therapist' UNION ALL SELECT 'room'
  UNION ALL SELECT 'customer' UNION ALL SELECT 'member' UNION ALL SELECT 'coupon'
  UNION ALL SELECT 'report'
) resources
WHERE r.role_code = 'STORE_MANAGER';

INSERT IGNORE INTO sys_role_data_scope (role_id, resource_code, action_code, scope_type)
SELECT r.id, resources.resource_code, '*', 'SELF'
FROM sys_role r
JOIN (SELECT 'booking' resource_code UNION ALL SELECT 'schedule' UNION ALL SELECT 'customer') resources
WHERE r.role_code = 'THERAPIST';

-- Service catalog and resources
INSERT IGNORE INTO service_category (category_code, category_name, sort_order, enabled, created_by) VALUES
('MASSAGE', '中式推拿', 10, 1, 'flyway'),
('SPA', '精油 SPA', 20, 1, 'flyway'),
('RELAX', '舒缓调理', 30, 1, 'flyway');

INSERT IGNORE INTO service_item (service_code, category_id, service_name, cover_url, duration_minutes, preparation_minutes, cleanup_minutes, price_amount, member_price_amount, description, service_steps, suitable_people, notices, sales_count, status, sort_order, created_by) VALUES
('NECK_60', (SELECT id FROM service_category WHERE category_code = 'RELAX'), '肩颈舒缓', 'http://192.168.31.100:9000/qiyu-local/services/neck-60/cover.webp', 60, 10, 10, 198.00, 168.00, '针对久坐与肩颈疲劳的舒缓服务。', '评估沟通、肩颈放松、重点调理、舒缓收尾', '久坐办公、肩颈紧张、睡眠压力人群', '孕期、急性损伤或严重基础疾病请提前咨询。', 1268, 'ON_SHELF', 10, 'flyway'),
('TUINA_90', (SELECT id FROM service_category WHERE category_code = 'MASSAGE'), '中式推拿', 'http://192.168.31.100:9000/qiyu-local/services/tuina-90/cover.webp', 90, 10, 15, 298.00, 258.00, '全身经络与肌肉放松的综合调理。', '体态评估、经络放松、重点推拿、拉伸收尾', '运动疲劳、久坐僵硬、日常保养人群', '饭后一小时内不建议接受服务。', 980, 'ON_SHELF', 20, 'flyway'),
('AROMA_90', (SELECT id FROM service_category WHERE category_code = 'SPA'), '精油 SPA', 'http://192.168.31.100:9000/qiyu-local/services/aroma-90/cover.webp', 90, 15, 15, 398.00, 338.00, '以植物精油和舒缓手法帮助放松身心。', '香型选择、背部舒缓、全身护理、静息收尾', '高压、睡眠欠佳、需要深度放松人群', '皮肤过敏请提前说明。', 756, 'ON_SHELF', 30, 'flyway');

INSERT IGNORE INTO room (store_id, room_code, room_name, room_kind, capacity, status, sort_order, enabled, created_by)
SELECT s.id, room_seed.room_code, room_seed.room_name, room_seed.room_kind, room_seed.capacity, 'AVAILABLE', room_seed.sort_order, 1, 'flyway'
FROM store s
JOIN (
  SELECT 'R01' room_code, '静心房 01' room_name, 'SINGLE' room_kind, 1 capacity, 10 sort_order
  UNION ALL SELECT 'R02', '静心房 02', 'SINGLE', 1, 20
  UNION ALL SELECT 'R03', '调和房 01', 'DOUBLE', 2, 30
) room_seed
WHERE s.store_code IN ('JINGAN', 'XUJIAHUI', 'LUJIAZUI');

SET @employee_staff_id = (SELECT id FROM staff WHERE employee_no = 'JA0101');
INSERT IGNORE INTO therapist (staff_id, therapist_code, store_id, therapist_name, avatar_url, portrait_url, level_name, experience_years, rating, service_count, specify_fee_amount, status, introduction, sort_order, enabled, created_by) VALUES
(@employee_staff_id, 'TH_JA_ANRAN', (SELECT id FROM store WHERE store_code = 'JINGAN'), '沈安然', 'http://192.168.31.100:9000/qiyu-local/therapists/shen-anran/avatar.webp', 'http://192.168.31.100:9000/qiyu-local/therapists/shen-anran/portrait.webp', '高级理疗师', 8, 4.9, 1280, 30.00, 'AVAILABLE', '擅长肩颈调理与中式推拿。', 10, 1, 'flyway');

INSERT IGNORE INTO member_account (customer_id, account_scope, balance_amount, total_recharge_amount, total_consume_amount, status)
VALUES ((SELECT id FROM customer WHERE mobile = '13800001288'), 'ALL_STORES', 680.00, 2000.00, 1320.00, 'ACTIVE');

INSERT IGNORE INTO coupon_template (coupon_code, coupon_name, coupon_scope, discount_type, discount_amount, threshold_amount, valid_start_at, valid_end_at, issued_count, used_count, status, created_by) VALUES
('NEW_MEMBER_30', '新会员满减券', 'ALL_STORES', 'FIXED', 30.00, 198.00, '2026-01-01 00:00:00', '2027-12-31 23:59:59', 1000, 128, 'ACTIVE', 'flyway');
