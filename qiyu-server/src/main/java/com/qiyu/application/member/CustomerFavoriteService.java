package com.qiyu.application.member;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Coordinates customer-owned favorite queries and mutations. */
@Service
public class CustomerFavoriteService {
    private final AuthAppService authAppService;
    private final ObjectProvider<CustomerFavoriteRepository> repositoryProvider;

    public CustomerFavoriteService(AuthAppService authAppService, ObjectProvider<CustomerFavoriteRepository> repositoryProvider) {
        this.authAppService = authAppService;
        this.repositoryProvider = repositoryProvider;
    }

    /** Returns the persisted state for one supported resource owned by the current customer. */
    public FavoriteView get(String resourceType, String resourceId) {
        long customerId = currentCustomerId();
        String type = normalizeType(resourceType);
        boolean favorite = "stores".equals(type)
                ? repository().isFavoriteStore(customerId, resourceId)
                : repository().isFavoriteService(customerId, resourceId);
        return new FavoriteView(type, resourceId, favorite);
    }

    /** Restores or inserts a favorite without creating duplicate active rows. */
    @Transactional
    public FavoriteView add(String resourceType, String resourceId) {
        long customerId = currentCustomerId();
        String type = normalizeType(resourceType);
        if ("stores".equals(type)) repository().saveFavoriteStore(customerId, resourceId);
        else repository().saveFavoriteService(customerId, resourceId);
        return new FavoriteView(type, resourceId, true);
    }

    /** Soft-deletes only the current customer's matching favorite. */
    @Transactional
    public FavoriteView remove(String resourceType, String resourceId) {
        long customerId = currentCustomerId();
        String type = normalizeType(resourceType);
        if ("stores".equals(type)) repository().deleteFavoriteStore(customerId, resourceId);
        else repository().deleteFavoriteService(customerId, resourceId);
        return new FavoriteView(type, resourceId, false);
    }

    private long currentCustomerId() {
        AuthPrincipal principal = authAppService.requireCustomer();
        try {
            return Long.parseLong(principal.customerId());
        } catch (RuntimeException exception) {
            throw new IllegalStateException("当前登录账号未关联客户档案");
        }
    }

    private CustomerFavoriteRepository repository() {
        CustomerFavoriteRepository repository = repositoryProvider.getIfAvailable();
        if (repository == null) throw new IllegalStateException("当前运行模式未配置收藏持久化仓储");
        return repository;
    }

    private static String normalizeType(String resourceType) {
        if (!"stores".equals(resourceType) && !"services".equals(resourceType)) {
            throw new IllegalArgumentException("收藏资源类型不正确");
        }
        return resourceType;
    }

    public record FavoriteView(String resourceType, String resourceId, boolean favorite) {}
}
