package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Typed SQL projection for the administration customer table. */
public record CustomerProfileRow(String id, String name, String phone, String memberLevel,
                                 String lastVisitAt, long totalBookings, BigDecimal totalSpend) {}
