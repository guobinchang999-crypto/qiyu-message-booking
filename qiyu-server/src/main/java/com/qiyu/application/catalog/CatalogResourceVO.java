package com.qiyu.application.catalog;

import com.qiyu.domain.catalog.Room;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;

/** Converts domain catalog read models into the stable JSON shapes used by both clients. */
public final class CatalogResourceVO {
    private CatalogResourceVO() {}

    public static StoreVO store(Store value) {
        return new StoreVO(value.id(), value.name(), value.address(), value.phone(), value.latitude(),
                value.longitude(), value.distance(), value.rating(), value.businessStatusCode(),
                value.businessStatusLabel(), value.nextAvailableAt(), value.businessHours(),
                value.frequent(), value.coverImageUrl());
    }

    public static ServiceItemVO service(ServiceItem value) {
        return new ServiceItemVO(value.id(), value.name(), value.durationMinutes(), value.preparationMinutes(),
                value.cleanupMinutes(), value.price(), value.memberPrice(), value.category(), value.salesCount(),
                value.tags(), value.description(), value.processSteps(), value.suitableFor(), value.notices(),
                value.coverImageUrl(), value.bannerImageUrl(), value.image());
    }

    public static TherapistVO therapist(Therapist value) {
        return new TherapistVO(value.id(), value.name(), value.storeId(), value.level(), value.rating(),
                value.experienceYears(), value.skills(), value.extraFee(), value.nextAvailable(), value.status(),
                value.statusLabel(), value.avatarUrl(), value.portraitUrl(), value.introduction());
    }

    public static RoomVO room(Room value) {
        return new RoomVO(value.id(), value.name(), value.storeId(), value.status(), value.statusLabel(),
                value.type(), value.note(), value.capacity(), value.roomKind());
    }

    public record StoreVO(String id, String name, String address, String phone, Double latitude, Double longitude,
                          String distance, Double rating, String businessStatusCode, String businessStatusLabel,
                          String nextAvailableAt, String businessHours, boolean frequent, String coverImageUrl) {}

    public record ServiceItemVO(String id, String name, Integer durationMinutes, Integer preparationMinutes,
                                Integer cleanupMinutes, Number price, Number memberPrice, String category,
                                Integer salesCount, java.util.List<String> tags, String description,
                                java.util.List<String> processSteps, String suitableFor, String notices,
                                String coverImageUrl, String bannerImageUrl, String image) {}

    public record TherapistVO(String id, String name, String storeId, String level, Double rating,
                              Integer experienceYears, java.util.List<String> skills, Number extraFee,
                              String nextAvailable, String status, String statusLabel, String avatarUrl,
                              String portraitUrl, String introduction) {}

    public record RoomVO(String id, String name, String storeId, String status, String statusLabel,
                         String type, String note, Integer capacity, String roomKind) {}
}
