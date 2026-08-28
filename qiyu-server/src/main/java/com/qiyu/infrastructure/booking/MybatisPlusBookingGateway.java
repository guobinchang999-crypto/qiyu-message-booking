package com.qiyu.infrastructure.booking;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingStatus;
import com.qiyu.domain.booking.gateway.BookingGateway;
import com.qiyu.infrastructure.persistence.entity.BookingEntity;
import com.qiyu.infrastructure.persistence.mapper.BookingMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Optional;

/** Maps the booking aggregate to MyBatis-Plus persistence objects without leaking ORM types into domain code. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusBookingGateway implements BookingGateway {
    private final BookingMapper mapper;

    public MybatisPlusBookingGateway(BookingMapper mapper) { this.mapper = mapper; }

    @Override
    public Collection<Booking> findAll() {
        return mapper.selectList(new LambdaQueryWrapper<BookingEntity>().orderByDesc(BookingEntity::getScheduledStartAt))
                .stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Booking> findById(String id) {
        BookingEntity entity = mapper.selectOne(new LambdaQueryWrapper<BookingEntity>().eq(BookingEntity::getBookingNo, id));
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    @Transactional
    public Booking save(Booking booking) {
        BookingEntity entity = mapper.selectOne(new LambdaQueryWrapper<BookingEntity>().eq(BookingEntity::getBookingNo, booking.id()));
        if (entity == null) entity = new BookingEntity();
        Long storeId = required(mapper.storeId(storeCode(booking.storeId())), "门店不存在");
        Long serviceId = required(mapper.serviceId(serviceCode(booking.serviceId())), "服务项目不存在");
        entity.setBookingNo(booking.id());
        entity.setCustomerId(Long.valueOf(booking.customerId()));
        entity.setStoreId(storeId);
        entity.setServiceItemId(serviceId);
        entity.setTherapistId(mapper.therapistId(therapistCode(booking.therapistId())));
        entity.setTherapistMode(entity.getTherapistId() == null ? "AUTO" : "SPECIFIED");
        entity.setRoomId(mapper.roomId(storeId, roomCode(booking.roomId())));
        entity.setScheduledStartAt(booking.timeRange().serviceFrom());
        entity.setScheduledEndAt(booking.timeRange().serviceTo());
        entity.setOccupiedStartAt(booking.timeRange().occupiedFrom());
        entity.setOccupiedEndAt(booking.timeRange().occupiedTo());
        entity.setGuestCount(1);
        entity.setContactName(booking.customerName());
        entity.setContactMobile(booking.mobile());
        entity.setBookingSource("MINI_PROGRAM");
        entity.setStatus(booking.status().name());
        entity.setItemAmount(mapper.memberPrice(serviceId));
        Long currentBookingId = entity.getId();
        if (!BookingStatus.CANCELLED.equals(booking.status())) {
            if (!mapper.lockConflicts("THERAPIST", required(mapper.therapistId(therapistCode(booking.therapistId())), "技师不存在"),
                    booking.timeRange().occupiedFrom(), booking.timeRange().occupiedTo(), currentBookingId).isEmpty()) {
                throw new IllegalArgumentException("所选技师在该时段已有预约");
            }
            if (entity.getRoomId() != null && !mapper.lockConflicts("ROOM", entity.getRoomId(),
                    booking.timeRange().occupiedFrom(), booking.timeRange().occupiedTo(), currentBookingId).isEmpty()) {
                throw new IllegalArgumentException("所选房间在该时段已有预约");
            }
        }
        if (entity.getId() == null) {
            entity.setTherapistFeeAmount(java.math.BigDecimal.ZERO);
            entity.setDiscountAmount(java.math.BigDecimal.ZERO);
            entity.setBalanceDeductionAmount(java.math.BigDecimal.ZERO);
            entity.setDepositDueAmount(java.math.BigDecimal.ZERO);
            entity.setPaidAmount(java.math.BigDecimal.ZERO);
            entity.setCreatedByUserId(mapper.customerUserId(entity.getCustomerId()));
            mapper.insert(entity);
        } else mapper.updateById(entity);
        mapper.releaseOccupations(entity.getId());
        if (!BookingStatus.CANCELLED.equals(booking.status())) {
            Long therapistId = mapper.therapistId(therapistCode(booking.therapistId()));
            if (therapistId != null) mapper.insertOccupation("THERAPIST", therapistId, storeId, entity.getId(),
                    booking.timeRange().occupiedFrom(), booking.timeRange().occupiedTo(), "OCCUPIED");
            if (entity.getRoomId() != null) mapper.insertOccupation("ROOM", entity.getRoomId(), storeId, entity.getId(),
                    booking.timeRange().occupiedFrom(), booking.timeRange().occupiedTo(), "OCCUPIED");
        }
        mapper.upsertCheckin(entity.getId(), booking.verificationCode(), booking.status() == BookingStatus.CHECKED_IN ? "CHECKED_IN" : "WAITING");
        return booking;
    }

    private Booking toDomain(BookingEntity entity) {
        String storeId = storeApiId(mapper.storeCode(entity.getStoreId()));
        int duration = Math.toIntExact(ChronoUnit.MINUTES.between(entity.getScheduledStartAt(), entity.getScheduledEndAt()));
        return new Booking(entity.getBookingNo(), storeId, serviceApiId(mapper.serviceCode(entity.getServiceItemId())),
                therapistApiId(entity.getTherapistId() == null ? null : mapper.therapistCode(entity.getTherapistId())),
                roomApiId(storeId, entity.getRoomId() == null ? null : mapper.roomCode(entity.getRoomId())), entity.getContactName(),
                entity.getContactMobile(), String.valueOf(entity.getCustomerId()), entity.getScheduledStartAt().toLocalDate(),
                entity.getScheduledStartAt().toLocalTime(), duration, BookingStatus.valueOf(entity.getStatus()), mapper.checkinCode(entity.getId()));
    }

    private static <T> T required(T value, String message) { if (value == null) throw new IllegalArgumentException(message); return value; }
    private static String storeCode(String id) { return id.replace("store-", "").replace('-', '_').toUpperCase(); }
    private static String serviceCode(String id) { return switch (id) { case "service-neck" -> "NECK_60"; case "service-tui-na" -> "TUINA_90"; case "service-spa" -> "AROMA_90"; default -> id.replace("service-", "").toUpperCase(); }; }
    private static String therapistCode(String id) { return switch (id) { case "therapist-anran" -> "TH_JA_ANRAN"; case "therapist-yuanyuan" -> "TH_XH_YUANYUAN"; case "therapist-lin" -> "TH_LJZ_LIN"; default -> id == null ? "" : id.replace("therapist-", "TH_").replace('-', '_').toUpperCase(); }; }
    private static String roomCode(String id) { if (id == null) return ""; return "R" + id.substring(id.lastIndexOf('-') + 1); }
    private static String storeApiId(String code) { return "store-" + code.toLowerCase().replace('_', '-'); }
    private static String serviceApiId(String code) { return switch (code) { case "NECK_60" -> "service-neck"; case "TUINA_90" -> "service-tui-na"; case "AROMA_90" -> "service-spa"; default -> "service-" + code.toLowerCase().replace('_', '-'); }; }
    private static String therapistApiId(String code) { return switch (code == null ? "" : code) { case "TH_JA_ANRAN" -> "therapist-anran"; case "TH_XH_YUANYUAN" -> "therapist-yuanyuan"; case "TH_LJZ_LIN" -> "therapist-lin"; default -> code == null ? null : "therapist-" + code.toLowerCase().replace('_', '-'); }; }
    private static String roomApiId(String storeId, String code) { return code == null ? null : "room-" + storeId.substring(6) + "-" + code.substring(1); }
}
