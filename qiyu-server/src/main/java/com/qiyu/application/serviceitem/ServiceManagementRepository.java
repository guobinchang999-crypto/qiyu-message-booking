package com.qiyu.application.serviceitem;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/** Persistence port for service-item administration without exposing database entities. */
public interface ServiceManagementRepository {
    /** Returns every active service item, including items currently off shelf. */
    List<ServiceMaster> findAll();

    /** Resolves one stable API identifier to an active service item. */
    Optional<ServiceMaster> findById(String serviceId);

    /** Checks business-code uniqueness while preserving soft-deleted history. */
    boolean codeExists(String serviceCode);

    /** Resolves an enabled service category by its user-facing name. */
    Optional<Long> findCategoryId(String categoryName);

    /** Inserts or updates one service item and returns its persisted read model. */
    ServiceMaster save(ServiceMaster service);

    /** Counts all booking history that references the service item. */
    long countBookingReferences(long databaseId);
    default long countUnfinishedBookings(long databaseId) { return countBookingReferences(databaseId); }

    /** Soft-deletes the service item identified by its database key. */
    void delete(long databaseId);

    /** Application-facing service-item persistence model. */
    record ServiceMaster(
            Long databaseId,
            String id,
            String code,
            Long categoryId,
            String category,
            String name,
            Integer durationMinutes,
            Integer preparationMinutes,
            Integer cleanupMinutes,
            BigDecimal price,
            BigDecimal memberPrice,
            String description,
            String databaseStatus,
            Integer sortOrder,
            long bookingCount,
            String createdBy,
            String updatedBy
    ) {
    }
}
