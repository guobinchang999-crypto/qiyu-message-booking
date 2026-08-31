package com.qiyu.application.room;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Persistence port for scoped room master-data operations. */
public interface RoomManagementRepository {
    /** Returns rooms visible through the already resolved server-side store scope. */
    List<RoomRecord> findAll(RoomAccess access);

    /** Finds one undeleted room by its stable API identifier. */
    Optional<RoomRecord> find(String roomId);

    /** Resolves a stable store API identifier without accepting a database ID from the caller. */
    Optional<StoreIdentity> findStore(String storeId);

    /** Detects a duplicate room code inside one store before persistence. */
    boolean existsCode(long storeDatabaseId, String roomCode, Long excludedRoomDatabaseId);

    /** Inserts or updates a room through its database identity. */
    RoomRecord save(RoomRecord room);

    /** Returns whether future or unfinished bookings still reference the room. */
    boolean hasBlockingBookingReferences(long roomDatabaseId);

    /** Performs a logical delete through MyBatis-Plus. */
    void delete(long roomDatabaseId);

    record RoomAccess(boolean allStores, Collection<String> storeIds) {
    }

    record StoreIdentity(long databaseId, String id, String name) {
    }

    record RoomRecord(Long databaseId, String id, long storeDatabaseId, String storeId, String storeName,
                      String code, String name, String kind, int capacity, String status,
                      String note, int sortOrder, boolean enabled) {
    }
}
