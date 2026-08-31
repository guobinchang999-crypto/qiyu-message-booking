package com.qiyu.infrastructure.system;

import com.qiyu.application.system.dto.SystemModels.RoleCommand;
import com.qiyu.infrastructure.persistence.entity.SystemRoleEntity;
import com.qiyu.infrastructure.persistence.mapper.SystemManagementMapper;
import com.qiyu.infrastructure.persistence.mapper.SystemRoleProjection;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Guards the scope-type normalization contract: only the six English enums and their
 * explicit Chinese labels are accepted, unknown values must fail instead of silently
 * degrading to {@code SELF}, and explicit DENY permissions survive a role save.
 */
@ExtendWith(MockitoExtension.class)
class SystemManagementRepositoryTests {
    @Mock
    private SystemManagementMapper mapper;

    @InjectMocks
    private SystemManagementRepository repository;

    @Test
    void rejectsUnknownEnglishScopeType() {
        stubGeneratedRoleId();
        assertThatThrownBy(() -> repository.saveRole(null, role("TOTALLY_UNKNOWN", "ENABLED"), 9001L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("数据范围类型不正确");
    }

    @Test
    void rejectsUnknownChineseLabel() {
        stubGeneratedRoleId();
        assertThatThrownBy(() -> repository.saveRole(null, role("任意门店", "ENABLED"), 9001L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("数据范围类型不正确");
    }

    @Test
    void rejectsBlankScopeType() {
        stubGeneratedRoleId();
        assertThatThrownBy(() -> repository.saveRole(null, role("", "ENABLED"), 9001L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("数据范围类型不正确");
    }

    @Test
    void rejectsNullScopeType() {
        stubGeneratedRoleId();
        assertThatThrownBy(() -> repository.saveRole(null, role(null, "ENABLED"), 9001L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("数据范围类型不正确");
    }

    @Test
    void mapsForbiddenLabelToNone() {
        stubGeneratedRoleId();
        stubRoleReadback();
        repository.saveRole(null, role("禁止访问", "ENABLED"), 9001L);
        verify(mapper, atLeastOnce()).insertRoleScope(eq(100L), anyString(), eq("NONE"));
        verify(mapper, never()).insertRoleScope(anyLong(), anyString(), eq("SELF"));
    }

    @Test
    void acceptsEnglishEnumUnchanged() {
        stubGeneratedRoleId();
        stubRoleReadback();
        repository.saveRole(null, role("ALL_STORES", "ENABLED"), 9001L);
        verify(mapper, atLeastOnce()).insertRoleScope(eq(100L), anyString(), eq("ALL_STORES"));
    }

    @Test
    void rejectsOverlappingAllowAndDenyPermissions() {
        RoleCommand command = new RoleCommand("TEST_ROLE", "测试角色", List.of("booking:read"), List.of("booking:read"),
                "SELF", "ENABLED");
        assertThatThrownBy(() -> repository.saveRole(null, command, 9001L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("权限不能同时允许和禁止：booking:read");
    }

    @Test
    void persistsDeniedPermissionsWithDenyEffect() {
        stubGeneratedRoleId();
        stubRoleReadback();
        when(mapper.permissionId("booking:cancel")).thenReturn(7L);
        RoleCommand command = new RoleCommand("TEST_ROLE", "测试角色", List.of(), List.of("booking:cancel"), "SELF", "ENABLED");
        repository.saveRole(null, command, 9001L);
        verify(mapper).insertRolePermission(100L, 7L, "DENY");
    }

    private RoleCommand role(String dataScope, String status) {
        return new RoleCommand("TEST_ROLE", "测试角色", List.of(), List.of(), dataScope, status);
    }

    /** Simulates MyBatis generated-key population so downstream mapper calls receive a concrete role id. */
    private void stubGeneratedRoleId() {
        doAnswer(invocation -> {
            SystemRoleEntity entity = invocation.getArgument(0);
            entity.setId(100L);
            return 1;
        }).when(mapper).insertRole(any(SystemRoleEntity.class));
    }

    /** Returns the persisted role readback that completes the save transaction. */
    private void stubRoleReadback() {
        when(mapper.roles(anyString(), anyString(), anyInt(), anyInt())).thenReturn(List.of(
                new SystemRoleProjection(100L, "TEST_ROLE", "测试角色", "", "", "SELF", 0L, "ENABLED")));
    }
}
