-- Client users authenticate through the same principal model and receive only self-owned booking access.
INSERT IGNORE INTO sys_role_permission(role_id,permission_id,effect)
SELECT r.id,p.id,'ALLOW' FROM sys_role r CROSS JOIN sys_permission p
WHERE r.role_code='CUSTOMER'
  AND p.permission_code IN ('booking:read','booking:create','booking:update','booking:cancel','booking:checkin');

INSERT IGNORE INTO sys_role_data_scope(role_id,resource_code,action_code,scope_type)
SELECT id,'booking','*','SELF' FROM sys_role WHERE role_code='CUSTOMER';
