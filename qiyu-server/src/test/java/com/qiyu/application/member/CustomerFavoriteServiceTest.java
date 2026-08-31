package com.qiyu.application.member;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.domain.auth.DataScopeType;
import com.qiyu.domain.auth.UserType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Verifies that favorite operations always use the authenticated customer's ownership key. */
class CustomerFavoriteServiceTest {
    private CustomerFavoriteRepository repository;
    private CustomerFavoriteService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        AuthAppService authAppService = mock(AuthAppService.class);
        repository = mock(CustomerFavoriteRepository.class);
        ObjectProvider<CustomerFavoriteRepository> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(repository);
        when(authAppService.requireCustomer()).thenReturn(customerPrincipal());
        service = new CustomerFavoriteService(authAppService, provider);
    }

    /** Store state is queried with the customer ID resolved from the authenticated principal. */
    @Test
    void readsCustomerOwnedStoreFavorite() {
        when(repository.isFavoriteStore(21L, "store-jingan")).thenReturn(true);

        CustomerFavoriteService.FavoriteView result = service.get("stores", "store-jingan");

        assertThat(result.favorite()).isTrue();
        assertThat(result.resourceType()).isEqualTo("stores");
        verify(repository).isFavoriteStore(21L, "store-jingan");
    }

    /** Service favorites support idempotent add and customer-owned removal. */
    @Test
    void addsAndRemovesServiceFavorite() {
        assertThat(service.add("services", "service-neck-60").favorite()).isTrue();
        verify(repository).saveFavoriteService(21L, "service-neck-60");

        assertThat(service.remove("services", "service-neck-60").favorite()).isFalse();
        verify(repository).deleteFavoriteService(21L, "service-neck-60");
    }

    /** Unknown resource types fail before the repository can be queried or mutated. */
    @Test
    void rejectsUnknownFavoriteResourceType() {
        assertThatThrownBy(() -> service.get("therapists", "therapist-1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("收藏资源类型不正确");
        verifyNoInteractions(repository);
    }

    private static AuthPrincipal customerPrincipal() {
        return new AuthPrincipal(
                1001L, UserType.CUSTOMER, "21", null, Set.of("CUSTOMER"), Set.of(),
                DataScopeType.SELF, Set.of(), Set.of(), List.of(), Set.of(), "测试客户", "13800000000"
        );
    }
}
