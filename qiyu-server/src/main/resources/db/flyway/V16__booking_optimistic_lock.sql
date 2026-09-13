-- Optimistic locking: every update to a booking must carry the version it was loaded with,
-- so concurrent modifications to the same booking fail instead of silently overwriting.
ALTER TABLE booking
  ADD COLUMN version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号' AFTER paid_amount;
