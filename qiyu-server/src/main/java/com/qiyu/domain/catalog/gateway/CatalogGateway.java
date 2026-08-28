package com.qiyu.domain.catalog.gateway;

import java.util.List;
import java.util.Map;

/**
 * Outbound catalog port shared by booking and read-only resource use cases.
 * API-facing stable IDs are part of this contract; persistence IDs stay inside infrastructure.
 */
public interface CatalogGateway {
    List<Map<String, Object>> stores();

    List<Map<String, Object>> services();

    List<Map<String, Object>> therapists();

    List<Map<String, Object>> rooms();

    Map<String, Object> findStore(String id);

    Map<String, Object> findService(String id);

    Map<String, Object> findTherapist(String id);

    Map<String, Object> findRoom(String id);

    List<Map<String, Object>> therapists(String storeId, String serviceId);

    List<Map<String, Object>> rooms(String storeId, String status);
}
