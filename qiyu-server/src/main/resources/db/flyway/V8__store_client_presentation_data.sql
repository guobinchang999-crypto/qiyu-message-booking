-- Persist store presentation data consumed by the Mini Program instead of fabricating it in the client.
INSERT INTO store_gallery (store_id, image_url, image_title, sort_order)
SELECT id, cover_url, CONCAT(store_name, '门店环境'), 10
FROM store s
WHERE cover_url IS NOT NULL AND cover_url <> '' AND deleted = 0
  AND NOT EXISTS (SELECT 1 FROM store_gallery existing WHERE existing.store_id=s.id AND existing.deleted=0);

INSERT INTO store_facility (store_id, facility_name, sort_order)
SELECT s.id, facility.facility_name, facility.sort_order
FROM store s
CROSS JOIN (
  SELECT '独立理疗房' AS facility_name, 10 AS sort_order
  UNION ALL SELECT '茶歇区', 20
  UNION ALL SELECT '免费 Wi-Fi', 30
) facility
WHERE s.deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM store_facility existing
    WHERE existing.store_id = s.id
      AND existing.facility_name = facility.facility_name
      AND existing.deleted = 0
  );

INSERT IGNORE INTO client_catalog_config (config_code, config_json, enabled, sort_order, created_by)
VALUES ('storeMemberBenefitText', '"会员权益 · 全门店通用"', 1, 140, 'flyway');
