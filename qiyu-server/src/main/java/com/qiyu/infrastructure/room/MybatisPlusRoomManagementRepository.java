package com.qiyu.infrastructure.room;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qiyu.application.room.RoomManagementRepository;
import com.qiyu.infrastructure.persistence.entity.RoomEntity;
import com.qiyu.infrastructure.persistence.mapper.RoomManagementMapper;
import com.qiyu.infrastructure.persistence.mapper.RoomManagementRow;
import com.qiyu.infrastructure.persistence.mapper.RoomStoreIdentityRow;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/** MyBatis-Plus implementation of the room management persistence port. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusRoomManagementRepository implements RoomManagementRepository {
    private final RoomManagementMapper mapper;

    public MybatisPlusRoomManagementRepository(RoomManagementMapper mapper) {
        this.mapper = mapper;
    }

    /** Delegates scoped list filtering to typed SQL and maps rows to the application port. */
    @Override
    public List<RoomRecord> findAll(RoomAccess access) {
        return mapper.findAll(access.allStores(), access.storeIds()).stream()
                .map(MybatisPlusRoomManagementRepository::record).toList();
    }

    /** Finds an undeleted room by the stable room-{databaseId} identifier. */
    @Override
    public Optional<RoomRecord> find(String roomId) {
        return Optional.ofNullable(mapper.findByApiId(roomId)).map(MybatisPlusRoomManagementRepository::record);
    }

    /** Resolves the caller-facing store ID to a trusted database identity. */
    @Override
    public Optional<StoreIdentity> findStore(String storeId) {
        return Optional.ofNullable(mapper.findStore(storeId)).map(MybatisPlusRoomManagementRepository::store);
    }

    /** Uses MyBatis-Plus predicates for store-local room-code uniqueness checks. */
    @Override
    public boolean existsCode(long storeDatabaseId, String roomCode, Long excludedRoomDatabaseId) {
        LambdaQueryWrapper<RoomEntity> query = new LambdaQueryWrapper<RoomEntity>()
                .eq(RoomEntity::getStoreId, storeDatabaseId)
                .eq(RoomEntity::getRoomCode, roomCode);
        if (excludedRoomDatabaseId != null) {
            query.ne(RoomEntity::getId, excludedRoomDatabaseId);
        }
        return mapper.selectCount(query) > 0;
    }

    /** Inserts or updates room master data through MyBatis-Plus. */
    @Override
    public RoomRecord save(RoomRecord room) {
        RoomEntity entity = entity(room);
        if (entity.getId() == null) {
            mapper.insert(entity);
        } else {
            mapper.updateById(entity);
        }
        RoomManagementRow saved = mapper.findByDatabaseId(entity.getId());
        if (saved == null) throw new IllegalStateException("房间保存成功但读取模型尚未同步");
        return record(saved);
    }

    /** Checks the typed booking-reference query before logical deletion. */
    @Override
    public boolean hasBlockingBookingReferences(long roomDatabaseId) {
        return mapper.countBlockingBookingReferences(roomDatabaseId) > 0;
    }

    /** Uses the room entity's TableLogic metadata for soft deletion. */
    @Override
    public void delete(long roomDatabaseId) {
        mapper.deleteById(roomDatabaseId);
    }

    private static RoomRecord record(RoomManagementRow row) {
        return new RoomRecord(row.databaseId(), row.id(), row.storeDatabaseId(), row.storeId(), row.storeName(),
                row.code(), row.name(), row.kind(), row.capacity(), row.status(), row.note(), row.sortOrder(), row.enabled());
    }

    private static StoreIdentity store(RoomStoreIdentityRow row) {
        return new StoreIdentity(row.databaseId(), row.id(), row.name());
    }

    private static RoomEntity entity(RoomRecord room) {
        RoomEntity entity = new RoomEntity();
        entity.setId(room.databaseId());
        entity.setStoreId(room.storeDatabaseId());
        entity.setRoomCode(room.code());
        entity.setRoomName(room.name());
        entity.setRoomKind(room.kind());
        entity.setCapacity(room.capacity());
        entity.setNote(room.note());
        entity.setStatus(room.status());
        entity.setSortOrder(room.sortOrder());
        entity.setEnabled(room.enabled() ? 1 : 0);
        return entity;
    }

}
