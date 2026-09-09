package com.qiyu.application.catalog;

import com.qiyu.application.catalog.dto.ClientCatalogPayload;

import com.qiyu.application.catalog.dto.CatalogResourceVO;
import com.qiyu.application.catalog.dto.DictionaryCollectionVO;
import com.qiyu.application.catalog.dto.DictionaryItemVO;
import com.qiyu.application.catalog.dto.ResourceOptionVO;

import com.qiyu.domain.booking.BookingStatus;
import com.qiyu.domain.payment.PaymentStatus;
import com.qiyu.domain.room.RoomStatus;
import com.qiyu.domain.schedule.TimeSlotStatus;
import com.qiyu.domain.therapist.TherapistStatus;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.infrastructure.persistence.mapper.CatalogMapper;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class CatalogQueryService {
    private static final String BOOKING_STATUS = "bookingStatus";
    private static final String PAYMENT_STATUS = "paymentStatus";
    private static final String ROOM_STATUS = "roomStatus";
    private static final String THERAPIST_STATUS = "therapistStatus";
    private static final String TIME_SLOT_STATUS = "timeSlotStatus";

    private final ClientCatalogGateway clientCatalogGateway;
    private final CatalogGateway catalogGateway;
    private final CatalogMapper catalogMapper;

    public CatalogQueryService(ClientCatalogGateway clientCatalogGateway, CatalogGateway catalogGateway,
                               CatalogMapper catalogMapper) {
        this.clientCatalogGateway = clientCatalogGateway;
        this.catalogGateway = catalogGateway;
        this.catalogMapper = catalogMapper;
    }

    /** Returns all supported system dictionaries with a stable, typed JSON shape. */
    public DictionaryCollectionVO dictionaries() {
        return new DictionaryCollectionVO(bookingStatuses(), paymentStatuses(), roomStatuses(), therapistStatuses(), timeSlotStatuses());
    }

    /** Returns one supported dictionary and rejects unknown dictionary codes. */
    public List<DictionaryItemVO> dictionary(String type) {
        return switch (type) {
            case BOOKING_STATUS -> bookingStatuses();
            case PAYMENT_STATUS -> paymentStatuses();
            case ROOM_STATUS -> roomStatuses();
            case THERAPIST_STATUS -> therapistStatuses();
            case TIME_SLOT_STATUS -> timeSlotStatuses();
            default -> throw new IllegalArgumentException("不支持的字典类型");
        };
    }

    /** Returns the client catalog payload from the active content source. */
    public ClientCatalogPayload clientCatalog() {
        return clientCatalogGateway.clientCatalog();
    }

    /** Returns stores as selectable resources for authorized booking workflows. */
    public List<ResourceOptionVO> storeOptions() {
        return catalogGateway.stores().stream()
                .map(item -> new ResourceOptionVO(item.id(), item.name(), null, null, null))
                .toList();
    }

    /** Returns service options for selection controls. */
    public List<ResourceOptionVO> serviceOptions() {
        return catalogGateway.services().stream()
                .map(item -> new ResourceOptionVO(item.id(), item.name(), null, null, null))
                .toList();
    }

    /** Returns therapist options constrained by store and service capability. */
    public List<ResourceOptionVO> therapistOptions(String storeId, String serviceId) {
        return catalogGateway.therapists(storeId, serviceId).stream()
                .map(item -> new ResourceOptionVO(item.id(), item.name(), item.storeId(), item.status(), item.statusLabel()))
                .toList();
    }

    /** Returns room options constrained by store and room status. */
    public List<ResourceOptionVO> roomOptions(String storeId, String status) {
        return catalogGateway.rooms(storeId, status).stream()
                .map(item -> new ResourceOptionVO(item.id(), item.name(), item.storeId(), item.status(), item.statusLabel()))
                .toList();
    }

    /** Returns enabled operating regions as selectable resources for the store form. */
    public List<ResourceOptionVO> regionOptions() {
        return catalogMapper.regionOptions().stream()
                .map(item -> new ResourceOptionVO(item.id(), item.name(), null, null, null))
                .toList();
    }

    /** Returns the typed store read models used by the store endpoints. */
    public List<CatalogResourceVO.StoreVO> stores() { return catalogGateway.stores().stream().map(CatalogResourceVO::store).toList(); }

    /** Returns one typed store model or raises a business error when it does not exist. */
    public CatalogResourceVO.StoreVO store(String id) { return CatalogResourceVO.store(catalogGateway.findStore(id)); }

    /** Returns all bookable service items. */
    public List<CatalogResourceVO.ServiceItemVO> services() { return catalogGateway.services().stream().map(CatalogResourceVO::service).toList(); }

    /** Returns one typed service item for the service detail page. */
    public CatalogResourceVO.ServiceItemVO service(String id) { return CatalogResourceVO.service(catalogGateway.findService(id)); }

    /** Returns therapists filtered by store and service capability. */
    public List<CatalogResourceVO.TherapistVO> therapists(String storeId, String serviceId) {
        return catalogGateway.therapists(storeId, serviceId).stream().map(CatalogResourceVO::therapist).toList();
    }

    private static List<DictionaryItemVO> bookingStatuses() {
        return Arrays.stream(BookingStatus.values()).map(item -> new DictionaryItemVO(item.name(), item.label())).toList();
    }

    private static List<DictionaryItemVO> paymentStatuses() {
        return Arrays.stream(PaymentStatus.values()).map(item -> new DictionaryItemVO(item.name(), item.label())).toList();
    }

    private static List<DictionaryItemVO> roomStatuses() {
        return Arrays.stream(RoomStatus.values()).map(item -> new DictionaryItemVO(item.name(), item.label())).toList();
    }

    private static List<DictionaryItemVO> therapistStatuses() {
        return Arrays.stream(TherapistStatus.values()).map(item -> new DictionaryItemVO(item.name(), item.label())).toList();
    }

    private static List<DictionaryItemVO> timeSlotStatuses() {
        return Arrays.stream(TimeSlotStatus.values()).map(item -> new DictionaryItemVO(item.name(), item.label())).toList();
    }

}
