package com.qiyu.adapter.system;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.system.SystemManagementAppService;
import com.qiyu.application.system.SystemModels;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** HTTP adapter for system administration; authorization remains in the application service. */
@RestController
@RequestMapping("/admin/system")
@SaCheckLogin
public class SystemManagementController {
    private final SystemManagementAppService service;

    public SystemManagementController(SystemManagementAppService service) { this.service = service; }

    @GetMapping("/organizations") public ApiResponse<SystemModels.Page<SystemModels.Organization>> organizations(@RequestParam(defaultValue = "") String keyword, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int pageSize) { return ApiResponse.success(service.organizations(keyword, page, pageSize)); }
    @PostMapping("/organizations") public ApiResponse<SystemModels.Organization> createOrganization(@RequestBody SystemModels.OrganizationCommand command) { return ApiResponse.success(service.saveOrganization(null, command)); }
    @PutMapping("/organizations/{id}") public ApiResponse<SystemModels.Organization> updateOrganization(@PathVariable String id, @RequestBody SystemModels.OrganizationCommand command) { return ApiResponse.success(service.saveOrganization(id, command)); }
    @DeleteMapping("/organizations/{id}") public ApiResponse<Void> deleteOrganization(@PathVariable String id) { service.deleteOrganization(id); return ApiResponse.success(null); }

    @GetMapping("/users") public ApiResponse<SystemModels.Page<SystemModels.User>> users(@RequestParam(defaultValue = "") String keyword, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int pageSize) { return ApiResponse.success(service.users(keyword, page, pageSize)); }
    @PostMapping("/users") public ApiResponse<SystemModels.User> createUser(@RequestBody SystemModels.UserCommand command) { return ApiResponse.success(service.saveUser(null, command)); }
    @PutMapping("/users/{id}") public ApiResponse<SystemModels.User> updateUser(@PathVariable String id, @RequestBody SystemModels.UserCommand command) { return ApiResponse.success(service.saveUser(id, command)); }
    @DeleteMapping("/users/{id}") public ApiResponse<Void> deleteUser(@PathVariable String id) { service.deleteUser(id); return ApiResponse.success(null); }
    /** Resets a staff password through the audited credential service. */
    @PostMapping("/users/{id}/password")
    public ApiResponse<Void> resetUserPassword(@PathVariable String id,
                                               @RequestBody SystemModels.PasswordResetCommand command) {
        service.resetUserPassword(id, command);
        return ApiResponse.success(null);
    }

    /** Returns the persisted user override including temporary store and region grants. */
    @GetMapping("/users/{id}/data-scope")
    public ApiResponse<SystemModels.UserDataScope> userDataScope(@PathVariable String id) {
        return ApiResponse.success(service.userDataScope(id));
    }

    /** Atomically replaces one user's complete data-scope override. */
    @PutMapping("/users/{id}/data-scope")
    public ApiResponse<SystemModels.UserDataScope> saveUserDataScope(
            @PathVariable String id,
            @RequestBody SystemModels.UserDataScopeCommand command
    ) {
        return ApiResponse.success(service.saveUserDataScope(id, command));
    }

    /** Removes the user override so subsequent requests inherit current role defaults. */
    @DeleteMapping("/users/{id}/data-scope")
    public ApiResponse<SystemModels.UserDataScope> clearUserDataScope(@PathVariable String id) {
        return ApiResponse.success(service.clearUserDataScope(id));
    }

    /** Supplies stable store and region IDs for the authorization editor. */
    @GetMapping("/data-scope-options")
    public ApiResponse<SystemModels.DataScopeOptions> dataScopeOptions() {
        return ApiResponse.success(service.dataScopeOptions());
    }

    @GetMapping("/roles") public ApiResponse<SystemModels.Page<SystemModels.Role>> roles(@RequestParam(defaultValue = "") String keyword, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int pageSize) { return ApiResponse.success(service.roles(keyword, page, pageSize)); }
    @PostMapping("/roles") public ApiResponse<SystemModels.Role> createRole(@RequestBody SystemModels.RoleCommand command) { return ApiResponse.success(service.saveRole(null, command)); }
    @PutMapping("/roles/{id}") public ApiResponse<SystemModels.Role> updateRole(@PathVariable String id, @RequestBody SystemModels.RoleCommand command) { return ApiResponse.success(service.saveRole(id, command)); }
    @DeleteMapping("/roles/{id}") public ApiResponse<Void> deleteRole(@PathVariable String id) { service.deleteRole(id); return ApiResponse.success(null); }

    @GetMapping("/menus") public ApiResponse<SystemModels.Page<SystemModels.Menu>> menus(@RequestParam(defaultValue = "") String keyword, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int pageSize) { return ApiResponse.success(service.menus(keyword, page, pageSize)); }
    @PostMapping("/menus") public ApiResponse<SystemModels.Menu> createMenu(@RequestBody SystemModels.MenuCommand command) { return ApiResponse.success(service.saveMenu(null, command)); }
    @PutMapping("/menus/{id}") public ApiResponse<SystemModels.Menu> updateMenu(@PathVariable String id, @RequestBody SystemModels.MenuCommand command) { return ApiResponse.success(service.saveMenu(id, command)); }
    @DeleteMapping("/menus/{id}") public ApiResponse<Void> deleteMenu(@PathVariable String id) { service.deleteMenu(id); return ApiResponse.success(null); }

    @GetMapping("/dictionaries") public ApiResponse<SystemModels.Page<SystemModels.Dictionary>> dictionaries(@RequestParam(defaultValue = "") String keyword, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int pageSize) { return ApiResponse.success(service.dictionaries(keyword, page, pageSize)); }
    @PostMapping("/dictionaries") public ApiResponse<SystemModels.Dictionary> createDictionary(@RequestBody SystemModels.DictionaryCommand command) { return ApiResponse.success(service.saveDictionary(null, command)); }
    @PutMapping("/dictionaries/{id}") public ApiResponse<SystemModels.Dictionary> updateDictionary(@PathVariable String id, @RequestBody SystemModels.DictionaryCommand command) { return ApiResponse.success(service.saveDictionary(id, command)); }
    @DeleteMapping("/dictionaries/{id}") public ApiResponse<Void> deleteDictionary(@PathVariable String id) { service.deleteDictionary(id); return ApiResponse.success(null); }

    @GetMapping("/audit-logs") public ApiResponse<SystemModels.Page<SystemModels.AuditLog>> auditLogs(@RequestParam(defaultValue = "") String keyword, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int pageSize) { return ApiResponse.success(service.auditLogs(keyword, page, pageSize)); }
}
