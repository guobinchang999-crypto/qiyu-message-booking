package com.qiyu.adapter.admin;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.room.RoomManagementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** HTTP adapter for administration room master-data operations. */
@RestController
@RequestMapping("/admin/rooms")
@SaCheckLogin
public class RoomManagementController {
    private final RoomManagementService roomManagementService;

    public RoomManagementController(RoomManagementService roomManagementService) {
        this.roomManagementService = roomManagementService;
    }

    /** Returns rooms filtered by the authenticated operator's room READ scope. */
    @GetMapping
    public ApiResponse<List<RoomManagementService.RoomView>> list() {
        return ApiResponse.success(roomManagementService.list());
    }

    /** Creates one room under an authorized stable store identifier. */
    @PostMapping
    public ApiResponse<RoomManagementService.RoomView> create(@Valid @RequestBody RoomRequest request) {
        return ApiResponse.success(roomManagementService.create(request.toCommand()));
    }

    /** Replaces mutable room master data while retaining the stable room identifier. */
    @PutMapping("/{id}")
    public ApiResponse<RoomManagementService.RoomView> update(@PathVariable String id,
                                                               @Valid @RequestBody RoomRequest request) {
        return ApiResponse.success(roomManagementService.update(id, request.toCommand()));
    }

    /** Soft-deletes an unreferenced room inside the operator's room MANAGE scope. */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        roomManagementService.delete(id);
        return ApiResponse.success(null);
    }

    /** Validated HTTP contract kept separate from the application command. */
    public record RoomRequest(@NotBlank String storeId,
                              @NotBlank @Size(max = 32) String code,
                              @NotBlank @Size(max = 64) String name,
                              @NotBlank @Size(max = 32) String kind,
                              Integer capacity,
                              @NotBlank String status,
                              @Size(max = 255) String note,
                              Integer sortOrder,
                              Boolean enabled) {
        /** Converts validated transport data into the typed application command. */
        RoomManagementService.RoomCommand toCommand() {
            return new RoomManagementService.RoomCommand(storeId, code, name, kind, capacity, status, note, sortOrder, enabled);
        }
    }
}
