package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Immutable projection for one store-level operating report row. */
public record AdminBusinessReportProjection(String id, String store, long bookingCount,
                                            BigDecimal completionRate, BigDecimal revenue,
                                            BigDecimal averageTicket, String topService) {
}
