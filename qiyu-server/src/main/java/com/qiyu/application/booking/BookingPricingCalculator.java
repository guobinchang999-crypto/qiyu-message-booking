package com.qiyu.application.booking;

import com.qiyu.domain.booking.BookingDomainService;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Therapist;
import com.qiyu.domain.coupon.gateway.CouponGateway;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Calculates the monetary breakdown of a booking. Amount composition and the deposit cap are
 * business rules shared by creation and confirmation previews.
 */
@Component
public class BookingPricingCalculator {
    private final CouponGateway couponGateway;
    private final BookingDomainService bookingDomain = new BookingDomainService();

    public BookingPricingCalculator(CouponGateway couponGateway) {
        this.couponGateway = couponGateway;
    }

    public BookingPricing pricing(ServiceItem service, Therapist therapist, String customerId, String couponNo, int guestCount) {
        BigDecimal itemAmount = decimal(service.memberPrice()).multiply(BigDecimal.valueOf(guestCount));
        BigDecimal therapistFee = (therapist == null ? BigDecimal.ZERO : decimal(therapist.extraFee())).multiply(BigDecimal.valueOf(guestCount));
        BigDecimal discountAmount = resolveDiscount(customerId, couponNo, itemAmount.add(therapistFee));
        BigDecimal totalAmount = itemAmount.add(therapistFee).subtract(discountAmount).max(BigDecimal.ZERO);
        return new BookingPricing(itemAmount, therapistFee, discountAmount, bookingDomain.depositDue(totalAmount, guestCount));
    }

    /** Uses the authenticated customer's coupon ownership as the only source of a booking discount. */
    private BigDecimal resolveDiscount(String customerId, String couponNo, BigDecimal subtotal) {
        if (couponNo == null || couponNo.isBlank()) return BigDecimal.ZERO;
        return couponGateway.findApplicable(customerId, couponNo)
                .map(coupon -> coupon.discountFor(subtotal))
                .orElseThrow(() -> new IllegalArgumentException("优惠券不可用"));
    }

    public static int money(BigDecimal value) {
        return value.setScale(0, RoundingMode.HALF_UP).intValueExact();
    }

    public static BigDecimal decimal(Number value) {
        return value instanceof BigDecimal decimal ? decimal : new BigDecimal(value.toString());
    }

    public record BookingPricing(BigDecimal itemAmount, BigDecimal therapistFee, BigDecimal discountAmount,
                                 BigDecimal depositDue) { }
}
