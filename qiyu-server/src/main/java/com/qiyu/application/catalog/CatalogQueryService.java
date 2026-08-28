package com.qiyu.application.catalog;

import com.qiyu.domain.booking.BookingStatus;
import com.qiyu.domain.payment.PaymentStatus;
import com.qiyu.domain.room.RoomStatus;
import com.qiyu.domain.schedule.TimeSlotStatus;
import com.qiyu.domain.therapist.TherapistStatus;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.infrastructure.mock.MockCatalogProvider;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CatalogQueryService {
    private static final String BOOKING_STATUS = "bookingStatus";
    private static final String PAYMENT_STATUS = "paymentStatus";
    private static final String ROOM_STATUS = "roomStatus";
    private static final String THERAPIST_STATUS = "therapistStatus";
    private static final String TIME_SLOT_STATUS = "timeSlotStatus";

    private final MockCatalogProvider catalogProvider;
    private final CatalogGateway catalogGateway;

    public CatalogQueryService(MockCatalogProvider catalogProvider, CatalogGateway catalogGateway) {
        this.catalogProvider = catalogProvider;
        this.catalogGateway = catalogGateway;
    }

    public Map<String, List<DictionaryItemVO>> dictionaries() {
        Map<String, List<DictionaryItemVO>> result = new LinkedHashMap<>();
        result.put(BOOKING_STATUS, bookingStatuses());
        result.put(PAYMENT_STATUS, paymentStatuses());
        result.put(ROOM_STATUS, roomStatuses());
        result.put(THERAPIST_STATUS, therapistStatuses());
        result.put(TIME_SLOT_STATUS, timeSlotStatuses());
        return result;
    }

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

    public ClientCatalogPayload clientCatalog() {
        return new ClientCatalogPayload(
                catalogProvider.homeCopy(),
                catalogProvider.loginCopy(),
                orderDictionaries(),
                catalogProvider.reviewDictionaries(),
                catalogProvider.serviceDictionaries(),
                catalogProvider.storeDetailDictionaries(),
                catalogProvider.timeDictionaries(),
                catalogProvider.therapistDictionaries(),
                catalogProvider.successCopy(),
                catalogProvider.profile(),
                catalogProvider.checkinDictionaries(),
                catalogProvider.actionFeedbackDictionaries(),
                catalogProvider.pageStateDictionaries()
        );
    }

    public List<ResourceOptionVO> storeOptions() {
        return catalogGateway.stores().stream()
                .map(item -> option(item, null, null, null))
                .toList();
    }

    public List<ResourceOptionVO> serviceOptions() {
        return catalogGateway.services().stream()
                .map(item -> option(item, null, null, null))
                .toList();
    }

    public List<ResourceOptionVO> therapistOptions(String storeId, String serviceId) {
        return catalogGateway.therapists(storeId, serviceId).stream()
                .map(item -> option(item, stringValue(item, "storeId"), stringValue(item, "status"), stringValue(item, "statusLabel")))
                .toList();
    }

    public List<ResourceOptionVO> roomOptions(String storeId, String status) {
        return catalogGateway.rooms(storeId, status).stream()
                .map(item -> option(item, stringValue(item, "storeId"), stringValue(item, "status"), stringValue(item, "statusLabel")))
                .toList();
    }

    public List<Map<String, Object>> stores() { return catalogGateway.stores(); }

    public Map<String, Object> store(String id) { return catalogGateway.findStore(id); }

    public List<Map<String, Object>> services() { return catalogGateway.services(); }

    public Map<String, Object> service(String id) { return catalogGateway.findService(id); }

    public List<Map<String, Object>> therapists(String storeId, String serviceId) {
        return catalogGateway.therapists(storeId, serviceId);
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

    private static Map<String, Object> orderDictionaries() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("pageTitle", "我的订单");
        result.put("detailTitle", "预约详情");
        result.put("statusLabel", labelMap(bookingStatuses()));
        result.put("actionLabel", new LinkedHashMap<>(Map.ofEntries(
                Map.entry("pay", "支付订金"),
                Map.entry("cancel", "取消"),
                Map.entry("reschedule", "改期"),
                Map.entry("contact", "联系门店"),
                Map.entry("show_code", "签到码"),
                Map.entry("refresh_code", "刷新码"),
                Map.entry("rebook", "再次预约"),
                Map.entry("review", "去评价"),
                Map.entry("view_detail", "查看详情")
        )));
        result.put("tabs", List.of(
                Map.of("key", "all", "label", "全部"),
                Map.of("key", "pending_payment", "label", "待支付", "statuses", List.of("PENDING_PAYMENT")),
                Map.of("key", "arriving", "label", "待到店", "statuses", List.of("BOOKED", "CHECKED_IN")),
                Map.of("key", "in_service", "label", "服务中", "statuses", List.of("WAITING_SERVICE", "IN_SERVICE", "PENDING_SETTLEMENT")),
                Map.of("key", "completed", "label", "已完成", "statuses", List.of("COMPLETED")),
                Map.of("key", "cancelled", "label", "已取消", "statuses", List.of("CANCELLED"))
        ));
        result.put("detailSteps", List.of("已预约", "待到店", "服务中", "已完成"));
        result.put("codeTitle", "栖愈\n预约码");
        result.put("codeHint", "请向前台出示二维码或数字码");
        result.put("codeExtraHint", "请在到店当日出示，过期后可刷新预约详情。");
        result.put("detailFields", Map.of(
                "service", "服务项目",
                "therapist", "技师",
                "scheduledAt", "预约时间",
                "contact", "预约人"
        ));
        result.put("paymentTitle", "支付信息");
        result.put("paymentFields", Map.of(
                "item", "项目金额",
                "therapist", "指定技师",
                "discount", "优惠抵扣",
                "paid", "已支付"
        ));
        result.put("actionSectionTitle", "可用操作");
        result.put("checkinButtonText", "到店签到");
        result.put("cancelModalTitle", "取消预约");
        result.put("cancelModalContent", "确认取消该预约？取消后将释放当前时间。");
        result.put("cancelModalConfirmText", "取消预约");
        result.put("cancelSuccessToastText", "预约已取消");
        result.put("paySuccessToastText", "订金支付成功");
        result.put("payFailureToastText", "支付失败，请稍后重试");
        result.put("cardMeta", Map.of("paidPrefix", "实付"));
        result.put("serviceCardMeta", Map.of("durationUnit", "分钟", "servedPrefix", "已服务", "servedSuffix", "次"));
        result.put("storeCardMeta", Map.of("ratingUnit", "分", "nextAvailablePrefix", "最近可约"));
        return result;
    }

    private static Map<String, String> labelMap(List<DictionaryItemVO> items) {
        Map<String, String> result = new LinkedHashMap<>();
        for (DictionaryItemVO item : items) {
            result.put(item.value(), item.label());
        }
        return result;
    }

    private static ResourceOptionVO option(Map<String, Object> item, String storeId, String status, String statusLabel) {
        return new ResourceOptionVO(stringValue(item, "id"), stringValue(item, "name"), storeId, status, statusLabel);
    }

    private static String stringValue(Map<String, Object> item, String key) {
        Object value = item.get(key);
        return value == null ? null : String.valueOf(value);
    }
}
