package com.qiyu.application.admin;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Optional;

/** Persistence port for mutable store master data. */
public interface StoreManagementRepository {
    Optional<StoreMaster> find(String storeId);

    StoreMaster save(StoreMaster store);

    /** Counts active resources or business records that still own the store identity. */
    long dependentRecordCount(long databaseId);
    default long unfinishedBookingCount(long databaseId) { return dependentRecordCount(databaseId); }

    void delete(String storeId);

    long defaultRegionId();

    record StoreMaster(Long databaseId, String id, Long regionId, String code, String name, String phone,
                       String province, String city, String district, String address, BigDecimal longitude,
                       BigDecimal latitude, String businessHours, LocalTime openTime, LocalTime closeTime,
                       String businessStatus, BigDecimal rating, int sortOrder, boolean enabled) {
    }
}
