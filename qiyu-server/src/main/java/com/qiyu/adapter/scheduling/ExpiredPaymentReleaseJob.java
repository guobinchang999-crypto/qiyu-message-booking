package com.qiyu.adapter.scheduling;

import com.qiyu.application.booking.BookingAppService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodic trigger that releases soft resource holds left by unpaid bookings whose payment
 * window has expired. Business rules stay in the application service; this class only ticks.
 */
@Component
public class ExpiredPaymentReleaseJob {
    private static final Logger LOGGER = LoggerFactory.getLogger(ExpiredPaymentReleaseJob.class);
    private final BookingAppService bookingAppService;

    public ExpiredPaymentReleaseJob(BookingAppService bookingAppService) {
        this.bookingAppService = bookingAppService;
    }

    @Scheduled(fixedDelayString = "${qiyu.booking.payment-release-interval-ms:60000}")
    public void releaseExpiredPaymentHolds() {
        int released = bookingAppService.releaseExpiredPendingPayments();
        if (released > 0) {
            LOGGER.info("Released {} expired pending-payment bookings", released);
        }
    }
}
