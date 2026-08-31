package com.qiyu.application.schedule;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.domain.auth.DataAccessScope;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Coordinates schedule CRUD, data scope, and time-conflict invariants. */
@Service
public class ScheduleManagementService {
    private final AuthAppService authAppService;
    private final ObjectProvider<ScheduleManagementRepository> repositoryProvider;

    public ScheduleManagementService(AuthAppService authAppService,
                                     ObjectProvider<ScheduleManagementRepository> repositoryProvider) {
        this.authAppService = authAppService;
        this.repositoryProvider = repositoryProvider;
    }

    /** Lists an inclusive date range after resolving the operator's schedule READ scope. */
    public List<ScheduleView> list(LocalDate startDate, LocalDate endDate) {
        AuthPrincipal principal = authAppService.requirePermission("schedule:read");
        LocalDate start = startDate == null ? LocalDate.now() : startDate;
        LocalDate end = endDate == null ? start.plusDays(6) : endDate;
        if (end.isBefore(start) || end.isAfter(start.plusDays(31))) {
            throw new IllegalArgumentException("排班查询范围必须在1到32天内");
        }
        DataAccessScope scope = principal.scopeFor("schedule", "READ");
        ScheduleManagementRepository.ScheduleAccess access = new ScheduleManagementRepository.ScheduleAccess(
                scope.allowsAllStores(), scope.storeIds().isEmpty() ? Set.of("__NO_ACCESS_STORE__") : scope.storeIds());
        return repository().list(access, start, end).stream().map(ScheduleManagementService::view).toList();
    }

    /** Creates a non-overlapping schedule in a store the operator may manage. */
    @Transactional
    public ScheduleView create(ScheduleCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("schedule:manage");
        ScheduleManagementRepository.TherapistIdentity therapist = therapist(command.therapistId());
        requireStore(principal, therapist.storeId());
        ScheduleValues values = values(command);
        validateConflicts(therapist.databaseId(), values, null);
        String operator = String.valueOf(principal.userId());
        return view(repository().save(record(null, therapist, values, operator, operator)));
    }

    /** Replaces one schedule while retaining its stable identity and checking current store scope. */
    @Transactional
    public ScheduleView update(String scheduleId, ScheduleCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("schedule:manage");
        ScheduleManagementRepository.ScheduleRecord current = repository().find(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("排班记录不存在"));
        requireStore(principal, current.storeId());
        ScheduleManagementRepository.TherapistIdentity therapist = therapist(command.therapistId());
        requireStore(principal, therapist.storeId());
        ScheduleValues values = values(command);
        validateConflicts(therapist.databaseId(), values, current.databaseId());
        return view(repository().save(record(current.databaseId(), therapist, values, null,
                String.valueOf(principal.userId()))));
    }

    /** Soft-deletes a schedule only inside the effective schedule management scope. */
    @Transactional
    public void delete(String scheduleId) {
        AuthPrincipal principal = authAppService.requirePermission("schedule:manage");
        ScheduleManagementRepository.ScheduleRecord current = repository().find(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("排班记录不存在"));
        requireStore(principal, current.storeId());
        repository().delete(current.databaseId());
    }

    private void validateConflicts(long therapistId, ScheduleValues values, Long excludedId) {
        if (repository().scheduleOverlaps(therapistId, values.workDate(), values.startTime(), values.endTime(), excludedId)) {
            throw new IllegalArgumentException("该技师在所选时段已有排班");
        }
        if (!"WORK".equals(values.status()) && repository().bookingOverlaps(
                therapistId, values.workDate(), values.startTime(), values.endTime())) {
            throw new IllegalArgumentException("休息或请假时段与未取消预约冲突");
        }
    }

    private ScheduleManagementRepository.TherapistIdentity therapist(String therapistId) {
        return repository().findTherapist(required(therapistId, "技师不能为空"))
                .orElseThrow(() -> new IllegalArgumentException("技师不存在或已停用"));
    }

    private static void requireStore(AuthPrincipal principal, String storeId) {
        if (!principal.canAccessStore("schedule", "MANAGE", storeId)) {
            throw new SecurityException("没有权限管理该门店的排班");
        }
    }

    private ScheduleManagementRepository repository() {
        ScheduleManagementRepository value = repositoryProvider.getIfAvailable();
        if (value == null) throw new IllegalStateException("当前运行模式未配置排班持久化仓储");
        return value;
    }

    private static ScheduleValues values(ScheduleCommand command) {
        if (command.workDate() == null || command.startTime() == null || command.endTime() == null) {
            throw new IllegalArgumentException("排班日期和时间不能为空");
        }
        if (!command.endTime().isAfter(command.startTime())) throw new IllegalArgumentException("结束时间必须晚于开始时间");
        String status = required(command.status(), "排班状态不能为空").toUpperCase(Locale.ROOT);
        if (!Set.of("WORK", "REST", "LEAVE").contains(status)) throw new IllegalArgumentException("排班状态不正确");
        String remark = command.remark() == null || command.remark().isBlank() ? null : command.remark().trim();
        if (remark != null && remark.length() > 255) throw new IllegalArgumentException("排班备注不能超过255个字符");
        return new ScheduleValues(command.workDate(), command.startTime(), command.endTime(), status, remark);
    }

    private static ScheduleManagementRepository.ScheduleRecord record(Long id,
            ScheduleManagementRepository.TherapistIdentity therapist, ScheduleValues values,
            String createdBy, String updatedBy) {
        return new ScheduleManagementRepository.ScheduleRecord(id, id == null ? null : "schedule-" + id,
                therapist.databaseId(), therapist.id(), therapist.name(), therapist.storeDatabaseId(),
                therapist.storeId(), values.workDate(), values.startTime(), values.endTime(), values.status(),
                values.remark(), createdBy, updatedBy);
    }

    private static ScheduleView view(ScheduleManagementRepository.ScheduleRecord value) {
        return new ScheduleView(value.id(), value.therapistId(), value.therapistName(), value.storeId(),
                value.workDate(), value.startTime(), value.endTime(), value.status(), value.remark());
    }

    private static String required(String value, String message) { if (value == null || value.isBlank()) throw new IllegalArgumentException(message); return value.trim(); }

    public record ScheduleCommand(String therapistId, LocalDate workDate, LocalTime startTime,
                                  LocalTime endTime, String status, String remark) {}
    public record ScheduleView(String id, String therapistId, String therapistName, String storeId,
                               LocalDate workDate, LocalTime startTime, LocalTime endTime,
                               String status, String remark) {}
    private record ScheduleValues(LocalDate workDate, LocalTime startTime, LocalTime endTime,
                                  String status, String remark) {}
}
