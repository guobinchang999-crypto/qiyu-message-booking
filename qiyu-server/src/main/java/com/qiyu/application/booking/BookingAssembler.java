package com.qiyu.application.booking;

import com.qiyu.application.booking.dto.BookingVO;

import com.qiyu.application.auth.AuthContext;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.application.auth.DataPermissionService;
import com.qiyu.application.catalog.dto.CatalogResourceVO;
import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingStatus;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Maps booking aggregates into the client view model, applying sensitive-field permissions
 * before serialization. Kept separate from orchestration so both command and query flows share
 * one mapping definition.
 */
@Component
public class BookingAssembler {
    private final CatalogGateway catalogProvider;
    private final DataPermissionService dataPermissionService;

    public BookingAssembler(CatalogGateway catalogProvider, DataPermissionService dataPermissionService) {
        this.catalogProvider = catalogProvider;
        this.dataPermissionService = dataPermissionService;
    }

    /** Maps a domain booking while applying sensitive-field permissions before serialization. */
    public BookingVO toView(Booking booking) {
        ServiceItem service = catalogProvider.findService(booking.serviceId());
        Store store = catalogProvider.findStore(booking.storeId());
        // Automatically assigned bookings may legitimately remain without a therapist until
        // store staff completes resource assignment.
        Therapist therapist = booking.therapistId() == null ? null : catalogProvider.findTherapist(booking.therapistId());
        // Field permission is independent of row permission: broad store access does not imply
        // access to a customer's full mobile number.
        boolean revealPhone = dataPermissionService.canRevealCustomerPhone(AuthContext.current(), booking);
        return new BookingVO(booking.id(), booking.status().name(), booking.status().label(),
                CatalogResourceVO.store(store),
                CatalogResourceVO.service(service),
                therapist == null ? null : CatalogResourceVO.therapist(therapist), booking.roomId(),
                booking.customerName(), revealPhone ? booking.mobile() : maskMobile(booking.mobile()),
                booking.customerId(), booking.timeRange().serviceFrom().toLocalDate().toString(),
                booking.timeRange().serviceFrom().toLocalTime().toString(),
                booking.timeRange().serviceTo().toLocalTime().toString(), booking.itemAmount(), booking.therapistFeeAmount(),
                booking.discountAmount(), booking.balanceDeductionAmount(), booking.depositDueAmount(), booking.paidAmount(),
                "会员权益全门店通用", booking.verificationCode(), null, availableActions(booking.status()));
    }

    public static String maskMobile(String mobile) {
        return mobile.length() < 7 ? mobile : mobile.substring(0, 3) + "****" + mobile.substring(mobile.length() - 4);
    }

    /** Server-owned actions keep the client from deriving permissions from a booking status. */
    public static List<String> availableActions(BookingStatus status) {
        return switch (status) {
            case PENDING_PAYMENT -> List.of("pay", "cancel", "view_detail");
            case BOOKED -> List.of("show_code", "refresh_code", "reschedule", "contact", "view_detail");
            case CHECKED_IN -> List.of("refresh_code", "contact", "view_detail");
            case WAITING_SERVICE, IN_SERVICE, PENDING_SETTLEMENT -> List.of("contact", "view_detail");
            case COMPLETED -> List.of("review", "rebook", "view_detail");
            case CANCELLED -> List.of("rebook", "view_detail");
        };
    }
}
