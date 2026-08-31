package com.qiyu.infrastructure.serviceitem;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qiyu.application.serviceitem.ServiceManagementRepository;
import com.qiyu.application.serviceitem.ServiceManagementService;
import com.qiyu.infrastructure.persistence.entity.CatalogServiceItemEntity;
import com.qiyu.infrastructure.persistence.mapper.ServiceManagementMapper;
import com.qiyu.infrastructure.persistence.mapper.ServiceManagementProjection;
import org.springframework.stereotype.Repository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** MyBatis-Plus implementation of the service-item administration persistence port. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusServiceManagementRepository implements ServiceManagementRepository {
    private final ServiceManagementMapper mapper;

    public MybatisPlusServiceManagementRepository(ServiceManagementMapper mapper) {
        this.mapper = mapper;
    }

    /** Maps typed SQL projections into application-layer service masters. */
    @Override
    public List<ServiceMaster> findAll() {
        return mapper.findAllResources().stream().map(MybatisPlusServiceManagementRepository::master).toList();
    }

    /** Accepts the canonical stable ID and the three legacy catalog aliases during migration. */
    @Override
    public Optional<ServiceMaster> findById(String serviceId) {
        String code = codeFromId(serviceId);
        CatalogServiceItemEntity entity = mapper.selectOne(new LambdaQueryWrapper<CatalogServiceItemEntity>()
                .eq(CatalogServiceItemEntity::getServiceCode, code));
        if (entity == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(mapper.findResourceByDatabaseId(entity.getId()))
                .map(MybatisPlusServiceManagementRepository::master);
    }

    /** Checks codes against both active and soft-deleted rows because the database key is unique. */
    @Override
    public boolean codeExists(String serviceCode) {
        return mapper.countCodeIncludingDeleted(serviceCode) > 0;
    }

    /** Resolves category identity through a typed scalar mapper query. */
    @Override
    public Optional<Long> findCategoryId(String categoryName) {
        return Optional.ofNullable(mapper.findCategoryIdByName(categoryName));
    }

    /** Persists through BaseMapper and reloads aggregate fields from the typed read query. */
    @Override
    public ServiceMaster save(ServiceMaster service) {
        CatalogServiceItemEntity entity = entity(service);
        if (entity.getId() == null) {
            mapper.insert(entity);
        } else {
            mapper.updateById(entity);
        }
        ServiceManagementProjection saved = mapper.findResourceByDatabaseId(entity.getId());
        if (saved == null) {
            throw new IllegalStateException("服务项目保存成功但无法重新读取");
        }
        return master(saved);
    }

    /** Delegates the delete guard to a database count that includes historical bookings. */
    @Override
    public long countBookingReferences(long databaseId) {
        Long count = mapper.countBookingReferences(databaseId);
        return count == null ? 0 : count;
    }

    /** Uses the entity's TableLogic metadata to issue a logical delete. */
    @Override
    public void delete(long databaseId) {
        mapper.deleteById(databaseId);
    }

    private static CatalogServiceItemEntity entity(ServiceMaster value) {
        CatalogServiceItemEntity entity = new CatalogServiceItemEntity();
        entity.setId(value.databaseId());
        entity.setServiceCode(value.code());
        entity.setCategoryId(value.categoryId());
        entity.setServiceName(value.name());
        entity.setDurationMinutes(value.durationMinutes());
        entity.setPreparationMinutes(value.preparationMinutes());
        entity.setCleanupMinutes(value.cleanupMinutes());
        entity.setPriceAmount(value.price());
        entity.setMemberPriceAmount(value.memberPrice());
        entity.setDescription(value.description());
        entity.setStatus(value.databaseStatus());
        entity.setSortOrder(value.sortOrder());
        entity.setCreatedBy(value.createdBy());
        entity.setUpdatedBy(value.updatedBy());
        return entity;
    }

    private static ServiceMaster master(ServiceManagementProjection value) {
        return new ServiceMaster(value.databaseId(), value.id(), value.code(), value.categoryId(),
                value.category(), value.name(), value.durationMinutes(), value.preparationMinutes(),
                value.cleanupMinutes(), value.price(), value.memberPrice(), value.description(), value.status(),
                value.sortOrder(), value.bookingCount() == null ? 0 : value.bookingCount(),
                value.createdBy(), value.updatedBy());
    }

    private static String codeFromId(String serviceId) {
        if (serviceId == null || !serviceId.startsWith("service-") || serviceId.length() <= "service-".length()) {
            throw new IllegalArgumentException("服务项目编号格式不正确");
        }
        return switch (serviceId) {
            case "service-neck" -> "NECK_60";
            case "service-tui-na" -> "TUINA_90";
            case "service-spa" -> "AROMA_90";
            default -> serviceId.substring("service-".length()).replace('-', '_').toUpperCase(Locale.ROOT);
        };
    }
}
