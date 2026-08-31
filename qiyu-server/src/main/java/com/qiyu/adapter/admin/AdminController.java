package com.qiyu.adapter.admin;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.admin.AdminExportService;
import com.qiyu.application.admin.AdminQueryService;
import com.qiyu.domain.catalog.Store;
import com.qiyu.application.booking.BookingVO;
import com.qiyu.application.admin.AdminResponseModels;
import com.qiyu.application.admin.StoreManagementService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/admin")
@SaCheckLogin
public class AdminController {
    private final AdminQueryService adminQueryService;
    private final BookingAppService bookingAppService;
    private final StoreManagementService storeManagementService;
    private final AdminExportService adminExportService;

    public AdminController(AdminQueryService adminQueryService, BookingAppService bookingAppService,
                           StoreManagementService storeManagementService, AdminExportService adminExportService) {
        this.adminQueryService = adminQueryService;
        this.bookingAppService = bookingAppService;
        this.storeManagementService = storeManagementService;
        this.adminExportService = adminExportService;
    }

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

    /** Returns the scoped administration store list backed by persistent resources. */
    @GetMapping("/stores")
    public ApiResponse<List<AdminResponseModels.StoreProfile>> stores() {
        return ApiResponse.success(adminQueryService.stores());
    }

    /** Creates a persistent store after function and input validation. */
    @PostMapping("/stores")
    public ApiResponse<AdminResponseModels.StoreProfile> createStore(
            @Valid @RequestBody StoreManagementService.StoreCommand command) {
        return ApiResponse.success(storeManagementService.create(command));
    }

    /** Replaces mutable store master data while retaining its stable code. */
    @org.springframework.web.bind.annotation.PutMapping("/stores/{id}")
    public ApiResponse<AdminResponseModels.StoreProfile> updateStore(
            @PathVariable String id, @Valid @RequestBody StoreManagementService.StoreCommand command) {
        return ApiResponse.success(storeManagementService.update(id, command));
    }

    /** Soft-deletes a store inside the current DELETE data scope. */
    @org.springframework.web.bind.annotation.DeleteMapping("/stores/{id}")
    public ApiResponse<Void> deleteStore(@PathVariable String id) {
        storeManagementService.delete(id);
        return ApiResponse.success(null);
    }

    /** Returns scoped store operating metrics for an optional inclusive date range. */
    @GetMapping("/reports")
    public ApiResponse<List<AdminResponseModels.BusinessReport>> reports(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        return ApiResponse.success(adminQueryService.businessReports(startDate, endDate));
    }

    /** Returns scoped therapist administration rows with real booking workload. */
    @GetMapping("/therapists")
    public ApiResponse<List<AdminResponseModels.TherapistProfile>> therapists() {
        return ApiResponse.success(adminQueryService.therapists());
    }

    @GetMapping("/schedule-resources")
    public ApiResponse<AdminResponseModels.ScheduleResources> scheduleResources() { return ApiResponse.success(adminQueryService.scheduleResources()); }

    @GetMapping("/accessible-stores")
    public ApiResponse<List<Store>> accessibleStores() { return ApiResponse.success(adminQueryService.accessibleStores()); }

    /** Returns a UTF-8 CSV of bookings after applying the booking export permission and data scope. */
    @GetMapping("/export/bookings")
    public ResponseEntity<byte[]> exportBookings() {
        return csvResponse("bookings.csv", adminExportService.exportBookings());
    }

    /** Returns a UTF-8 CSV of customers with phones masked unless reveal permission is held. */
    @GetMapping("/export/customers")
    public ResponseEntity<byte[]> exportCustomers() {
        return csvResponse("customers.csv", adminExportService.exportCustomers());
    }

    /** Returns a UTF-8 CSV of store reports for the requested range after the report export permission. */
    @GetMapping("/export/reports")
    public ResponseEntity<byte[]> exportReports(@RequestParam(required = false) LocalDate startDate,
                                                @RequestParam(required = false) LocalDate endDate) {
        return csvResponse("reports.csv", adminExportService.exportReports(startDate, endDate));
    }

    private static ResponseEntity<byte[]> csvResponse(String fileName, String csv) {
        byte[] body = csv.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName, StandardCharsets.UTF_8).build().toString())
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(body);
    }
}
