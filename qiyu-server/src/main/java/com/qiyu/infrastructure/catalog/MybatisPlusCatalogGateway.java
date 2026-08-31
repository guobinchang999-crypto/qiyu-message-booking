package com.qiyu.infrastructure.catalog;

import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.catalog.Room;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;
import com.qiyu.infrastructure.persistence.mapper.CatalogMapper;
import com.qiyu.infrastructure.persistence.mapper.RoomCatalogRow;
import com.qiyu.infrastructure.persistence.mapper.ServiceCatalogRow;
import com.qiyu.infrastructure.persistence.mapper.StoreCatalogRow;
import com.qiyu.infrastructure.persistence.mapper.TherapistCatalogRow;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

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

    private static Store store(StoreCatalogRow row) { return new Store(row.id(), row.name(), row.address(), row.phone(), row.latitude(), row.longitude(), row.distance(), row.rating(), row.businessStatusCode(), row.businessStatusLabel(), row.nextAvailableAt(), row.businessHours(), row.frequent(), row.coverImageUrl(), row.galleryImageUrl(), split(row.galleryImageUrls()), split(row.facilities()), split(row.highlights()), row.memberBenefitText()); }
    private static ServiceItem service(ServiceCatalogRow row) { return new ServiceItem(row.id(), row.name(), row.durationMinutes(), row.preparationMinutes(), row.cleanupMinutes(), row.price(), row.memberPrice(), row.category(), row.salesCount(), split(row.tags()), row.description(), split(row.processSteps()), row.suitableFor(), row.notices(), row.coverImageUrl(), row.bannerImageUrl(), row.id()); }
    private static Therapist therapist(TherapistCatalogRow row) { return new Therapist(row.id(), row.name(), row.storeId(), row.level(), row.rating(), row.experienceYears(), row.serviceCount(), split(row.skills()), row.extraFee(), row.nextAvailable(), row.status(), row.statusLabel(), row.avatarUrl(), row.portraitUrl(), row.introduction()); }
    private static Room room(RoomCatalogRow row) { return new Room(row.id(), row.name(), row.storeId(), row.status(), row.statusLabel(), row.type(), row.note(), row.capacity(), row.roomKind()); }

    private static List<String> split(String value) {
        if (value == null || value.isBlank()) return List.of();
        List<String> result = new ArrayList<>();
        for (String item : value.split("[,，、\\n]")) {
            if (!item.isBlank()) result.add(item.trim());
        }
        return List.copyOf(result);
    }
}
