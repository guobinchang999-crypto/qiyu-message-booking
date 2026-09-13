package com.qiyu.application.coupon;
import com.qiyu.application.auth.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class CouponRulesProtectionTest {
    @Test @SuppressWarnings("unchecked") void issuedCouponCanEndButItsDiscountCannotChange(){
        var auth=mock(AuthAppService.class);var repository=mock(CouponManagementRepository.class);
        ObjectProvider<CouponManagementRepository> provider=mock(ObjectProvider.class);when(provider.getIfAvailable()).thenReturn(repository);
        when(auth.requirePermission("coupon:manage")).thenReturn(new AuthPrincipal(1,com.qiyu.domain.auth.UserType.STAFF,null,null,
            Set.of("HQ_ADMIN"),Set.of("*"),com.qiyu.domain.auth.DataScopeType.ALL_STORES,Set.of(),Set.of(),List.of(),Set.of(),"测试管理员",null));
        var start=LocalDateTime.of(2026,9,1,0,0);var end=start.plusMonths(1);
        var current=new CouponManagementRepository.CouponTemplate(1L,"coupon-test","TEST","测试","FIXED",BigDecimal.TEN,null,BigDecimal.ZERO,start,end,1,0,"ACTIVE","1","1");
        when(repository.find("coupon-test")).thenReturn(Optional.of(current));
        when(repository.save(any())).thenAnswer(i->i.getArgument(0));
        var service=new CouponManagementService(auth,provider);
        assertThatThrownBy(()->service.update("coupon-test",new CouponManagementService.CouponCommand("TEST","测试","FIXED",new BigDecimal("20"),null,BigDecimal.ZERO,start,end,"ACTIVE"))).isInstanceOf(IllegalArgumentException.class);
        var ended=service.update("coupon-test",new CouponManagementService.CouponCommand("TEST","测试","FIXED",new BigDecimal("10.00"),null,BigDecimal.ZERO,start,end,"ENDED"));
        assertThat(ended.status()).isEqualTo("ENDED");
    }
}
