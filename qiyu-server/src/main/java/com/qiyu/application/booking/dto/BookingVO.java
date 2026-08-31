package com.qiyu.application.booking.dto;

import com.qiyu.application.catalog.dto.CatalogResourceVO;

/** Typed booking response shared by customer and administration APIs. */
public record BookingVO(
        String id, String status, String statusLabel,
        CatalogResourceVO.StoreVO store, CatalogResourceVO.ServiceItemVO service,
        CatalogResourceVO.TherapistVO therapist, String roomId, String customerName,
        String mobile, String customerId, String appointmentDate, String startTime,
        String endTime, Number amount, Number therapistFee, Number discountAmount,
        Number balanceDeduction, Number depositDue, Number paidAmount, String memberBenefit,
        String verificationCode, String verificationQrImageUrl, java.util.List<String> availableActions
) {}
