-- API routes are intentionally unversioned; permission paths must match the deployed endpoints.
UPDATE sys_permission
SET resource_path = SUBSTRING(resource_path, CHAR_LENGTH('/api/v1') + 1), updated_by = 'flyway'
WHERE resource_path LIKE '/api/v1/%';
