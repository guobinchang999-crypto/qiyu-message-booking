package com.qiyu.application.therapist;

import com.qiyu.application.admin.AdminResponseModels;
import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

/** Coordinates authorized therapist mutations without exposing persistence or HTTP concerns. */
@Service
public class TherapistManagementService {
    private final AuthAppService authAppService;
    private final ObjectProvider<TherapistManagementRepository> repositoryProvider;

    public TherapistManagementService(AuthAppService authAppService,
                                      ObjectProvider<TherapistManagementRepository> repositoryProvider) {
        this.authAppService = authAppService;
        this.repositoryProvider = repositoryProvider;
    }

    /** Creates a therapist in an accessible store and persists normalized skills atomically. */
    @Transactional
    public AdminResponseModels.TherapistProfile create(TherapistCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("therapist:manage");
        TherapistManagementRepository repository = repository();
        String storeId = required(command.storeId(), "所属门店不能为空");
        requireStoreAccess(principal, storeId);
        String code = normalizeCode(command.code());
        if (repository.codeExists(code)) {
            throw new IllegalArgumentException("技师编码已存在");
        }
        long storeDatabaseId = repository.resolveStoreDatabaseId(storeId)
                .orElseThrow(() -> new IllegalArgumentException("所属门店不存在或已停用"));
        List<String> skills = normalizeSkills(command.skills());
        TherapistManagementRepository.TherapistMaster saved = repository.save(master(null, apiId(code), code,
                storeDatabaseId, storeId, command));
        repository.replaceSkills(saved.databaseId(), skills);
        return profile(saved.databaseId());
    }

    /** Updates a therapist only when both its current and requested stores are inside management scope. */
    @Transactional
    public AdminResponseModels.TherapistProfile update(String therapistId, TherapistCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("therapist:manage");
        TherapistManagementRepository repository = repository();
        TherapistManagementRepository.TherapistMaster current = repository.find(therapistId)
                .orElseThrow(() -> new IllegalArgumentException("技师不存在"));
        requireStoreAccess(principal, current.storeId());
        String targetStoreId = required(command.storeId(), "所属门店不能为空");
        requireStoreAccess(principal, targetStoreId);
        long targetStoreDatabaseId = repository.resolveStoreDatabaseId(targetStoreId)
                .orElseThrow(() -> new IllegalArgumentException("所属门店不存在或已停用"));
        List<String> skills = normalizeSkills(command.skills());
        TherapistManagementRepository.TherapistMaster saved = repository.save(master(current.databaseId(),
                current.id(), current.code(), targetStoreDatabaseId, targetStoreId, command));
        repository.replaceSkills(saved.databaseId(), skills);
        return profile(saved.databaseId());
    }

    /** Soft-deletes a scoped therapist only after all of their appointments reach a terminal state. */
    @Transactional
    public void delete(String therapistId) {
        AuthPrincipal principal = authAppService.requirePermission("therapist:manage");
        TherapistManagementRepository repository = repository();
        TherapistManagementRepository.TherapistMaster current = repository.find(therapistId)
                .orElseThrow(() -> new IllegalArgumentException("技师不存在"));
        requireStoreAccess(principal, current.storeId());
        if (repository.unfinishedBookingCount(current.databaseId()) > 0) {
            throw new IllegalArgumentException("技师仍有未完成预约，不能删除");
        }
        repository.delete(current.databaseId());
    }

    private static TherapistManagementRepository.TherapistMaster master(
            Long databaseId, String id, String code, long storeDatabaseId, String storeId,
            TherapistCommand command) {
        return new TherapistManagementRepository.TherapistMaster(databaseId, id, code, storeDatabaseId, storeId,
                required(command.name(), "技师姓名不能为空"), required(command.level(), "技师等级不能为空"),
                rating(command.rating()), amount(command.specifyFee()), status(command.status()),
                command.sortOrder() == null ? 0 : command.sortOrder(),
                command.enabled() == null || command.enabled());
    }

    private AdminResponseModels.TherapistProfile profile(long databaseId) {
        TherapistManagementRepository repository = repository();
        TherapistManagementRepository.TherapistProfile value = repository.loadProfile(databaseId);
        return new AdminResponseModels.TherapistProfile(value.id(), value.name(), value.store(), value.level(),
                value.skills(), value.status(), value.rating(), value.todayBookings(), value.code(), value.storeId(),
                value.mobile(), value.specifyFee(), value.enabled());
    }

    private TherapistManagementRepository repository() {
        TherapistManagementRepository repository = repositoryProvider.getIfAvailable();
        if (repository == null) {
            throw new IllegalStateException("当前运行模式未配置技师持久化仓储");
        }
        return repository;
    }

    private static void requireStoreAccess(AuthPrincipal principal, String storeId) {
        if (!principal.canAccessStore("therapist", "MANAGE", storeId)) {
            throw new SecurityException("没有权限管理该门店的技师");
        }
    }

    private static List<String> normalizeSkills(List<String> values) {
        if (values == null) {
            return List.of();
        }
        LinkedHashSet<String> skills = new LinkedHashSet<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                String skill = value.trim();
                if (skill.length() > 64) throw new IllegalArgumentException("技能名称不能超过64个字符");
                skills.add(skill);
            }
        }
        if (skills.size() > 20) throw new IllegalArgumentException("单个技师最多配置20项技能");
        return List.copyOf(skills);
    }

    private static BigDecimal rating(BigDecimal value) {
        BigDecimal result = value == null ? BigDecimal.valueOf(5) : value.setScale(1, RoundingMode.HALF_UP);
        if (result.compareTo(BigDecimal.ZERO) < 0 || result.compareTo(BigDecimal.valueOf(5)) > 0) {
            throw new IllegalArgumentException("技师评分必须在0到5之间");
        }
        return result;
    }

    private static BigDecimal amount(BigDecimal value) {
        BigDecimal result = value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
        if (result.signum() < 0) throw new IllegalArgumentException("指定技师附加费不能小于0");
        return result;
    }

    private static String status(String value) {
        if (value == null || value.isBlank() || "AVAILABLE".equalsIgnoreCase(value) || "可预约".equals(value)) return "AVAILABLE";
        if ("BUSY".equalsIgnoreCase(value) || "服务中".equals(value)) return "BUSY";
        if ("ON_LEAVE".equalsIgnoreCase(value) || "休假".equals(value)) return "ON_LEAVE";
        if ("OFF_DUTY".equalsIgnoreCase(value) || "休息".equals(value)) return "OFF_DUTY";
        throw new IllegalArgumentException("不支持的技师状态");
    }

    private static String normalizeCode(String value) {
        String code = required(value, "技师编码不能为空").toUpperCase(Locale.ROOT).replace('-', '_');
        if (!code.matches("[A-Z0-9_]{2,32}")) {
            throw new IllegalArgumentException("技师编码只能包含大写字母、数字和下划线");
        }
        return code;
    }

    private static String apiId(String code) {
        return "therapist-" + code.toLowerCase(Locale.ROOT).replace('_', '-');
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
        return value.trim();
    }

    /** Typed therapist mutation contract shared by create and replacement-style update. */
    public record TherapistCommand(String code, String storeId, String name, String level, List<String> skills,
                                   String status, BigDecimal rating, BigDecimal specifyFee, Integer sortOrder,
                                   Boolean enabled) {
    }
}
