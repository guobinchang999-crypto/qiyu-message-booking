package com.qiyu.infrastructure.mock;

import com.qiyu.domain.catalog.gateway.CatalogGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/** Keeps the existing deterministic catalog available only in explicit Mock mode. */
@Component
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class MockCatalogGateway implements CatalogGateway {
    private final MockCatalogProvider provider;

    public MockCatalogGateway(MockCatalogProvider provider) {
        this.provider = provider;
    }

    @Override public List<Map<String, Object>> stores() { return provider.stores(); }
    @Override public List<Map<String, Object>> services() { return provider.services(); }
    @Override public List<Map<String, Object>> therapists() { return provider.therapists(); }
    @Override public List<Map<String, Object>> rooms() { return provider.rooms(); }
    @Override public Map<String, Object> findStore(String id) { return provider.findStore(id); }
    @Override public Map<String, Object> findService(String id) { return provider.findService(id); }
    @Override public Map<String, Object> findTherapist(String id) { return provider.findTherapist(id); }
    @Override public Map<String, Object> findRoom(String id) { return provider.findRoom(id); }
    @Override public List<Map<String, Object>> therapists(String storeId, String serviceId) { return provider.therapists(storeId, serviceId); }
    @Override public List<Map<String, Object>> rooms(String storeId, String status) { return provider.rooms(storeId, status); }
}
