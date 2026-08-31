package com.qiyu.infrastructure.catalog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qiyu.application.catalog.ClientCatalogGateway;
import com.qiyu.application.catalog.ClientCatalogPayload;
import com.qiyu.infrastructure.mock.MockCatalogProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

/** Keeps the legacy in-memory content available only when persistence mode is explicitly disabled. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class MockClientCatalogGateway implements ClientCatalogGateway {
    private final MockCatalogProvider provider;
    private final ObjectMapper objectMapper;

    public MockClientCatalogGateway(MockCatalogProvider provider, ObjectMapper objectMapper) {
        this.provider = provider;
        this.objectMapper = objectMapper;
    }

    @Override
    public ClientCatalogPayload clientCatalog() {
        return new ClientCatalogPayload(
                convert(provider.homeCopy(), ClientCatalogPayload.HomeCopy.class),
                convert(provider.loginCopy(), ClientCatalogPayload.LoginCopy.class),
                ClientCatalogPayload.OrderDictionaries.mockDefault(),
                convert(provider.reviewDictionaries(), ClientCatalogPayload.ReviewDictionaries.class),
                convert(provider.serviceDictionaries(), ClientCatalogPayload.ServiceDictionaries.class),
                convert(provider.storeDetailDictionaries(), ClientCatalogPayload.StoreDetailDictionaries.class),
                convert(provider.timeDictionaries(), ClientCatalogPayload.TimeDictionaries.class),
                convert(provider.therapistDictionaries(), ClientCatalogPayload.TherapistDictionaries.class),
                convert(provider.successCopy(), ClientCatalogPayload.SuccessCopy.class),
                convert(provider.profile(), ClientCatalogPayload.Profile.class),
                convert(provider.checkinDictionaries(), ClientCatalogPayload.CheckinDictionaries.class),
                convert(provider.actionFeedbackDictionaries(), ClientCatalogPayload.ActionFeedbackDictionaries.class),
                convert(provider.pageStateDictionaries(), ClientCatalogPayload.PageStateDictionaries.class)
        );
    }

    private <T> T convert(Object source, Class<T> targetType) {
        return objectMapper.convertValue(source, targetType);
    }
}
