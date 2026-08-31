package com.qiyu.application.member;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Optional;

/** Persistence port for serialized and idempotent member-balance adjustments. */
public interface MemberBalanceRepository {
    /** Locks one account only when it belongs to the effective data scope. */
    Optional<MemberAccount> lockScopedAccount(String memberId, boolean allStores, Collection<String> storeIds);

    /** Finds an immutable ledger row by its client-generated idempotency key. */
    Optional<BalanceTransaction> findByRequestId(String requestId);

    /** Persists the balance calculated while the account lock is held. */
    void updateBalance(long accountId, BigDecimal balanceAfter);

    /** Appends a new immutable balance transaction. */
    BalanceTransaction append(BalanceTransaction transaction);

    record MemberAccount(
            long databaseId,
            long customerId,
            String memberId,
            String customerName,
            BigDecimal balance,
            String status
    ) {
    }

    record BalanceTransaction(
            Long databaseId,
            String transactionNo,
            String requestId,
            long accountId,
            long customerId,
            String type,
            BigDecimal amount,
            BigDecimal balanceAfter,
            String remark,
            String createdBy
    ) {
    }
}
