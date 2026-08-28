package com.qiyu.infrastructure.mock;

import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.catalog.Room;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;
import com.qiyu.infrastructure.catalog.MockCatalogMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/** Keeps the existing deterministic catalog available only in explicit Mock mode. */
@Component
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class MockCatalogGateway implements CatalogGateway {
    private final MockCatalogProvider provider;

    public MockCatalogGateway(MockCatalogProvider provider) {
        this.provider = provider;
    }

    @Override public List<Store> stores() { return provider.stores().stream().map(MockCatalogMapper::store).toList(); }
    @Override public List<ServiceItem> services() { return provider.services().stream().map(MockCatalogMapper::service).toList(); }
    @Override public List<Therapist> therapists() { return provider.therapists().stream().map(MockCatalogMapper::therapist).toList(); }
    @Override public List<Room> rooms() { return provider.rooms().stream().map(MockCatalogMapper::room).toList(); }
    @Override public Store findStore(String id) { return stores().stream().filter(value -> id.equals(value.id())).findFirst().orElseThrow(() -> new IllegalArgumentException("门店不存在")); }
    @Override public ServiceItem findService(String id) { return services().stream().filter(value -> id.equals(value.id())).findFirst().orElseThrow(() -> new IllegalArgumentException("服务项目不存在")); }
    @Override public Therapist findTherapist(String id) { return therapists().stream().filter(value -> id.equals(value.id())).findFirst().orElseThrow(() -> new IllegalArgumentException("技师不存在")); }
    @Override public Room findRoom(String id) { return rooms().stream().filter(value -> id.equals(value.id())).findFirst().orElseThrow(() -> new IllegalArgumentException("房间不存在")); }
    @Override public List<Therapist> therapists(String storeId, String serviceId) { return provider.therapists(storeId, serviceId).stream().map(MockCatalogMapper::therapist).toList(); }
    @Override public List<Room> rooms(String storeId, String status) { return provider.rooms(storeId, status).stream().map(MockCatalogMapper::room).toList(); }
}
