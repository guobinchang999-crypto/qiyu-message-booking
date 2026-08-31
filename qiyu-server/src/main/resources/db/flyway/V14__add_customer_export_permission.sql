-- Add the customer export permission and grant it to the operator roles that manage customers.
INSERT IGNORE INTO sys_permission(permission_code, permission_name, resource_code, action_code, resource_path, status, created_by)
VALUES ('customer:export', '导出客户', 'customer', 'EXPORT', '/admin/export/customers', 'ENABLED', 'flyway');

INSERT IGNORE INTO sys_role_permission(role_id, permission_id, effect)
SELECT r.id, p.id, 'ALLOW' FROM sys_role r CROSS JOIN sys_permission p
WHERE r.role_code IN ('HQ_ADMIN', 'STORE_MANAGER', 'REGION_MANAGER')
  AND p.permission_code = 'customer:export';
