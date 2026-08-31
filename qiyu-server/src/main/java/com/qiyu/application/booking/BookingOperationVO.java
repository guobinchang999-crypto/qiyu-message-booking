package com.qiyu.application.booking;

import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Typed operation responses for booking confirmation, payment and follow-up flows. */
public final class BookingOperationVO {
    private BookingOperationVO() {}
    public record Confirmation(String pageTitle, EditActions editActions, ServiceCardMeta cardMeta,
                               Store store, ServiceItem service, Therapist therapist, String therapistDisplayName,
                               String scheduledAt, PaymentSummary payment, FormCopy formCopy,
                               String benefitTitle, String benefitSelectionText, String paymentTitle,
                               List<PaymentLine> paymentLines, String totalLabel, String agreementText,
                               String agreementRequiredMessage, String depositButtonText, int guestCount) {}
    public record EditActions(String store, String service, String therapist, String time) {}
    public record ServiceCardMeta(String durationUnit, String servedPrefix, String servedSuffix) {}
    public record FormCopy(String guestCountLabel, String contactLabel, String contactPlaceholder,
                           String remarkLabel, String remarkPlaceholder, String contactRequiredMessage,
                           String submitFallbackText) {}
    public record PaymentSummary(int itemAmount, int therapistFee, int discountAmount, int balanceDeduction,
                                 int depositDue, int paidAmount) {}
    public record PaymentLine(String key, String label, String amountText, String tone) {}
    public record Success(BookingVO booking, SuccessCopy copy) {}
    public record SuccessCopy(String title, String subtitle, String bookingCodePrefix, String codeHint,
                              String navigationActionText, String contactActionText, String reminderText,
                              String detailButtonText, String homeButtonText) {}
    public record DraftResult(String sourceBookingId, Draft draft) {}
    public record Draft(String storeId, String serviceId, String therapistMode, String therapistId,
                        String slotId, int guestCount, String contact, String remark,
                        String benefitSelection, String flow, String sourceBookingId) {}
    public record Payment(String bookingId, Number amount, String paymentNo, PaymentParameters parameters) {}
    public record PaymentParameters(String timeStamp, String nonceStr, @JsonProperty("package") String packageValue,
                                    String signType, String paySign) {}
}
