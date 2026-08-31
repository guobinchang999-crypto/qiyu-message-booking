-- Complete the previously empty REGION_MANAGER role so region managers can actually operate.
-- Permissions mirror the store-manager scope plus export rights; the data scope is region-wide.
INSERT IGNORE INTO sys_role_permission(role_id,permission_id,effect)
SELECT r.id,p.id,'ALLOW' FROM sys_role r CROSS JOIN sys_permission p
WHERE r.role_code='REGION_MANAGER'
  AND p.permission_code IN (
    'booking:read','booking:update','booking:cancel','booking:create','booking:checkin','booking:export',
    'customer:read','customer:reveal_phone','dashboard:read','member:read',
    'report:read','report:export','schedule:read','service_order:read','service_order:update',
    'service:read','store:read','therapist:read','room:read','coupon:read'
  );

UPDATE sys_role_data_scope ds JOIN sys_role r ON r.id=ds.role_id
SET ds.scope_type='REGION_STORES' WHERE r.role_code='REGION_MANAGER' AND ds.scope_type='SELF';
