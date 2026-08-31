package com.qiyu.adapter.booking;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.booking.BookingAppService;
import com.qiyu.application.booking.BookingVO;
import com.qiyu.application.booking.BookingOperationVO;
import com.qiyu.application.booking.BookingCreateCommand;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * HTTP adapter for the complete booking lifecycle.
 *
 * <p>Authentication is enforced at the adapter boundary. Functional and data-scope permissions
 * remain in the application service because the same rules must also protect non-HTTP callers.</p>
 */
@RestController
@RequestMapping("/bookings")
@SaCheckLogin
public class BookingController {
    private final BookingAppService bookingAppService;

    public BookingController(BookingAppService bookingAppService) { this.bookingAppService = bookingAppService; }

    @PostMapping("/confirmation")
    public ApiResponse<BookingOperationVO.Confirmation> confirmation(@Valid @RequestBody BookingConfirmationRequest request) {
        return ApiResponse.success(bookingAppService.confirmation(request.storeId(), request.serviceId(), request.therapistId(),
                request.date(), request.startTime(), request.guestCount(), request.couponId()));
    }

    @PostMapping
    public ApiResponse<BookingVO> create(@Valid @RequestBody BookingCreateRequest request) {
        // Keep transport DTOs out of the application layer so its use case contract remains stable.
        BookingCreateCommand command = new BookingCreateCommand(request.storeId(), request.serviceId(), request.therapistId(),
                request.roomId(), request.date(), request.startTime(), request.customerName(), request.mobile(), request.couponId());
        return ApiResponse.success(bookingAppService.create(command));
    }

    @GetMapping
    public ApiResponse<List<BookingVO>> list(@RequestParam(required = false) String status) {
        return ApiResponse.success(bookingAppService.list(status));
    }

    @GetMapping("/{id}/success")
    public ApiResponse<BookingOperationVO.Success> success(@PathVariable String id) {
        return ApiResponse.success(bookingAppService.success(id));
    }

    @GetMapping("/{id}/rebook-draft")
    public ApiResponse<BookingOperationVO.DraftResult> rebookDraft(@PathVariable String id) {
        return ApiResponse.success(bookingAppService.rebookDraft(id));
    }

    @GetMapping("/{id}/reschedule-draft")
    public ApiResponse<BookingOperationVO.DraftResult> rescheduleDraft(@PathVariable String id) {
        return ApiResponse.success(bookingAppService.rescheduleDraft(id));
    }

    @GetMapping("/{id}")
    public ApiResponse<BookingVO> detail(@PathVariable String id) {
        return ApiResponse.success(bookingAppService.detail(id));
    }

    @PostMapping("/{id}/checkin")
    public ApiResponse<BookingVO> checkIn(@PathVariable String id) {
        return ApiResponse.success(bookingAppService.checkIn(id));
    }

    @PostMapping("/{id}/verification-code/refresh")
    public ApiResponse<BookingVO> refreshVerificationCode(@PathVariable String id) {
        return ApiResponse.success(bookingAppService.refreshVerificationCode(id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<BookingVO> cancel(@PathVariable String id) {
        return ApiResponse.success(bookingAppService.cancel(id));
    }

    @PostMapping("/{id}/payment")
    public ApiResponse<BookingOperationVO.Payment> preparePayment(@PathVariable String id, @RequestBody(required = false) BookingPaymentPrepareRequest request) {
        return ApiResponse.success(bookingAppService.preparePayment(id, request == null ? null : request.requestId()));
    }

    @PostMapping("/{id}/pay")
    public ApiResponse<BookingVO> payDeposit(@PathVariable String id,
                                             @RequestBody(required = false) BookingPaymentConfirmRequest request) {
        return ApiResponse.success(bookingAppService.payDeposit(id, request == null ? null : request.requestId()));
    }

    @PostMapping("/{id}/start-service")
    public ApiResponse<BookingVO> startService(@PathVariable String id) {
        return ApiResponse.success(bookingAppService.startService(id));
    }

    @PostMapping("/{id}/finish-service")
    public ApiResponse<BookingVO> finishService(@PathVariable String id) {
        return ApiResponse.success(bookingAppService.finishService(id));
    }

    @PostMapping("/{id}/settle")
    public ApiResponse<BookingVO> completeSettlement(@PathVariable String id) {
        return ApiResponse.success(bookingAppService.completeSettlement(id));
    }

    @PostMapping("/{id}/reschedule")
    public ApiResponse<BookingVO> reschedule(@PathVariable String id, @Valid @RequestBody BookingRescheduleRequest request) {
        return ApiResponse.success(bookingAppService.reschedule(id, request.date(), request.startTime()));
    }
}
