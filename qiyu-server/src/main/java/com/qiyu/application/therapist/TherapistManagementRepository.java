package com.qiyu.application.therapist;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/** Application persistence port for therapist master-data management. */
public interface TherapistManagementRepository {
    Optional<TherapistMaster> find(String therapistId);

    boolean codeExists(String code);

    Optional<Long> resolveStoreDatabaseId(String storeId);

    TherapistMaster save(TherapistMaster therapist);

    void replaceSkills(long therapistDatabaseId, List<String> skills);

    long unfinishedBookingCount(long therapistDatabaseId);

    TherapistProfile loadProfile(long therapistDatabaseId);

    void delete(long therapistDatabaseId);

    record TherapistMaster(Long databaseId, String id, String code, long storeDatabaseId, String storeId,
                           String name, String level, BigDecimal rating, BigDecimal specifyFee,
                           String status, int sortOrder, boolean enabled) {
    }

    record TherapistProfile(String id, String name, String store, String level, List<String> skills,
                            String status, BigDecimal rating, long todayBookings, String code, String storeId,
                            String mobile, BigDecimal specifyFee, boolean enabled) {
    }
}
