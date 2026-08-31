package com.qiyu.infrastructure.serviceitem;

import com.qiyu.application.serviceitem.ServiceManagementRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/** Empty in-memory adapter used only by the explicit mock profile for isolated application tests. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class InMemoryServiceManagementRepository implements ServiceManagementRepository {
    private final AtomicLong sequence = new AtomicLong(1);
    private final Map<String, ServiceMaster> records = new ConcurrentHashMap<>();

    /** Returns mock-test mutations only; no production catalog data is embedded here. */
    @Override
    public List<ServiceMaster> findAll() {
        return records.values().stream().sorted(Comparator.comparing(ServiceMaster::id)).toList();
    }

    @Override
    public Optional<ServiceMaster> findById(String serviceId) {
        return Optional.ofNullable(records.get(serviceId));
    }

    @Override
    public boolean codeExists(String serviceCode) {
        return records.values().stream().anyMatch(value -> value.code().equals(serviceCode));
    }

    /** Accepts the seeded category names used by explicit mock-mode request tests. */
    @Override
    public Optional<Long> findCategoryId(String categoryValue) {
        return categoryValue == null || categoryValue.isBlank() ? Optional.empty() : Optional.of(1L);
    }

    @Override
    public ServiceMaster save(ServiceMaster value) {
        Long databaseId = value.databaseId() == null ? sequence.getAndIncrement() : value.databaseId();
        ServiceMaster saved = new ServiceMaster(databaseId, value.id(), value.code(), value.categoryId(),
                value.category(), value.name(), value.durationMinutes(), value.preparationMinutes(),
                value.cleanupMinutes(), value.price(), value.memberPrice(), value.description(),
                value.databaseStatus(), value.sortOrder(), value.bookingCount(), value.createdBy(), value.updatedBy());
        records.put(saved.id(), saved);
        return saved;
    }

    @Override
    public long countBookingReferences(long databaseId) {
        return 0;
    }

    @Override
    public void delete(long databaseId) {
        records.values().removeIf(value -> databaseId == value.databaseId());
    }
}
