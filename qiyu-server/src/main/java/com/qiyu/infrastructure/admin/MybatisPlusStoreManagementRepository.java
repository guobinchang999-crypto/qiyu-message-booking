package com.qiyu.infrastructure.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qiyu.application.admin.StoreManagementRepository;
import com.qiyu.infrastructure.persistence.entity.CatalogStoreEntity;
import com.qiyu.infrastructure.persistence.mapper.CatalogMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/** MyBatis-Plus implementation of mutable store master-data persistence. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusStoreManagementRepository implements StoreManagementRepository {
    private final CatalogMapper mapper;

    public MybatisPlusStoreManagementRepository(CatalogMapper mapper) { this.mapper = mapper; }

    /** Resolves the API store ID to its persisted business code. */
    @Override
    public Optional<StoreMaster> find(String storeId) {
        String code = storeId.replaceFirst("^store-", "").replace('-', '_').toUpperCase();
        CatalogStoreEntity entity = mapper.selectOne(new LambdaQueryWrapper<CatalogStoreEntity>()
                .eq(CatalogStoreEntity::getStoreCode, code));
        return Optional.ofNullable(entity).map(MybatisPlusStoreManagementRepository::master);
    }

    /** Inserts or updates one store through MyBatis-Plus according to database identity. */
    @Override
    public StoreMaster save(StoreMaster value) {
        CatalogStoreEntity entity = entity(value);
        if (entity.getId() == null) mapper.insert(entity); else mapper.updateById(entity);
        return master(entity);
    }

    /** Counts undeleted resources and all booking history before allowing a store deletion. */
    @Override
    public long dependentRecordCount(long databaseId) {
        Long count = mapper.storeDependencyCount(databaseId);
        return count == null ? 0 : count;
    }

    /** Uses MyBatis-Plus logical deletion configured on the store entity. */
    @Override
    public void delete(String storeId) {
        find(storeId).ifPresent(store -> mapper.deleteById(store.databaseId()));
    }

    /** Uses the Shanghai region as the local default without embedding a numeric database ID. */
    @Override
    public long defaultRegionId() {
        Long id = mapper.regionId("SHANGHAI");
        if (id == null) throw new IllegalStateException("默认上海区域尚未初始化");
        return id;
    }

    private static CatalogStoreEntity entity(StoreMaster value) {
        CatalogStoreEntity entity = new CatalogStoreEntity();
        entity.setId(value.databaseId()); entity.setRegionId(value.regionId()); entity.setStoreCode(value.code());
        entity.setStoreName(value.name()); entity.setPhone(value.phone()); entity.setProvince(value.province());
        entity.setCity(value.city()); entity.setDistrict(value.district()); entity.setAddress(value.address());
        entity.setLongitude(value.longitude()); entity.setLatitude(value.latitude()); entity.setBusinessHours(value.businessHours());
        entity.setOpenTime(value.openTime()); entity.setCloseTime(value.closeTime()); entity.setBusinessStatus(value.businessStatus());
        entity.setRating(value.rating()); entity.setSortOrder(value.sortOrder()); entity.setEnabled(value.enabled() ? 1 : 0);
        return entity;
    }

    private static StoreMaster master(CatalogStoreEntity entity) {
        String id = "store-" + entity.getStoreCode().toLowerCase().replace('_', '-');
        return new StoreMaster(entity.getId(), id, entity.getRegionId(), entity.getStoreCode(), entity.getStoreName(),
                entity.getPhone(), entity.getProvince(), entity.getCity(), entity.getDistrict(), entity.getAddress(),
                entity.getLongitude(), entity.getLatitude(), entity.getBusinessHours(), entity.getOpenTime(),
                entity.getCloseTime(), entity.getBusinessStatus(), entity.getRating(), entity.getSortOrder(),
                Integer.valueOf(1).equals(entity.getEnabled()));
    }
}
