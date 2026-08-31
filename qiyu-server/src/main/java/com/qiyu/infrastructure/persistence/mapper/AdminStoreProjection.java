package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Immutable projection for one administration store list row. */
public record AdminStoreProjection(String id, String code, Long regionId, String name, String phone,
                                   String province, String city, String district, String address,
                                   BigDecimal longitude, BigDecimal latitude, String businessHours,
                                   String manager, long roomCount, long therapistCount, String status,
                                   BigDecimal rating, Integer sortOrder, Boolean enabled) {
}
