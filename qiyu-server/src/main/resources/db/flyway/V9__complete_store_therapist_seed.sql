-- Complete the cross-store catalog referenced by booking fixtures and client store filters.
INSERT IGNORE INTO therapist (
  staff_id, therapist_code, store_id, therapist_name, avatar_url, portrait_url,
  level_name, experience_years, rating, service_count, specify_fee_amount,
  status, introduction, sort_order, enabled, created_by
) VALUES
(NULL, 'TH_XH_YUANYUAN', (SELECT id FROM store WHERE store_code='XUJIAHUI'), '媛媛', NULL, NULL,
 '高级理疗师', 9, 4.9, 1560, 30.00, 'AVAILABLE', '擅长中式推拿与精油 SPA。', 20, 1, 'flyway'),
(NULL, 'TH_LJZ_LIN', (SELECT id FROM store WHERE store_code='LUJIAZUI'), '林老师', NULL, NULL,
 '资深理疗师', 7, 4.8, 980, 20.00, 'AVAILABLE', '擅长肩颈舒缓与经络调理。', 30, 1, 'flyway');

INSERT INTO therapist_skill (therapist_id, skill_name, sort_order)
SELECT t.id, skill.skill_name, skill.sort_order
FROM therapist t
CROSS JOIN (
  SELECT '肩颈舒缓' AS skill_name, 10 AS sort_order
  UNION ALL SELECT '中式推拿', 20
) skill
WHERE t.therapist_code='TH_JA_ANRAN'
  AND NOT EXISTS (SELECT 1 FROM therapist_skill existing
    WHERE existing.therapist_id=t.id AND existing.skill_name=skill.skill_name AND existing.deleted=0);

INSERT INTO therapist_skill (therapist_id, skill_name, sort_order)
SELECT t.id, skill.skill_name, skill.sort_order
FROM therapist t
CROSS JOIN (
  SELECT '中式推拿' AS skill_name, 10 AS sort_order
  UNION ALL SELECT '精油 SPA', 20
) skill
WHERE t.therapist_code='TH_XH_YUANYUAN'
  AND NOT EXISTS (SELECT 1 FROM therapist_skill existing
    WHERE existing.therapist_id=t.id AND existing.skill_name=skill.skill_name AND existing.deleted=0);

INSERT INTO therapist_skill (therapist_id, skill_name, sort_order)
SELECT t.id, skill.skill_name, skill.sort_order
FROM therapist t
CROSS JOIN (
  SELECT '肩颈舒缓' AS skill_name, 10 AS sort_order
  UNION ALL SELECT '中式推拿', 20
) skill
WHERE t.therapist_code='TH_LJZ_LIN'
  AND NOT EXISTS (SELECT 1 FROM therapist_skill existing
    WHERE existing.therapist_id=t.id AND existing.skill_name=skill.skill_name AND existing.deleted=0);

UPDATE booking
SET therapist_id=(SELECT id FROM therapist WHERE therapist_code='TH_XH_YUANYUAN')
WHERE booking_no='BK-202608-1999' AND therapist_id IS NULL;
