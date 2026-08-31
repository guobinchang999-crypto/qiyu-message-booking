package com.qiyu.infrastructure.admin;

import com.qiyu.application.admin.StoreManagementRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Explicit Mock-profile store repository used only by isolated tests.
 *
 * <p>Local and deployed environments set {@code qiyu.auth.persistence=true} and therefore never
 * use this adapter. Keeping it in-memory lets the Spring test context exercise authorization and
 * validation without requiring an external MySQL instance.</p>
 */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class InMemoryStoreManagementRepository implements StoreManagementRepository {
    private final AtomicLong sequence = new AtomicLong();
    private final Map<String, StoreMaster> stores = new ConcurrentHashMap<>();

    /** Finds an in-memory store by the stable API ID. */
    @Override
    public Optional<StoreMaster> find(String storeId) {
        return Optional.ofNullable(stores.get(storeId));
    }

    /** Assigns a test-only database identity and stores the latest immutable snapshot. */
    @Override
    public StoreMaster save(StoreMaster value) {
        StoreMaster saved = value.databaseId() == null
                ? new StoreMaster(sequence.incrementAndGet(), value.id(), value.regionId(), value.code(), value.name(),
                value.phone(), value.province(), value.city(), value.district(), value.address(), value.longitude(),
                value.latitude(), value.businessHours(), value.openTime(), value.closeTime(), value.businessStatus(),
                value.rating(), value.sortOrder(), value.enabled())
                : value;
        stores.put(saved.id(), saved);
        return saved;
    }

    /** Mock stores do not create dependent resources unless a test explicitly adds that behavior. */
    @Override
    public long dependentRecordCount(long databaseId) {
        return 0;
    }

    /** Removes one test snapshot; production deletion remains MyBatis-Plus logical deletion. */
    @Override
    public void delete(String storeId) {
        stores.remove(storeId);
    }

    /** Returns a deterministic synthetic region key only inside the explicit Mock profile. */
    @Override
    public long defaultRegionId() {
        return 1L;
    }
}
