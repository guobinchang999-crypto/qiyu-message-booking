package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/**
 * Database projection returned while a member account row is locked for adjustment.
 */
public record MemberBalanceAccountRow(
        long databaseId,
        long customerId,
        String customerName,
        BigDecimal balance,
        String status
) {
}
