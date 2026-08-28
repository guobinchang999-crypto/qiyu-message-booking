package com.qiyu.adapter.admin;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.admin.AdminQueryService;
import com.qiyu.domain.catalog.Store;
import com.qiyu.application.booking.BookingVO;
import com.qiyu.application.admin.AdminResponseModels;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import com.qiyu.application.booking.BookingAppService;
import com.qiyu.application.booking.BookingCreateCommand;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/admin")
@SaCheckLogin
public class AdminController {
    private final AdminQueryService adminQueryService;
    private final BookingAppService bookingAppService;

    public AdminController(AdminQueryService adminQueryService, BookingAppService bookingAppService) { this.adminQueryService = adminQueryService; this.bookingAppService = bookingAppService; }

    @PostMapping("/bookings")
    public ApiResponse<BookingVO> createBooking(@Valid @RequestBody AdminBookingCreateRequest request) {
        return ApiResponse.success(bookingAppService.createForAdmin(new BookingCreateCommand(request.storeId(), request.serviceId(), request.therapistId(), request.roomId(), request.date(), request.startTime(), request.customerName(), request.mobile(), request.couponId())));
    }

    @PostMapping("/bookings/{id}/reschedule")
    public ApiResponse<BookingVO> rescheduleBooking(@PathVariable String id, @Valid @RequestBody AdminBookingRescheduleRequest request) {
        return ApiResponse.success(bookingAppService.reschedule(id, request.date(), request.startTime()));
    }

    @GetMapping("/dashboard")
    public ApiResponse<AdminResponseModels.Dashboard> dashboard() { return ApiResponse.success(adminQueryService.dashboard()); }

    @GetMapping("/bookings")
    public ApiResponse<AdminResponseModels.BookingPage> bookings(@RequestParam(required = false) String pageNum,
                                                       @RequestParam(required = false) String pageSize,
                                                       @RequestParam(required = false) String status) {
        return ApiResponse.success(adminQueryService.bookings(pageNum, pageSize, status));
    }

    @GetMapping("/customers")
    public ApiResponse<List<AdminResponseModels.Customer>> customers() { return ApiResponse.success(adminQueryService.customers()); }

    @GetMapping("/members")
    public ApiResponse<List<AdminResponseModels.Member>> members() { return ApiResponse.success(adminQueryService.members()); }

    @GetMapping("/coupons")
    public ApiResponse<List<AdminResponseModels.Coupon>> coupons() { return ApiResponse.success(adminQueryService.coupons()); }

    @GetMapping("/schedule-resources")
    public ApiResponse<AdminResponseModels.ScheduleResources> scheduleResources() { return ApiResponse.success(adminQueryService.scheduleResources()); }

    @GetMapping("/accessible-stores")
    public ApiResponse<List<Store>> accessibleStores() { return ApiResponse.success(adminQueryService.accessibleStores()); }
}
