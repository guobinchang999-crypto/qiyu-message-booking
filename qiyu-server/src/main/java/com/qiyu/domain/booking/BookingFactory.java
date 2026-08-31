package com.qiyu.domain.booking;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * The single construction point for {@link Booking} aggregates. Telescoping constructors are
 * replaced by intent-revealing factory methods: demo seeds, fresh creations and persistence
 * restores each express which fields they own.
 */
public final class BookingFactory {
    private BookingFactory() { }

    /** Simple seed or test booking with zero amounts, no verification code and no idempotency key. */
    public static Booking demo(String id, String storeId, String serviceId, String therapistId, String roomId,
                               String customerName, String mobile, String customerId,
                               LocalDate date, LocalTime startTime, int durationMinutes, BookingStatus status) {
        return restore(id, storeId, serviceId, therapistId, roomId, customerName, mobile, customerId, date, startTime,
                durationMinutes, status, null, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, 0L, null);
    }

    /** Fresh booking carrying its pricing breakdown and creation idempotency key. */
    public static Booking create(String id, String storeId, String serviceId, String therapistId, String roomId,
                                 String customerName, String mobile, String customerId,
                                 LocalDate date, LocalTime startTime, int durationMinutes, BookingStatus status,
                                 BigDecimal itemAmount, BigDecimal therapistFeeAmount, BigDecimal discountAmount,
                                 BigDecimal balanceDeductionAmount, BigDecimal depositDueAmount, BigDecimal paidAmount,
                                 String requestId) {
        return restore(id, storeId, serviceId, therapistId, roomId, customerName, mobile, customerId, date, startTime,
                durationMinutes, status, null, itemAmount, therapistFeeAmount, discountAmount, balanceDeductionAmount,
                depositDueAmount, paidAmount, 0L, requestId);
    }

    /** Rebuilds an aggregate from persisted state or builds a detached validation candidate. */
    public static Booking restore(String id, String storeId, String serviceId, String therapistId, String roomId,
                                  String customerName, String mobile, String customerId,
                                  LocalDate date, LocalTime startTime, int durationMinutes, BookingStatus status,
                                  String verificationCode, BigDecimal itemAmount, BigDecimal therapistFeeAmount,
                                  BigDecimal discountAmount, BigDecimal balanceDeductionAmount,
                                  BigDecimal depositDueAmount, BigDecimal paidAmount, long version, String requestId) {
        return new Booking(id, storeId, serviceId, therapistId, roomId, customerName, mobile, customerId, date, startTime,
                durationMinutes, status, verificationCode, itemAmount, therapistFeeAmount, discountAmount,
                balanceDeductionAmount, depositDueAmount, paidAmount, version, requestId);
    }
}
