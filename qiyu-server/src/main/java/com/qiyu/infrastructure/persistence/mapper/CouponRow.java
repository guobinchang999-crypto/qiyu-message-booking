package com.qiyu.infrastructure.persistence.mapper;

/** Typed SQL projection for administration coupon campaigns. */
public record CouponRow(String id, String name, String discount, String scope, String validUntil,
                        long issuedCount, long usedCount, String displayStatus) {}
