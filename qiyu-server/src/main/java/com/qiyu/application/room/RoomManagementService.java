package com.qiyu.application.room;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.domain.auth.DataAccessScope;
import com.qiyu.domain.room.RoomStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Coordinates room CRUD with function permissions, store scope, and booking-reference rules. */
@Service
public class RoomManagementService {
    private static final String RESOURCE = "room";
    private static final String READ = "READ";
    private static final String MANAGE = "MANAGE";

    private final AuthAppService authAppService;
    private final RoomManagementRepository repository;

    public RoomManagementService(AuthAppService authAppService, RoomManagementRepository repository) {
        this.authAppService = authAppService;
        this.repository = repository;
    }

    /** Lists only rooms whose stores are inside the current room READ scope. */
    @Transactional(readOnly = true)
    public List<RoomView> list() {
        AuthPrincipal principal = authAppService.requirePermission("room:read");
        RoomManagementRepository.RoomAccess access = access(principal, READ);
        return repository.findAll(access).stream().map(RoomManagementService::view).toList();
    }

    /** Creates a room after resolving and authorizing its stable store association. */
    @Transactional
    public RoomView create(RoomCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("room:manage");
        RoomManagementRepository.StoreIdentity store = requireStore(command.storeId());
        requireStoreAccess(principal, MANAGE, store.id());
        RoomValues values = values(command);
        if (repository.existsCode(store.databaseId(), values.code(), null)) {
            throw new IllegalArgumentException("同一门店下房间编码已存在");
        }
        return view(repository.save(record(null, store, values)));
    }

    /** Updates a room while checking both its current and requested store associations. */
    @Transactional
    public RoomView update(String roomId, RoomCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("room:manage");
        RoomManagementRepository.RoomRecord current = requireRoom(roomId);
        requireStoreAccess(principal, MANAGE, current.storeId());
        RoomManagementRepository.StoreIdentity store = requireStore(command.storeId());
        requireStoreAccess(principal, MANAGE, store.id());
        RoomValues values = values(command);
        if (repository.existsCode(store.databaseId(), values.code(), current.databaseId())) {
            throw new IllegalArgumentException("同一门店下房间编码已存在");
        }
        return view(repository.save(record(current.databaseId(), store, values)));
    }

    /** Deletes a room only when no future or unfinished booking still owns its identity. */
    @Transactional
    public void delete(String roomId) {
        AuthPrincipal principal = authAppService.requirePermission("room:manage");
        RoomManagementRepository.RoomRecord current = requireRoom(roomId);
        requireStoreAccess(principal, MANAGE, current.storeId());
        requireDeletionAllowed(repository.hasBlockingBookingReferences(current.databaseId()));
        repository.delete(current.databaseId());
    }

    /** Keeps the deletion invariant directly testable without persistence or HTTP concerns. */
    static void requireDeletionAllowed(boolean hasBlockingReferences) {
        if (hasBlockingReferences) {
            throw new IllegalArgumentException("房间仍被未来或未完成预约引用，不能删除");
        }
    }

    private RoomManagementRepository.RoomAccess access(AuthPrincipal principal, String action) {
        if (principal.permissions().contains("*")) {
            return new RoomManagementRepository.RoomAccess(true, Set.of());
        }
        DataAccessScope scope = principal.scopeFor(RESOURCE, action);
        return new RoomManagementRepository.RoomAccess(scope.allowsAllStores(), scope.storeIds());
    }

    private void requireStoreAccess(AuthPrincipal principal, String action, String storeId) {
        if (!principal.permissions().contains("*") && !principal.canAccessStore(RESOURCE, action, storeId)) {
            throw new SecurityException("没有权限访问该门店的房间");
        }
    }

    private RoomManagementRepository.StoreIdentity requireStore(String storeId) {
        String value = required(storeId, "门店不能为空");
        return repository.findStore(value).orElseThrow(() -> new IllegalArgumentException("门店不存在"));
    }

    private RoomManagementRepository.RoomRecord requireRoom(String roomId) {
        return repository.find(required(roomId, "房间编号不能为空"))
                .orElseThrow(() -> new IllegalArgumentException("房间不存在"));
    }

    private static RoomValues values(RoomCommand command) {
        String code = required(command.code(), "房间编码不能为空").toUpperCase(Locale.ROOT);
        if (!code.matches("[A-Z0-9_\\-]{1,32}")) {
            throw new IllegalArgumentException("房间编码只能包含字母、数字、下划线和连字符");
        }
        String name = required(command.name(), "房间名称不能为空");
        String kind = required(command.kind(), "房间类型不能为空").toUpperCase(Locale.ROOT);
        int capacity = command.capacity() == null ? 1 : command.capacity();
        if (capacity < 1 || capacity > 20) {
            throw new IllegalArgumentException("房间容量必须在 1 到 20 之间");
        }
        String status = required(command.status(), "房间状态不能为空").toUpperCase(Locale.ROOT);
        try {
            RoomStatus.valueOf(status);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("房间状态不正确");
        }
        String note = command.note() == null || command.note().isBlank() ? null : command.note().trim();
        if (note != null && note.length() > 255) throw new IllegalArgumentException("房间备注不能超过255个字符");
        return new RoomValues(code, name, kind, capacity, status, note,
                command.sortOrder() == null ? 0 : command.sortOrder(),
                command.enabled() == null || command.enabled());
    }

    private static RoomManagementRepository.RoomRecord record(Long databaseId,
                                                               RoomManagementRepository.StoreIdentity store,
                                                               RoomValues values) {
        String id = databaseId == null ? null : "room-" + databaseId;
        return new RoomManagementRepository.RoomRecord(databaseId, id, store.databaseId(), store.id(), store.name(),
                values.code(), values.name(), values.kind(), values.capacity(), values.status(),
                values.note(), values.sortOrder(), values.enabled());
    }

    private static RoomView view(RoomManagementRepository.RoomRecord room) {
        return new RoomView(room.id(), room.storeId(), room.storeName(), room.code(), room.name(), room.kind(),
                room.capacity(), room.status(), RoomStatus.valueOf(room.status()).label(), room.note(),
                room.sortOrder(), room.enabled());
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    /** Typed input used by create and replacement-style update operations. */
    public record RoomCommand(String storeId, String code, String name, String kind, Integer capacity,
                              String status, String note, Integer sortOrder, Boolean enabled) {
    }

    /** Stable administration response independent of the room table representation. */
    public record RoomView(String id, String storeId, String storeName, String code, String name, String kind,
                           int capacity, String status, String statusLabel, String note, int sortOrder, boolean enabled) {
    }

    private record RoomValues(String code, String name, String kind, int capacity, String status,
                              String note, int sortOrder, boolean enabled) {
    }
}
