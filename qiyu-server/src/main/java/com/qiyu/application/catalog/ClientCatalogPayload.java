package com.qiyu.application.catalog;

import java.util.Map;

public record ClientCatalogPayload(
        Map<String, Object> homeCopy,
        Map<String, Object> loginCopy,
        Map<String, Object> orderDictionaries,
        Map<String, Object> reviewDictionaries,
        Map<String, Object> serviceDictionaries,
        Map<String, Object> storeDetailDictionaries,
        Map<String, Object> timeDictionaries,
        Map<String, Object> therapistDictionaries,
        Map<String, Object> successCopy,
        Map<String, Object> profile,
        Map<String, Object> checkinDictionaries,
        Map<String, Object> actionFeedbackDictionaries,
        Map<String, Object> pageStateDictionaries
) {
}
