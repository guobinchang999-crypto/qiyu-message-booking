package com.qiyu.infrastructure.member;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.qiyu.application.member.MemberBalanceRepository;
import com.qiyu.infrastructure.persistence.entity.MemberAccountEntity;
import com.qiyu.infrastructure.persistence.entity.MemberBalanceTransactionEntity;
import com.qiyu.infrastructure.persistence.mapper.MemberBalanceAccountMapper;
import com.qiyu.infrastructure.persistence.mapper.MemberBalanceAccountRow;
import com.qiyu.infrastructure.persistence.mapper.MemberBalanceTransactionMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Optional;

/** Production member-balance repository implemented with MyBatis-Plus. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusMemberBalanceRepository implements MemberBalanceRepository {
    private static final String MEMBER_ID_PREFIX = "member-";

    private final MemberBalanceAccountMapper accountMapper;
    private final MemberBalanceTransactionMapper transactionMapper;

    public MybatisPlusMemberBalanceRepository(
            MemberBalanceAccountMapper accountMapper,
            MemberBalanceTransactionMapper transactionMapper
    ) {
        this.accountMapper = accountMapper;
        this.transactionMapper = transactionMapper;
    }

    /**
     * Converts the public member identifier to its database key and locks only an account visible
     * through the caller's effective store scope.
     */
    @Override
    public Optional<MemberAccount> lockScopedAccount(
            String memberId,
            boolean allStores,
            Collection<String> storeIds
    ) {
        long accountId = parseAccountId(memberId);
        MemberBalanceAccountRow row = accountMapper.lockScopedAccount(accountId, allStores, storeIds);
        if (row == null) {
            return Optional.empty();
        }
        return Optional.of(new MemberAccount(
                row.databaseId(),
                row.customerId(),
                publicMemberId(row.databaseId()),
                row.customerName(),
                row.balance(),
                row.status()
        ));
    }

    /** Reads an existing ledger row so retries return the original successful result. */
    @Override
    public Optional<BalanceTransaction> findByRequestId(String requestId) {
        MemberBalanceTransactionEntity entity = transactionMapper.selectOne(
                new LambdaQueryWrapper<MemberBalanceTransactionEntity>()
                        .eq(MemberBalanceTransactionEntity::getRequestId, requestId)
                        .last("LIMIT 1")
        );
        return Optional.ofNullable(entity).map(MybatisPlusMemberBalanceRepository::transaction);
    }

    /** Updates only the mutable balance column after the application service has locked the row. */
    @Override
    public void updateBalance(long accountId, BigDecimal balanceAfter) {
        int affected = accountMapper.update(
                null,
                new LambdaUpdateWrapper<MemberAccountEntity>()
                        .eq(MemberAccountEntity::getId, accountId)
                        .set(MemberAccountEntity::getBalanceAmount, balanceAfter)
        );
        if (affected != 1) {
            throw new IllegalStateException("会员余额更新失败");
        }
    }

    /** Appends one immutable transaction and returns the generated database identifier. */
    @Override
    public BalanceTransaction append(BalanceTransaction value) {
        MemberBalanceTransactionEntity entity = new MemberBalanceTransactionEntity();
        entity.setAccountId(value.accountId());
        entity.setCustomerId(value.customerId());
        entity.setTransactionNo(value.transactionNo());
        entity.setTransactionType(value.type());
        entity.setAmount(value.amount());
        entity.setBalanceAfter(value.balanceAfter());
        entity.setRemark(value.remark());
        entity.setRequestId(value.requestId());
        entity.setCreatedBy(value.createdBy());
        transactionMapper.insert(entity);
        return transaction(entity);
    }

    private static BalanceTransaction transaction(MemberBalanceTransactionEntity entity) {
        return new BalanceTransaction(
                entity.getId(),
                entity.getTransactionNo(),
                entity.getRequestId(),
                entity.getAccountId(),
                entity.getCustomerId(),
                entity.getTransactionType(),
                entity.getAmount(),
                entity.getBalanceAfter(),
                entity.getRemark(),
                entity.getCreatedBy()
        );
    }

    private static long parseAccountId(String memberId) {
        if (memberId == null || memberId.isBlank()) {
            throw new IllegalArgumentException("会员编号不能为空");
        }
        String normalized = memberId.startsWith(MEMBER_ID_PREFIX)
                ? memberId.substring(MEMBER_ID_PREFIX.length())
                : memberId;
        try {
            return Long.parseLong(normalized);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("会员编号格式不正确");
        }
    }

    private static String publicMemberId(long databaseId) {
        return MEMBER_ID_PREFIX + databaseId;
    }
}
