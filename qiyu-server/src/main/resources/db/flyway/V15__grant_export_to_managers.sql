-- Grant the booking and report export rights to store and region managers so they can
-- export only their own data range; HQ_ADMIN already holds both from the base seed.
INSERT IGNORE INTO sys_role_permission(role_id, permission_id, effect)
SELECT r.id, p.id, 'ALLOW' FROM sys_role r CROSS JOIN sys_permission p
WHERE r.role_code IN ('STORE_MANAGER', 'REGION_MANAGER')
  AND p.permission_code IN ('booking:export', 'report:export');
