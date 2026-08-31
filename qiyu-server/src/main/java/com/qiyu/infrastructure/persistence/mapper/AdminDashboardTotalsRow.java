package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Typed aggregate for the four dashboard counters in the current business day. */
public record AdminDashboardTotalsRow(long bookingCount, long waitingCount, long inServiceCount,
                                      BigDecimal expectedRevenue) {
}
