-- Existing databases must not label real payment records as Mock while no provider is configured.
ALTER TABLE payment_order ALTER payment_channel SET DEFAULT 'MANUAL';
ALTER TABLE refund_order ALTER refund_channel SET DEFAULT 'MANUAL';
