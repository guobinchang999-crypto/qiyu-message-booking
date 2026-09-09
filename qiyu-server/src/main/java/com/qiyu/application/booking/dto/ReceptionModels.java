package com.qiyu.application.booking.dto;

import java.util.List;
import java.util.Map;
import jakarta.validation.constraints.NotBlank;

/** Staff-only views keep the mini-program contract unchanged. */
public final class ReceptionModels {
    private ReceptionModels() {}
    public record Entry(BookingVO booking, String roomName, String occupiedStartAt, String occupiedEndAt,
                        long version, List<String> actions) {}
    public record Page(List<Entry> list, long total, int pageNum, int pageSize, Map<String, Long> counts) {}
    public record Query(String storeId, String startDate, String endDate, String keyword, String customerId,
                        String status, Integer pageNum, Integer pageSize) {}
    public record Placement(@NotBlank String storeId, @NotBlank String serviceId, @NotBlank String therapistId,
                            @NotBlank String roomId, @NotBlank String date, @NotBlank String startTime,
                            String bookingId) {}
    public record Availability(boolean available, String message, String occupiedStartAt, String occupiedEndAt) {}
    public record Code(@NotBlank String storeId, @NotBlank String code, String bookingId, Long version) {}
    public record CustomerInput(@NotBlank String storeId, @NotBlank String mobile, String name) {}
    public record Customer(String id, String name, String mobile) {}
    public record Audit(String id, String operator, String action, String beforeData, String afterData, String createdAt) {}
    public record Change(String date, String startTime, String therapistId, String roomId, long version) {}
    public record Action(@NotBlank String action, long version) {}
    public record Option(String value, String label, String storeId, Number price, Integer durationMinutes) {}
    public record Options(List<Option> stores, List<Option> services, List<Option> therapists, List<Option> rooms) {}
}
