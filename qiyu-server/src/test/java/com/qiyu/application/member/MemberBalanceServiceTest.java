package com.qiyu.application.member;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.domain.auth.DataAccessScope;
import com.qiyu.domain.auth.DataScopeType;
import com.qiyu.domain.auth.UserType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Unit coverage for the balance rules that must hold independently of MySQL availability. */
class MemberBalanceServiceTest {
    private AuthAppService authAppService;
    private MemberBalanceRepository repository;
    private MemberBalanceService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        authAppService = mock(AuthAppService.class);
        repository = mock(MemberBalanceRepository.class);
        ObjectProvider<MemberBalanceRepository> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(repository);
        when(authAppService.requirePermission("member:manage")).thenReturn(globalPrincipal());
        service = new MemberBalanceService(authAppService, provider);
    }

    /** A valid credit updates the locked account and appends the same resulting balance. */
    @Test
    void creditsAccountAndWritesLedger() {
        MemberBalanceRepository.MemberAccount account = account("100.00");
        when(repository.lockScopedAccount(eq("member-1"), eq(true), anySet())).thenReturn(Optional.of(account));
        when(repository.findByRequestId("request-credit")).thenReturn(Optional.empty());
        when(repository.append(any())).thenAnswer(invocation -> {
            MemberBalanceRepository.BalanceTransaction value = invocation.getArgument(0);
            return new MemberBalanceRepository.BalanceTransaction(
                    9L, value.transactionNo(), value.requestId(), value.accountId(), value.customerId(),
                    value.type(), value.amount(), value.balanceAfter(), value.remark(), value.createdBy()
            );
        });

        MemberBalanceService.AdjustmentResult result = service.adjust(
                "member-1",
                new MemberBalanceService.AdjustmentCommand(
                        "CREDIT", new BigDecimal("20"), "线下补偿", "request-credit"
                )
        );

        assertThat(result.balanceBefore()).isEqualByComparingTo("100.00");
        assertThat(result.balanceAfter()).isEqualByComparingTo("120.00");
        assertThat(result.idempotentReplay()).isFalse();
        verify(repository).updateBalance(1L, new BigDecimal("120.00"));
        ArgumentCaptor<MemberBalanceRepository.BalanceTransaction> transaction =
                ArgumentCaptor.forClass(MemberBalanceRepository.BalanceTransaction.class);
        verify(repository).append(transaction.capture());
        assertThat(transaction.getValue().type()).isEqualTo("ADJUSTMENT_CREDIT");
        assertThat(transaction.getValue().createdBy()).isEqualTo("9001");
    }

    /** A retry with the same request ID returns the original transaction without another write. */
    @Test
    void replaysExistingTransactionIdempotently() {
        MemberBalanceRepository.MemberAccount account = account("120.00");
        MemberBalanceRepository.BalanceTransaction existing = new MemberBalanceRepository.BalanceTransaction(
                9L, "MBA-EXISTING", "request-credit", 1L, 11L, "ADJUSTMENT_CREDIT",
                new BigDecimal("20.00"), new BigDecimal("120.00"), "线下补偿", "9001"
        );
        when(repository.lockScopedAccount(eq("member-1"), eq(true), anySet())).thenReturn(Optional.of(account));
        when(repository.findByRequestId("request-credit")).thenReturn(Optional.of(existing));

        MemberBalanceService.AdjustmentResult result = service.adjust(
                "member-1",
                new MemberBalanceService.AdjustmentCommand(
                        "CREDIT", new BigDecimal("20"), "线下补偿", "request-credit"
                )
        );

        assertThat(result.idempotentReplay()).isTrue();
        assertThat(result.balanceBefore()).isEqualByComparingTo("100.00");
        verify(repository, never()).updateBalance(any(Long.class), any(BigDecimal.class));
        verify(repository, never()).append(any());
    }

    /** Reusing an idempotency key with a different payload is rejected as a caller error. */
    @Test
    void rejectsIdempotencyKeyWithDifferentPayload() {
        MemberBalanceRepository.BalanceTransaction existing = new MemberBalanceRepository.BalanceTransaction(
                9L, "MBA-EXISTING", "request-credit", 1L, 11L, "ADJUSTMENT_CREDIT",
                new BigDecimal("20.00"), new BigDecimal("120.00"), "线下补偿", "9001"
        );
        when(repository.lockScopedAccount(eq("member-1"), eq(true), anySet()))
                .thenReturn(Optional.of(account("120.00")));
        when(repository.findByRequestId("request-credit")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.adjust(
                "member-1",
                new MemberBalanceService.AdjustmentCommand(
                        "CREDIT", new BigDecimal("30"), "线下补偿", "request-credit"
                )
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("幂等请求号已用于不同的余额调整参数");

        verify(repository, never()).updateBalance(any(Long.class), any(BigDecimal.class));
        verify(repository, never()).append(any());
    }

    /** A debit that would create a negative balance is rejected before either persistence write. */
    @Test
    void rejectsDebitBeyondAvailableBalance() {
        when(repository.lockScopedAccount(eq("member-1"), anyBoolean(), anySet()))
                .thenReturn(Optional.of(account("10.00")));
        when(repository.findByRequestId("request-debit")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.adjust(
                "member-1",
                new MemberBalanceService.AdjustmentCommand(
                        "DEBIT", new BigDecimal("10.01"), "人工扣减", "request-debit"
                )
        )).isInstanceOf(IllegalArgumentException.class).hasMessage("会员余额不足，不能执行扣减调整");

        verify(repository, never()).updateBalance(any(Long.class), any(BigDecimal.class));
        verify(repository, never()).append(any());
    }

    private static MemberBalanceRepository.MemberAccount account(String balance) {
        return new MemberBalanceRepository.MemberAccount(
                1L, 11L, "member-1", "测试会员", new BigDecimal(balance), "ACTIVE"
        );
    }

    private static AuthPrincipal globalPrincipal() {
        DataAccessScope scope = new DataAccessScope(
                "member", "MANAGE", Set.of(DataScopeType.ALL_STORES), Set.of(), Set.of()
        );
        return new AuthPrincipal(
                9001L, UserType.STAFF, null, null, Set.of("HQ_ADMIN"), Set.of("member:manage"),
                DataScopeType.ALL_STORES, Set.of(), Set.of(), List.of(scope), Set.of(), "管理员", null
        );
    }
}
