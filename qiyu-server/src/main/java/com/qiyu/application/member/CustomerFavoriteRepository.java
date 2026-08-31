package com.qiyu.application.member;

/** Persistence port for customer-owned store and service favorites. */
public interface CustomerFavoriteRepository {
    boolean isFavoriteStore(long customerId, String storeId);
    boolean isFavoriteService(long customerId, String serviceId);
    void saveFavoriteStore(long customerId, String storeId);
    void saveFavoriteService(long customerId, String serviceId);
    void deleteFavoriteStore(long customerId, String storeId);
    void deleteFavoriteService(long customerId, String serviceId);
}
