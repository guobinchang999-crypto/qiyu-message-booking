-- Optimistic concurrency for organization structure and profile changes.
ALTER TABLE sys_dept ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
