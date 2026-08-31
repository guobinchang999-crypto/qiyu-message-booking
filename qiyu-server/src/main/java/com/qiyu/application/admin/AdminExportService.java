package com.qiyu.application.admin;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.DataPermissionService;
import com.qiyu.application.booking.BookingAppService;
import com.qiyu.application.booking.BookingVO;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Exports administration rows to CSV with explicit export permissions.
 *
 * <p>Every export path reuses the same server-resolved data scope as its list endpoint,
 * so a CSV can never widen store access. Customer phone numbers stay masked unless the
 * operator already holds {@code customer:reveal_phone}.</p>
 */
@Service
public class AdminExportService {
    private final DataPermissionService dataPermissionService;
    private final AuthAppService authAppService;
    private final AdminQueryService adminQueryService;
    private final BookingAppService bookingAppService;

    public AdminExportService(DataPermissionService dataPermissionService, AuthAppService authAppService,
                              AdminQueryService adminQueryService, BookingAppService bookingAppService) {
        this.dataPermissionService = dataPermissionService;
        this.authAppService = authAppService;
        this.adminQueryService = adminQueryService;
        this.bookingAppService = bookingAppService;
    }

    /** Exports bookings inside the operator's booking data scope. */
    public String exportBookings() {
        dataPermissionService.requirePermission("booking:export");
        List<BookingVO> rows = bookingAppService.list(null);
        return csv(List.of("预约编号", "状态", "门店", "服务", "技师", "客户", "手机号", "日期", "开始", "结束", "金额"),
                rows.stream().map(this::bookingRow).toList());
    }

    /** Exports customer profiles after applying the customer read scope and phone masking. */
    public String exportCustomers() {
        dataPermissionService.requirePermission("customer:export");
        List<AdminResponseModels.Customer> rows = adminQueryService.customers();
        return csv(List.of("客户编号", "客户", "手机号", "会员等级", "最近到店", "预约数", "累计消费"),
                rows.stream().map(row -> List.of(row.id(), row.name(), row.phone(), row.memberLevel(),
                        row.lastVisitAt() == null ? "" : row.lastVisitAt(), String.valueOf(row.totalBookings()),
                        row.totalSpend() == null ? "" : row.totalSpend().toString())).toList());
    }

    /** Exports store-level business reports for the requested range after applying the report scope. */
    public String exportReports(LocalDate startDate, LocalDate endDate) {
        dataPermissionService.requirePermission("report:export");
        List<AdminResponseModels.BusinessReport> rows = adminQueryService.businessReports(startDate, endDate);
        return csv(List.of("门店", "预约数", "完成率(%)", "营业额", "客单价", "热门服务"),
                rows.stream().map(row -> List.of(row.store(), String.valueOf(row.bookingCount()),
                        row.completionRate() == null ? "" : row.completionRate().toString(),
                        row.revenue() == null ? "" : row.revenue().toString(),
                        row.averageTicket() == null ? "" : row.averageTicket().toString(),
                        row.topService() == null ? "" : row.topService())).toList());
    }

    private List<String> bookingRow(BookingVO booking) {
        return List.of(booking.id(), booking.statusLabel(),
                booking.store() == null ? "" : booking.store().name(),
                booking.service() == null ? "" : booking.service().name(),
                booking.therapist() == null ? "" : booking.therapist().name(),
                booking.customerName() == null ? "" : booking.customerName(),
                booking.mobile() == null ? "" : booking.mobile(),
                booking.appointmentDate() == null ? "" : booking.appointmentDate(),
                booking.startTime() == null ? "" : booking.startTime(),
                booking.endTime() == null ? "" : booking.endTime(),
                booking.amount() == null ? "" : booking.amount().toString());
    }

    private static String csv(List<String> headers, List<List<String>> rows) {
        StringBuilder builder = new StringBuilder();
        builder.append(csvLine(headers));
        for (List<String> row : rows) {
            builder.append(csvLine(row));
        }
        return builder.toString();
    }

    /** Encodes one row, quoting and escaping cells so commas, quotes and newlines survive. */
    private static String csvLine(List<String> cells) {
        return cells.stream().map(AdminExportService::escapeCell).collect(Collectors.joining(",")) + "\r\n";
    }

    private static String escapeCell(String value) {
        String safe = value == null ? "" : value;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
}
