package com.qiyu.infrastructure.catalog;

import com.qiyu.domain.catalog.Room;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;

import java.util.List;
import java.util.Map;

/** Maps deterministic mock rows to the same typed catalog contract as persistence mode. */
public final class MockCatalogMapper {
    private MockCatalogMapper() {}

    public static Store store(Map<String, Object> row) { return new Store(text(row,"id"), text(row,"name"), text(row,"address"), text(row,"phone"), decimal(row,"latitude"), decimal(row,"longitude"), text(row,"distance"), decimal(row,"rating"), text(row,"businessStatusCode"), text(row,"businessStatusLabel"), text(row,"nextAvailableAt"), text(row,"businessHours"), bool(row.get("frequent")), text(row,"coverImageUrl"), text(row,"galleryImageUrl"), strings(row.get("galleryImageUrls")), strings(row.get("facilities")), strings(row.get("highlights")), text(row,"memberBenefitText")); }
    public static ServiceItem service(Map<String, Object> row) { return new ServiceItem(text(row,"id"), text(row,"name"), integer(row,"durationMinutes"), integer(row,"preparationMinutes"), integer(row,"cleanupMinutes"), number(row,"price"), number(row,"memberPrice"), text(row,"category"), integer(row,"salesCount"), strings(row.get("tags")), text(row,"description"), strings(row.get("processSteps")), text(row,"suitableFor"), text(row,"notices"), text(row,"coverImageUrl"), text(row,"bannerImageUrl"), text(row,"image")); }
    public static Therapist therapist(Map<String, Object> row) { return new Therapist(text(row,"id"), text(row,"name"), text(row,"storeId"), text(row,"level"), decimal(row,"rating"), integer(row,"experienceYears"), integer(row,"serviceCount"), strings(row.get("skills")), number(row,"extraFee"), text(row,"nextAvailable"), text(row,"status"), text(row,"statusLabel"), text(row,"avatarUrl"), text(row,"portraitUrl"), text(row,"introduction")); }
    public static Room room(Map<String, Object> row) { return new Room(text(row,"id"), text(row,"name"), text(row,"storeId"), text(row,"status"), text(row,"statusLabel"), text(row,"type"), text(row,"note"), integer(row,"capacity"), text(row,"roomKind")); }
    private static String text(Map<String,Object> row,String key){Object v=row.get(key);return v==null?null:String.valueOf(v);}
    private static Integer integer(Map<String,Object> row,String key){Object v=row.get(key);return v instanceof Number n?n.intValue():null;}
    private static Number number(Map<String,Object> row,String key){Object v=row.get(key);return v instanceof Number n?n:null;}
    private static Double decimal(Map<String,Object> row,String key){Number v=number(row,key);return v==null?null:v.doubleValue();}
    private static boolean bool(Object v){return v instanceof Boolean b?b:v instanceof Number n&&n.intValue()!=0;}
    private static List<String> strings(Object value){if(value instanceof List<?> list)return list.stream().map(String::valueOf).toList();return value==null?List.of():List.of(String.valueOf(value));}
}
