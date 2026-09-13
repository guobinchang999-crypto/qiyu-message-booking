package com.qiyu.application.admin;

import com.qiyu.application.admin.dto.ManagementModels.*;
import com.qiyu.application.auth.*;
import com.qiyu.application.room.RoomManagementService;
import com.qiyu.application.serviceitem.ServiceManagementService;
import com.qiyu.application.coupon.CouponManagementService;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.auth.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.ObjectProvider;
import java.math.BigDecimal;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.assertj.core.api.Assertions.*;

class ManagementQueryServiceTest {
    AuthAppService auth;ManagementReadRepository repository;ManagementQueryService service;
    @BeforeEach @SuppressWarnings("unchecked") void setup(){
        auth=mock(AuthAppService.class);repository=mock(ManagementReadRepository.class);
        ObjectProvider<ManagementReadRepository> provider=mock(ObjectProvider.class);when(provider.getIfAvailable()).thenReturn(repository);
        service=new ManagementQueryService(auth,mock(AdminQueryService.class),mock(RoomManagementService.class),
            mock(ServiceManagementService.class),mock(CouponManagementService.class),mock(CatalogGateway.class),provider);
    }
    AuthPrincipal principal(String resource,Set<String> permissions){
        return new AuthPrincipal(1,UserType.STAFF,null,null,Set.of("STAFF"),permissions,DataScopeType.PRIMARY_STORE,
            Set.of("store-a"),Set.of(),List.of(new DataAccessScope(resource,"READ",Set.of(DataScopeType.PRIMARY_STORE),Set.of("store-a"),Set.of())),
            Set.of(),"测试店员",null);
    }
    Query query(String storeId,String customerId){return new Query(null,storeId,null,null,null,null,null,"2026-09-09","2026-09-10",1,20,null,null,customerId);}
    @Test void customerListMasksFieldsWithoutRequiringMemberRead(){
        when(auth.requirePermission("customer:read")).thenReturn(principal("customer",Set.of("customer:read")));
        var customer=new Customer("1","member-11","同名","13800000001","VIP",null,1,BigDecimal.TEN,BigDecimal.TEN,2,3);
        when(repository.customers(any(),any(),eq(false))).thenReturn(new Page<>(List.of(customer),1,1,20));
        var row=service.customers(query(null,null),false).list().getFirst();
        assertThat(row.phone()).isEqualTo("138****0001");assertThat(row.totalSpend()).isNull();assertThat(row.balance()).isNull();
        verify(auth,never()).requirePermission("member:read");
    }
    @Test void memberOnlyAccountDoesNotRequireCustomerPermission(){
        when(auth.requirePermission("member:read")).thenReturn(principal("member",Set.of("member:read")));
        when(repository.customers(any(),any(),eq(true))).thenReturn(new Page<>(List.of(),0,1,20));
        service.customers(query(null,null),true);verify(auth,never()).requirePermission("customer:read");
    }
    @Test void crossStoreFilterIsRejectedBeforeAnyRead(){
        when(auth.requirePermission("report:read")).thenReturn(principal("report",Set.of("report:read")));
        assertThatThrownBy(()->service.analytics(query("store-b",null),false)).isInstanceOf(SecurityException.class);
        verifyNoInteractions(repository);
    }
    @Test void aggregatesRawTotalsAndFillsDatesWithoutBookings(){
        when(auth.requirePermission("report:read")).thenReturn(principal("report",Set.of("report:read")));
        when(repository.metrics(any(),any(),eq(false))).thenReturn(List.of(
            ManagementQueryService.metric("a","一店",1,1,new BigDecimal("100")),
            ManagementQueryService.metric("b","二店",9,1,new BigDecimal("80"))));
        when(repository.metrics(any(),any(),eq(true))).thenReturn(List.of());
        var result=service.analytics(query(null,null),false);
        assertThat(result.summary().completionRate()).isEqualByComparingTo("20");
        assertThat(result.summary().averageTicket()).isEqualByComparingTo("90");
        assertThat(result.trend()).hasSize(2);
    }
    @Test void ledgerRejectsMismatchedCustomerAndAccount(){
        when(auth.requirePermission("member:read")).thenReturn(principal("member",Set.of("member:read")));
        when(repository.customers(any(),any(),eq(true))).thenReturn(new Page<>(List.of(),0,1,20));
        assertThatThrownBy(()->service.ledger("member-22",query(null,"1"))).isInstanceOf(SecurityException.class);
        verify(repository,never()).ledger(any(),any());
    }
    @Test void exportsRequireSeparatePermission(){
        when(auth.requirePermission("report:export")).thenThrow(new SecurityException("无导出权限"));
        assertThatThrownBy(()->service.export(query(null,null))).isInstanceOf(SecurityException.class);
        verifyNoInteractions(repository);
    }
}
