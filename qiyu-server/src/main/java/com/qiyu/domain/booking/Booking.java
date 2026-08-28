package com.qiyu.domain.booking;

import com.qiyu.domain.schedule.BookingTimeRange;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Booking aggregate and the single authority for lifecycle transitions.
 *
 * <p>Store, service, therapist and room references are stable identifiers rather than display
 * names. This keeps authorization and resource-conflict checks valid when names change.</p>
 */
public final class Booking {
    private final String id;
    private final String storeId;
    private final String serviceId;
    private final String therapistId;
    private final String roomId;
    private final String customerName;
    private final String mobile;
    private final String customerId;
    private String verificationCode;
    private BookingTimeRange timeRange;
    private BookingStatus status;

    public Booking(String id, String storeId, String serviceId, String therapistId, String roomId,
                   String customerName, String mobile, LocalDate date, LocalTime startTime, int durationMinutes,
                   BookingStatus status) {
        this(id, storeId, serviceId, therapistId, roomId, customerName, mobile, "customer-demo", date, startTime, durationMinutes, status);
    }

    public Booking(String id, String storeId, String serviceId, String therapistId, String roomId,
                   String customerName, String mobile, String customerId, LocalDate date, LocalTime startTime,
                   int durationMinutes, BookingStatus status) {
        this(id, storeId, serviceId, therapistId, roomId, customerName, mobile, customerId, date, startTime,
                durationMinutes, status, generateVerificationCode());
    }

    public Booking(String id, String storeId, String serviceId, String therapistId, String roomId,
                   String customerName, String mobile, String customerId, LocalDate date, LocalTime startTime,
                   int durationMinutes, BookingStatus status, String verificationCode) {
        this.id = id;
        this.storeId = storeId;
        this.serviceId = serviceId;
        this.therapistId = therapistId;
        this.roomId = roomId;
        this.customerName = customerName;
        this.mobile = mobile;
        this.customerId = customerId;
        this.verificationCode = verificationCode == null || verificationCode.isBlank() ? generateVerificationCode() : verificationCode;
        this.timeRange = BookingTimeRange.of(date, startTime, durationMinutes, 10, 10);
        this.status = status;
    }

    public void checkIn() {
        // Check-in is only meaningful after the deposit has secured the reservation.
        if (status != BookingStatus.BOOKED) {
            throw new IllegalArgumentException("当前预约状态不可签到");
        }
        status = BookingStatus.CHECKED_IN;
    }

    public void cancel() {
        if (status != BookingStatus.PENDING_PAYMENT && status != BookingStatus.BOOKED) {
            throw new IllegalArgumentException("当前预约状态不可取消");
        }
        status = BookingStatus.CANCELLED;
    }

    public void payDeposit() {
        if (status != BookingStatus.PENDING_PAYMENT) {
            throw new IllegalArgumentException("当前预约状态不可支付");
        }
        status = BookingStatus.BOOKED;
    }

    public void startService() {
        // WAITING_SERVICE supports stores that explicitly queue checked-in customers.
        if (status != BookingStatus.CHECKED_IN && status != BookingStatus.WAITING_SERVICE) {
            throw new IllegalArgumentException("当前预约状态不可开始服务");
        }
        status = BookingStatus.IN_SERVICE;
    }

    public void finishService() {
        if (status != BookingStatus.IN_SERVICE) {
            throw new IllegalArgumentException("当前预约状态不可结束服务");
        }
        status = BookingStatus.PENDING_SETTLEMENT;
    }

    public void completeSettlement() {
        if (status != BookingStatus.PENDING_SETTLEMENT) {
            throw new IllegalArgumentException("当前预约状态不可完成结算");
        }
        status = BookingStatus.COMPLETED;
    }

    public void reschedule(LocalDate date, LocalTime startTime, int durationMinutes) {
        if (status != BookingStatus.BOOKED) {
            throw new IllegalArgumentException("当前预约状态不可改期");
        }
        // Preparation and cleanup buffers are part of resource occupancy, not presentation data.
        this.timeRange = BookingTimeRange.of(date, startTime, durationMinutes, 10, 10);
    }

    public void refreshVerificationCode() {
        if (status != BookingStatus.BOOKED && status != BookingStatus.CHECKED_IN) {
            throw new IllegalArgumentException("当前预约状态不可刷新验证码");
        }
        this.verificationCode = generateVerificationCode();
    }

    public boolean occupiesResource() {
        // Historical bookings remain queryable but no longer block rooms or therapists.
        return status != BookingStatus.CANCELLED && status != BookingStatus.COMPLETED;
    }

    public String id() { return id; }
    public String storeId() { return storeId; }
    public String serviceId() { return serviceId; }
    public String therapistId() { return therapistId; }
    public String roomId() { return roomId; }
    public String customerName() { return customerName; }
    public String mobile() { return mobile; }
    public String customerId() { return customerId; }
    public String verificationCode() { return verificationCode; }
    public BookingTimeRange timeRange() { return timeRange; }
    public BookingStatus status() { return status; }

    private static String generateVerificationCode() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
    }
}
