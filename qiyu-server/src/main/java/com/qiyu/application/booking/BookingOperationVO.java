package com.qiyu.application.booking;

import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Typed operation responses for booking confirmation, payment and follow-up flows. */
public final class BookingOperationVO {
    private BookingOperationVO() {}
    public record Confirmation(String pageTitle, Map<String,String> editActions, Map<String,String> cardMeta,
                               Store store, ServiceItem service, Therapist therapist, String therapistDisplayName,
                               String scheduledAt, PaymentSummary payment, Map<String,String> formCopy,
                               String benefitTitle, String benefitSelectionText, String paymentTitle,
                               List<PaymentLine> paymentLines, String totalLabel, String agreementText,
                               String agreementRequiredMessage, String depositButtonText, int guestCount) {}
    public record PaymentSummary(int itemAmount, int therapistFee, int discountAmount, int balanceDeduction,
                                 int depositDue, int paidAmount) {}
    public record PaymentLine(String key, String label, String amountText, String tone) {}
    public record Success(BookingVO booking, Map<String,Object> copy) {}
    public record DraftResult(String sourceBookingId, Draft draft) {}
    public record Draft(String storeId, String serviceId, String therapistMode, String therapistId,
                        String slotId, int guestCount, String contact, String remark,
                        String benefitSelection, String flow, String sourceBookingId) {}
    public record Payment(String bookingId, Number amount, String paymentNo, PaymentParameters parameters) {}
    public record PaymentParameters(String timeStamp, String nonceStr, @JsonProperty("package") String packageValue,
                                    String signType, String paySign, boolean mockPayment) {}
}
