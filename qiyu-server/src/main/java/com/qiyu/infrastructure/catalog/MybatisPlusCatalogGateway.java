package com.qiyu.infrastructure.catalog;

import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.catalog.Room;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;
import com.qiyu.infrastructure.persistence.mapper.CatalogMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Converts database catalog rows into the stable resource contract consumed by both frontends. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusCatalogGateway implements CatalogGateway {
    private final CatalogMapper mapper;

    public MybatisPlusCatalogGateway(CatalogMapper mapper) {
        this.mapper = mapper;
    }

    @Override public List<Store> stores() { return mapper.stores().stream().map(MybatisPlusCatalogGateway::store).toList(); }
    @Override public List<ServiceItem> services() { return mapper.services().stream().map(MybatisPlusCatalogGateway::service).toList(); }
    @Override public List<Therapist> therapists() { return therapists(null, null); }
    @Override public List<Room> rooms() { return rooms(null, null); }
    @Override public Store findStore(String id) { return stores().stream().filter(value -> id.equals(value.id())).findFirst().orElseThrow(() -> new IllegalArgumentException("门店不存在")); }
    @Override public ServiceItem findService(String id) { return services().stream().filter(value -> id.equals(value.id())).findFirst().orElseThrow(() -> new IllegalArgumentException("服务项目不存在")); }
    @Override public Therapist findTherapist(String id) { return therapists().stream().filter(value -> id.equals(value.id())).findFirst().orElseThrow(() -> new IllegalArgumentException("技师不存在")); }
    @Override public Room findRoom(String id) { return rooms().stream().filter(value -> id.equals(value.id())).findFirst().orElseThrow(() -> new IllegalArgumentException("房间不存在")); }
    @Override public List<Therapist> therapists(String storeId, String serviceId) { return mapper.therapists(storeId, serviceId).stream().map(MybatisPlusCatalogGateway::therapist).toList(); }
    @Override public List<Room> rooms(String storeId, String status) { return mapper.rooms(storeId, status).stream().map(MybatisPlusCatalogGateway::room).toList(); }

    private static Store store(Map<String, Object> row) { return new Store(text(row,"id"), text(row,"name"), text(row,"address"), text(row,"phone"), decimal(row,"latitude"), decimal(row,"longitude"), text(row,"distance"), decimal(row,"rating"), text(row,"businessStatusCode"), text(row,"businessStatusLabel"), text(row,"nextAvailableAt"), text(row,"businessHours"), booleanValue(row.get("frequent")), text(row,"coverImageUrl")); }
    private static ServiceItem service(Map<String, Object> row) { return new ServiceItem(text(row,"id"), text(row,"name"), integer(row,"durationMinutes"), integer(row,"preparationMinutes"), integer(row,"cleanupMinutes"), number(row,"price"), number(row,"memberPrice"), text(row,"category"), integer(row,"salesCount"), split(row.get("tags")), text(row,"description"), split(row.get("processSteps")), text(row,"suitableFor"), text(row,"notices"), text(row,"coverImageUrl"), text(row,"bannerImageUrl"), text(row,"id")); }
    private static Therapist therapist(Map<String, Object> row) { return new Therapist(text(row,"id"), text(row,"name"), text(row,"storeId"), text(row,"level"), decimal(row,"rating"), integer(row,"experienceYears"), split(row.get("skills")), number(row,"extraFee"), text(row,"nextAvailable"), text(row,"status"), text(row,"statusLabel"), text(row,"avatarUrl"), text(row,"portraitUrl"), text(row,"introduction")); }
    private static Room room(Map<String, Object> row) { return new Room(text(row,"id"), text(row,"name"), text(row,"storeId"), text(row,"status"), text(row,"statusLabel"), text(row,"type"), text(row,"note"), integer(row,"capacity"), text(row,"roomKind")); }

    private static boolean booleanValue(Object value) {
        return value instanceof Boolean bool ? bool : value instanceof Number number && number.intValue() != 0;
    }

    private static List<String> split(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return List.of();
        List<String> result = new ArrayList<>();
        for (String item : String.valueOf(value).split("[,，、\\n]")) {
            if (!item.isBlank()) result.add(item.trim());
        }
        return List.copyOf(result);
    }

    private static String text(Map<String,Object> row, String key) { Object value=row.get(key); return value == null ? null : String.valueOf(value); }
    private static Integer integer(Map<String,Object> row, String key) { Object value=row.get(key); return value instanceof Number n ? n.intValue() : null; }
    private static Number number(Map<String,Object> row, String key) { Object value=row.get(key); return value instanceof Number n ? n : null; }
    private static Double decimal(Map<String,Object> row, String key) { Number value=number(row,key); return value == null ? null : value.doubleValue(); }
}
