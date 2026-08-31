-- Remove the historical Mock-oriented property name from the persisted client contract.
UPDATE client_catalog_config
SET config_json = JSON_REMOVE(
        JSON_SET(
          config_json,
          '$.genericUnavailable',
          COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(config_json, '$.genericUnavailable')),
            JSON_UNQUOTE(JSON_EXTRACT(config_json, '$.genericMockAction')),
            '该入口暂不可用'
          )
        ),
        '$.genericMockAction'
    ),
    updated_by = 'flyway'
WHERE config_code = 'actionFeedbackDictionaries'
  AND deleted = 0;
