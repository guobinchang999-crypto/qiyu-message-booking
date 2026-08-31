package com.qiyu.infrastructure.room;

import com.qiyu.application.room.RoomManagementRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/** Explicit mock-profile room repository used only by isolated application tests. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class InMemoryRoomManagementRepository implements RoomManagementRepository {
    private final AtomicLong sequence = new AtomicLong(1000);
    private final List<RoomRecord> rooms = new ArrayList<>();
    private final List<StoreIdentity> stores = List.of(
            new StoreIdentity(1, "store-jingan", "静安寺店"),
            new StoreIdentity(2, "store-xujiahui", "徐家汇店"));

    /** Filters deterministic test state by the same resolved store boundary as persistence mode. */
    @Override
    public synchronized List<RoomRecord> findAll(RoomAccess access) {
        return rooms.stream().filter(room -> access.allStores() || access.storeIds().contains(room.storeId())).toList();
    }

    /** Finds one test room by stable ID. */
    @Override
    public synchronized Optional<RoomRecord> find(String roomId) {
        return rooms.stream().filter(room -> room.id().equals(roomId)).findFirst();
    }

    /** Resolves one deterministic test store identity. */
    @Override
    public Optional<StoreIdentity> findStore(String storeId) {
        return stores.stream().filter(store -> store.id().equals(storeId)).findFirst();
    }

    /** Enforces store-local room-code uniqueness in explicit mock mode. */
    @Override
    public synchronized boolean existsCode(long storeDatabaseId, String roomCode, Long excludedRoomDatabaseId) {
        return rooms.stream().anyMatch(room -> room.storeDatabaseId() == storeDatabaseId
                && room.code().equals(roomCode) && !room.databaseId().equals(excludedRoomDatabaseId));
    }

    /** Persists a test room without exposing dynamic payload structures. */
    @Override
    public synchronized RoomRecord save(RoomRecord room) {
        long databaseId = room.databaseId() == null ? sequence.incrementAndGet() : room.databaseId();
        RoomRecord saved = new RoomRecord(databaseId, "room-" + databaseId, room.storeDatabaseId(), room.storeId(),
                room.storeName(), room.code(), room.name(), room.kind(), room.capacity(), room.status(),
                room.note(), room.sortOrder(), room.enabled());
        rooms.removeIf(existing -> existing.databaseId().equals(databaseId));
        rooms.add(saved);
        return saved;
    }

    /** Mock state contains no bookings unless a dedicated test adapter is introduced. */
    @Override
    public boolean hasBlockingBookingReferences(long roomDatabaseId) {
        return false;
    }

    /** Removes one room from isolated test state. */
    @Override
    public synchronized void delete(long roomDatabaseId) {
        rooms.removeIf(room -> room.databaseId().equals(roomDatabaseId));
    }
}
