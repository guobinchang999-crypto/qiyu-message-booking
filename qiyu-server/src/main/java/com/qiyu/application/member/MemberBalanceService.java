package com.qiyu.application.member;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.domain.auth.DataAccessScope;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/** Applies auditable balance adjustments without allowing direct balance replacement. */
@Service
public class MemberBalanceService {
    private static final Set<String> DIRECTIONS = Set.of("CREDIT", "DEBIT");
    private static final Set<String> NO_ACCESS_STORE = Set.of("__NO_ACCESS_STORE__");

    private final AuthAppService authAppService;
    private final ObjectProvider<MemberBalanceRepository> repositoryProvider;

    public MemberBalanceService(
            AuthAppService authAppService,
            ObjectProvider<MemberBalanceRepository> repositoryProvider
    ) {
        this.authAppService = authAppService;
        this.repositoryProvider = repositoryProvider;
    }

    /**
     * Locks the account within the operator's data range, detects an idempotent retry, validates
     * the requested delta, then commits the new balance and immutable ledger row atomically.
     */
    @Transactional
    public AdjustmentResult adjust(String memberId, AdjustmentCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("余额调整参数不能为空");
        }
        AuthPrincipal principal = authAppService.requirePermission("member:manage");
        String requestId = required(command.requestId(), "幂等请求号不能为空");
        if (requestId.length() > 64) {
            throw new IllegalArgumentException("幂等请求号不能超过64个字符");
        }
        String direction = direction(command.direction());
        BigDecimal amount = amount(command.amount());
        String remark = remark(command.remark());

        DataAccessScope scope = principal.scopeFor("member", "MANAGE");
        Set<String> storeIds = scope.storeIds().isEmpty() ? NO_ACCESS_STORE : scope.storeIds();
        MemberBalanceRepository repository = repository();
        MemberBalanceRepository.MemberAccount account = repository
                .lockScopedAccount(memberId, scope.allowsAllStores(), storeIds)
                .orElseThrow(() -> new SecurityException("会员不存在或不在当前数据范围内"));

        MemberBalanceRepository.BalanceTransaction existing = repository
                .findByRequestId(requestId)
                .orElse(null);
        if (existing != null) {
            if (existing.accountId() != account.databaseId()) {
                throw new IllegalArgumentException("幂等请求号已用于其他会员");
            }
            ensureSameRequest(existing, direction, amount, remark);
            return result(account, existing, true);
        }

        ensureActive(account);
        BigDecimal balanceAfter = calculateBalance(account.balance(), direction, amount);

        repository.updateBalance(account.databaseId(), balanceAfter);
        MemberBalanceRepository.BalanceTransaction transaction = repository.append(
                new MemberBalanceRepository.BalanceTransaction(
                        null,
                        transactionNo(),
                        requestId,
                        account.databaseId(),
                        account.customerId(),
                        "ADJUSTMENT_" + direction,
                        amount,
                        balanceAfter,
                        remark,
                        String.valueOf(principal.userId())
                )
        );
        return result(account, transaction, false);
    }

    private MemberBalanceRepository repository() {
        MemberBalanceRepository repository = repositoryProvider.getIfAvailable();
        if (repository == null) {
            throw new IllegalStateException("当前运行模式未配置会员余额持久化仓储");
        }
        return repository;
    }

    private static void ensureActive(MemberBalanceRepository.MemberAccount account) {
        if (!"ACTIVE".equals(account.status())) {
            throw new IllegalArgumentException("会员账户已冻结，不能调整余额");
        }
    }

    private static void ensureSameRequest(
            MemberBalanceRepository.BalanceTransaction existing,
            String direction,
            BigDecimal amount,
            String remark
    ) {
        boolean sameType = existing.type().equals("ADJUSTMENT_" + direction);
        boolean sameAmount = existing.amount().compareTo(amount) == 0;
        boolean sameRemark = java.util.Objects.equals(existing.remark(), remark);
        if (!sameType || !sameAmount || !sameRemark) {
            throw new IllegalArgumentException("幂等请求号已用于不同的余额调整参数");
        }
    }

    private static String direction(String value) {
        String direction = required(value, "调整方向不能为空").toUpperCase(Locale.ROOT);
        if (!DIRECTIONS.contains(direction)) {
            throw new IllegalArgumentException("调整方向不正确");
        }
        return direction;
    }

    private static BigDecimal amount(BigDecimal value) {
        BigDecimal amount = value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
        if (amount.signum() <= 0) {
            throw new IllegalArgumentException("调整金额必须大于0");
        }
        if (amount.precision() - amount.scale() > 8) {
            throw new IllegalArgumentException("调整金额不能超过99999999.99");
        }
        return amount;
    }

    private static String remark(String value) {
        String remark = required(value, "调整原因不能为空");
        if (remark.length() > 255) {
            throw new IllegalArgumentException("调整原因不能超过255个字符");
        }
        return remark;
    }

    private static BigDecimal calculateBalance(BigDecimal current, String direction, BigDecimal amount) {
        BigDecimal balance = current == null ? BigDecimal.ZERO : current;
        BigDecimal result = "CREDIT".equals(direction) ? balance.add(amount) : balance.subtract(amount);
        if (result.signum() < 0) {
            throw new IllegalArgumentException("会员余额不足，不能执行扣减调整");
        }
        return result;
    }

    private static AdjustmentResult result(
            MemberBalanceRepository.MemberAccount account,
            MemberBalanceRepository.BalanceTransaction transaction,
            boolean replay
    ) {
        BigDecimal balanceBefore = "ADJUSTMENT_CREDIT".equals(transaction.type())
                ? transaction.balanceAfter().subtract(transaction.amount())
                : transaction.balanceAfter().add(transaction.amount());
        return new AdjustmentResult(
                account.memberId(),
                account.customerName(),
                transaction.transactionNo(),
                transaction.requestId(),
                transaction.type(),
                transaction.amount(),
                balanceBefore,
                transaction.balanceAfter(),
                replay
        );
    }

    private static String transactionNo() {
        String randomSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
        return "MBA" + Instant.now().toEpochMilli() + randomSuffix.toUpperCase(Locale.ROOT);
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    /** Typed command accepted from the administration adapter. */
    public record AdjustmentCommand(
            String direction,
            BigDecimal amount,
            String remark,
            String requestId
    ) {
    }

    /** Typed result containing both balances and the immutable transaction identity. */
    public record AdjustmentResult(
            String memberId,
            String customerName,
            String transactionNo,
            String requestId,
            String transactionType,
            BigDecimal amount,
            BigDecimal balanceBefore,
            BigDecimal balanceAfter,
            boolean idempotentReplay
    ) {
    }
}
