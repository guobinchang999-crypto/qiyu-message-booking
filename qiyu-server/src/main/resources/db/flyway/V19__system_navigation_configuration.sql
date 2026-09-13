ALTER TABLE sys_menu ADD COLUMN visible TINYINT NOT NULL DEFAULT 1;
ALTER TABLE sys_menu ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

INSERT IGNORE INTO sys_menu(parent_id,menu_code,menu_name,menu_type,sort_order,status,created_by) VALUES
(0,'QIYU_RECEPTION','门店接待','DIRECTORY',10,'ENABLED','flyway'),
(0,'QIYU_RESOURCES','门店资源','DIRECTORY',20,'ENABLED','flyway'),
(0,'QIYU_CUSTOMERS','客户与会员','DIRECTORY',30,'ENABLED','flyway'),
(0,'QIYU_ANALYTICS','经营分析','DIRECTORY',40,'ENABLED','flyway');
SET @reception=(SELECT id FROM sys_menu WHERE menu_code='QIYU_RECEPTION');
SET @resources=(SELECT id FROM sys_menu WHERE menu_code='QIYU_RESOURCES');
SET @customers=(SELECT id FROM sys_menu WHERE menu_code='QIYU_CUSTOMERS');
SET @analytics=(SELECT id FROM sys_menu WHERE menu_code='QIYU_ANALYTICS');
SET @system=(SELECT id FROM sys_menu WHERE menu_code='SYSTEM_MANAGEMENT');
INSERT IGNORE INTO sys_menu(parent_id,menu_code,menu_name,menu_type,sort_order,status,created_by)
VALUES(@system,'QIYU_ADVANCED','高级配置','DIRECTORY',70,'ENABLED','flyway');
SET @advanced=(SELECT id FROM sys_menu WHERE menu_code='QIYU_ADVANCED');
INSERT IGNORE INTO sys_menu(parent_id,menu_code,menu_name,menu_type,route_path,permission_code,sort_order,status,created_by)
VALUES(@reception,'QIYU_RECEPTION_PAGE','今日接待','MENU','/reception','booking:read',0,'ENABLED','flyway');

-- Only move seeded entries that still belong to their original seeded parent.
UPDATE sys_menu child JOIN sys_menu parent ON parent.id=child.parent_id
SET child.parent_id=CASE
 WHEN child.menu_code IN ('BOOKING','CHECKIN','SERVICE_ORDER','SCHEDULE') THEN @reception
 WHEN child.menu_code IN ('STORE','THERAPIST','SERVICE','ROOM') THEN @resources
 WHEN child.menu_code IN ('CUSTOMER','COUPON') THEN @customers
 WHEN child.menu_code='REPORT' THEN @analytics
 WHEN child.menu_code IN ('SYSTEM_MENU','SYSTEM_DICT') THEN @advanced
 ELSE child.parent_id END
WHERE (parent.menu_code='STORE_OPERATION' AND child.menu_code IN ('BOOKING','CHECKIN','SERVICE_ORDER','SCHEDULE','STORE','THERAPIST','SERVICE','ROOM'))
 OR (parent.menu_code='CUSTOMER_OPERATION' AND child.menu_code IN ('CUSTOMER','COUPON'))
 OR (parent.menu_code='REPORT_CENTER' AND child.menu_code='REPORT')
 OR (parent.menu_code='SYSTEM_MANAGEMENT' AND child.menu_code IN ('SYSTEM_MENU','SYSTEM_DICT'));
UPDATE sys_menu SET parent_id=@analytics WHERE menu_code='DASHBOARD' AND parent_id=0;
-- Existing custom labels, ordering and disabled settings are intentionally preserved.
