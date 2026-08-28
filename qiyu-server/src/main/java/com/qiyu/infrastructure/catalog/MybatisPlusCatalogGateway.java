package com.qiyu.infrastructure.catalog;

import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.infrastructure.persistence.mapper.CatalogMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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

    @Override public List<Map<String, Object>> stores() { return normalize(mapper.stores(), ResourceType.STORE); }
    @Override public List<Map<String, Object>> services() { return normalize(mapper.services(), ResourceType.SERVICE); }
    @Override public List<Map<String, Object>> therapists() { return therapists(null, null); }
    @Override public List<Map<String, Object>> rooms() { return rooms(null, null); }
    @Override public Map<String, Object> findStore(String id) { return find(stores(), id, "门店不存在"); }
    @Override public Map<String, Object> findService(String id) { return find(services(), id, "服务项目不存在"); }
    @Override public Map<String, Object> findTherapist(String id) { return find(therapists(), id, "技师不存在"); }
    @Override public Map<String, Object> findRoom(String id) { return find(rooms(), id, "房间不存在"); }
    @Override public List<Map<String, Object>> therapists(String storeId, String serviceId) { return normalize(mapper.therapists(storeId, serviceId), ResourceType.THERAPIST); }
    @Override public List<Map<String, Object>> rooms(String storeId, String status) { return normalize(mapper.rooms(storeId, status), ResourceType.ROOM); }

    private static List<Map<String, Object>> normalize(List<Map<String, Object>> rows, ResourceType type) {
        return rows.stream().map(row -> normalizeRow(row, type)).toList();
    }

    private static Map<String, Object> normalizeRow(Map<String, Object> source, ResourceType type) {
        Map<String, Object> row = new LinkedHashMap<>(source);
        if (type == ResourceType.STORE) {
            row.put("frequent", booleanValue(row.get("frequent")));
        }
        if (type == ResourceType.SERVICE) {
            row.put("tags", split(row.get("tags")));
            row.put("processSteps", split(row.get("processSteps")));
            row.put("image", row.get("id"));
        }
        if (type == ResourceType.THERAPIST) {
            row.put("skills", split(row.get("skills")));
        }
        // JSON numbers should match the existing frontend contract instead of exposing BigDecimal.
        for (String key : List.of("price", "memberPrice", "extraFee")) {
            if (row.get(key) instanceof BigDecimal value) {
                BigDecimal normalized = value.stripTrailingZeros();
                row.put(key, normalized.scale() <= 0 ? normalized.intValueExact() : normalized.doubleValue());
            }
        }
        return row;
    }

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

    private static Map<String, Object> find(List<Map<String, Object>> rows, String id, String message) {
        return rows.stream().filter(row -> id != null && id.equals(row.get("id"))).findFirst()
                .orElseThrow(() -> new IllegalArgumentException(message));
    }

    private enum ResourceType { STORE, SERVICE, THERAPIST, ROOM }
}
