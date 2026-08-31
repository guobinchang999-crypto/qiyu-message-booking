package com.qiyu.application.admin;

import com.qiyu.application.admin.dto.AdminResponseModels;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Set;

/** Handles authorized store master-data mutations independently of HTTP and MyBatis. */
@Service
public class StoreManagementService {
    private final AuthAppService authAppService;
    private final StoreManagementRepository repository;
    private final ObjectProvider<AdminOperationsReadRepository> readRepository;

    public StoreManagementService(AuthAppService authAppService, StoreManagementRepository repository,
                                  ObjectProvider<AdminOperationsReadRepository> readRepository) {
        this.authAppService = authAppService;
        this.repository = repository;
        this.readRepository = readRepository;
    }

    /** Creates a store with an explicit immutable business code. */
    @Transactional
    public AdminResponseModels.StoreProfile create(StoreCommand command) {
        authAppService.requirePermission("store:create");
        String code = normalizeCode(command.code());
        String id = apiId(code);
        if (repository.find(id).isPresent()) {
            throw new IllegalArgumentException("门店编码已存在");
        }
        StoreManagementRepository.StoreMaster saved = repository.save(master(null, id, code,
                command.regionId() == null ? repository.defaultRegionId() : command.regionId(), command));
        return reloadProfile(saved.id());
    }

    /** Updates mutable store fields after checking the current store data scope. */
    @Transactional
    public AdminResponseModels.StoreProfile update(String storeId, StoreCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("store:update");
        if (!principal.canAccessStore("store", "UPDATE", storeId)) {
            throw new SecurityException("没有权限修改该门店");
        }
        StoreManagementRepository.StoreMaster current = repository.find(storeId)
                .orElseThrow(() -> new IllegalArgumentException("门店不存在"));
        StoreManagementRepository.StoreMaster saved = repository.save(master(current.databaseId(), current.id(),
                current.code(), command.regionId() == null ? current.regionId() : command.regionId(), command));
        return reloadProfile(saved.id());
    }

    /** Soft-deletes a store only inside the operator's DELETE scope. */
    @Transactional
    public void delete(String storeId) {
        AuthPrincipal principal = authAppService.requirePermission("store:delete");
        if (!principal.canAccessStore("store", "DELETE", storeId)) {
            throw new SecurityException("没有权限删除该门店");
        }
        StoreManagementRepository.StoreMaster current = repository.find(storeId)
                .orElseThrow(() -> new IllegalArgumentException("门店不存在"));
        if (repository.dependentRecordCount(current.databaseId()) > 0) {
            throw new IllegalArgumentException("门店仍有关联技师、房间或预约，不能删除");
        }
        repository.delete(storeId);
    }

    private static StoreManagementRepository.StoreMaster master(Long databaseId, String id, String code,
                                                                 long regionId, StoreCommand command) {
        String name = required(command.name(), "门店名称不能为空");
        String address = required(command.address(), "门店地址不能为空");
        String hours = required(command.businessHours(), "营业时间不能为空");
        LocalTime[] range = hours(hours);
        String status = "休息中".equals(command.status()) || "CLOSED".equalsIgnoreCase(command.status()) ? "CLOSED" : "OPEN";
        return new StoreManagementRepository.StoreMaster(databaseId, id, regionId, code, name, command.phone(),
                blankDefault(command.province(), "上海市"), blankDefault(command.city(), "上海市"),
                blankDefault(command.district(), ""), address, command.longitude(), command.latitude(), hours,
                range[0], range[1], status, command.rating() == null ? BigDecimal.valueOf(5) : command.rating(),
                command.sortOrder() == null ? 0 : command.sortOrder(), command.enabled() == null || command.enabled());
    }

    /**
     * Reloads the persisted store through the operational read model so mutation responses contain
     * real manager and resource counts rather than fabricated placeholders.
     */
    private AdminResponseModels.StoreProfile reloadProfile(String storeId) {
        AdminOperationsReadRepository repository = readRepository.getIfAvailable();
        if (repository == null) {
            throw new IllegalStateException("当前运行模式未配置门店读取仓储");
        }
        return repository.stores(new AdminOperationsReadRepository.StoreAccess(true, Set.of()))
                .stream()
                .filter(value -> storeId.equals(value.id()))
                .findFirst()
                .map(value -> new AdminResponseModels.StoreProfile(value.id(), value.code(), value.regionId(),
                        value.name(), value.phone(), value.province(), value.city(), value.district(), value.address(),
                        value.longitude(), value.latitude(), value.businessHours(), value.manager(), value.roomCount(),
                        value.therapistCount(), value.status(), value.rating(), value.sortOrder(), value.enabled()))
                .orElseThrow(() -> new IllegalStateException("门店保存成功但读取模型尚未同步"));
    }

    private static LocalTime[] hours(String value) {
        String[] parts = value.split("-");
        if (parts.length != 2) throw new IllegalArgumentException("营业时间格式应为 HH:mm-HH:mm");
        try {
            LocalTime open = LocalTime.parse(parts[0].trim());
            LocalTime close = LocalTime.parse(parts[1].trim());
            if (!close.isAfter(open)) throw new IllegalArgumentException("闭店时间必须晚于开店时间");
            return new LocalTime[]{open, close};
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("营业时间格式应为 HH:mm-HH:mm");
        }
    }

    private static String normalizeCode(String value) {
        String code = required(value, "门店编码不能为空").toUpperCase(Locale.ROOT).replace('-', '_');
        if (!code.matches("[A-Z0-9_]{2,32}")) throw new IllegalArgumentException("门店编码只能包含大写字母、数字和下划线");
        return code;
    }

    private static String apiId(String code) { return "store-" + code.toLowerCase(Locale.ROOT).replace('_', '-'); }
    private static String required(String value, String message) { if (value == null || value.isBlank()) throw new IllegalArgumentException(message); return value.trim(); }
    private static String blankDefault(String value, String fallback) { return value == null || value.isBlank() ? fallback : value.trim(); }

    /** Typed store mutation contract shared by create and replacement-style update. */
    public record StoreCommand(String code, Long regionId, String name, String phone, String province, String city,
                               String district, String address, BigDecimal longitude, BigDecimal latitude,
                               String businessHours, String status, BigDecimal rating, Integer sortOrder,
                               Boolean enabled) {
    }
}
