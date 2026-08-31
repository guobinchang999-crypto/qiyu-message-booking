package com.qiyu.infrastructure.member;

import com.qiyu.application.member.CustomerFavoriteRepository;
import com.qiyu.infrastructure.persistence.mapper.CustomerFavoriteMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

/** Production favorite repository implemented through a MyBatis-Plus mapper. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusCustomerFavoriteRepository implements CustomerFavoriteRepository {
    private final CustomerFavoriteMapper mapper;

    public MybatisPlusCustomerFavoriteRepository(CustomerFavoriteMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public boolean isFavoriteStore(long customerId, String storeId) {
        return mapper.favoriteStoreCount(customerId, storeId) > 0;
    }

    @Override
    public boolean isFavoriteService(long customerId, String serviceId) {
        return mapper.favoriteServiceCount(customerId, serviceId) > 0;
    }

    @Override
    public void saveFavoriteStore(long customerId, String storeId) {
        if (mapper.saveStore(customerId, storeId) < 1) throw new IllegalArgumentException("门店不存在");
    }

    @Override
    public void saveFavoriteService(long customerId, String serviceId) {
        if (mapper.saveService(customerId, serviceId) < 1) throw new IllegalArgumentException("服务项目不存在");
    }

    @Override
    public void deleteFavoriteStore(long customerId, String storeId) {
        mapper.deleteStore(customerId, storeId);
    }

    @Override
    public void deleteFavoriteService(long customerId, String serviceId) {
        mapper.deleteService(customerId, serviceId);
    }
}
