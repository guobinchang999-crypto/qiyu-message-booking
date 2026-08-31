package com.qiyu.infrastructure.catalog;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qiyu.application.catalog.ClientCatalogGateway;
import com.qiyu.application.catalog.dto.ClientCatalogPayload;
import com.qiyu.infrastructure.persistence.mapper.CatalogMapper;
import com.qiyu.infrastructure.persistence.mapper.ClientCatalogConfigRow;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Loads persisted mini-program copy and dictionaries without exposing JSON maps to application code. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusClientCatalogGateway implements ClientCatalogGateway {
    private final CatalogMapper mapper;
    private final ObjectMapper objectMapper;

    public MybatisPlusClientCatalogGateway(CatalogMapper mapper, ObjectMapper objectMapper) {
        this.mapper = mapper;
        this.objectMapper = objectMapper;
    }

    @Override
    public ClientCatalogPayload clientCatalog() {
        List<ClientCatalogConfigRow> configurations = mapper.clientCatalogConfigurations();
        ClientCatalogPayload.ServiceDictionaries configuredServices = configuration(configurations, "serviceDictionaries", ClientCatalogPayload.ServiceDictionaries.class);
        List<String> serviceCategories = new ArrayList<>();
        serviceCategories.add(configuredServices.allCategory());
        serviceCategories.addAll(mapper.serviceCategories());
        ClientCatalogPayload.ServiceDictionaries services = configuredServices.withCategories(List.copyOf(serviceCategories));
        return new ClientCatalogPayload(
                configuration(configurations, "homeCopy", ClientCatalogPayload.HomeCopy.class),
                configuration(configurations, "loginCopy", ClientCatalogPayload.LoginCopy.class),
                configuration(configurations, "orderDictionaries", ClientCatalogPayload.OrderDictionaries.class),
                configuration(configurations, "reviewDictionaries", ClientCatalogPayload.ReviewDictionaries.class),
                services,
                configuration(configurations, "storeDetailDictionaries", ClientCatalogPayload.StoreDetailDictionaries.class),
                timeDictionaries(configuration(configurations, "timeDictionaries", ClientCatalogPayload.TimeDictionaries.class)),
                configuration(configurations, "therapistDictionaries", ClientCatalogPayload.TherapistDictionaries.class),
                configuration(configurations, "successCopy", ClientCatalogPayload.SuccessCopy.class),
                configuration(configurations, "profile", ClientCatalogPayload.Profile.class),
                configuration(configurations, "checkinDictionaries", ClientCatalogPayload.CheckinDictionaries.class),
                configuration(configurations, "actionFeedbackDictionaries", ClientCatalogPayload.ActionFeedbackDictionaries.class),
                configuration(configurations, "pageStateDictionaries", ClientCatalogPayload.PageStateDictionaries.class)
        );
    }

    /**
     * Replaces stored date labels with server-clock dates. Bookable dates are inherently dynamic,
     * so a persisted dictionary must never serve a stale or client-derived calendar.
     */
    private ClientCatalogPayload.TimeDictionaries timeDictionaries(ClientCatalogPayload.TimeDictionaries configured) {
        List<String> labels = new ArrayList<>();
        List<String> values = new ArrayList<>();
        LocalDate today = LocalDate.now();
        String[] weekdays = {"周日", "周一", "周二", "周三", "周四", "周五", "周六"};
        for (int offset = 0; offset < 7; offset++) {
            LocalDate date = today.plusDays(offset);
            labels.add((offset == 0 ? "今天" : weekdays[date.getDayOfWeek().getValue() % 7]) + "\n" + date.getMonthValue() + "月" + date.getDayOfMonth() + "日");
            values.add(date.toString());
        }
        return new ClientCatalogPayload.TimeDictionaries(labels, values, configured.periods(),
                configured.defaultPeriod(), configured.statusLabel(), configured.legend());
    }

    private <T> T configuration(List<ClientCatalogConfigRow> configurations, String code, Class<T> targetType) {
        String content = configurations.stream()
                .filter(configuration -> code.equals(configuration.configCode()))
                .map(ClientCatalogConfigRow::configJson)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("缺少客户端目录配置：" + code));
        try {
            return objectMapper.readValue(content, targetType);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("客户端目录配置格式错误：" + code, exception);
        }
    }
}
