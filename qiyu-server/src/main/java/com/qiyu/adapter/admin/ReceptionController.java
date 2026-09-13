package com.qiyu.adapter.admin;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.booking.ReceptionService;
import com.qiyu.application.booking.dto.ReceptionModels.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/admin/reception") @SaCheckLogin
public class ReceptionController {
    private final ReceptionService service;
    public ReceptionController(ReceptionService service) { this.service=service; }
    @GetMapping("/bookings") public ApiResponse<Page> list(@ModelAttribute Query query) { return ApiResponse.success(service.list(query)); }
    @GetMapping("/bookings/{id}") public ApiResponse<Entry> detail(@PathVariable String id) { return ApiResponse.success(service.detail(id)); }
    @GetMapping("/options") public ApiResponse<Options> options() { return ApiResponse.success(service.options()); }
    @PostMapping("/availability") public ApiResponse<Availability> availability(@Valid @RequestBody Placement input) { return ApiResponse.success(service.availability(input)); }
    @PostMapping("/checkin/resolve") public ApiResponse<Entry> resolve(@Valid @RequestBody Code input) { return ApiResponse.success(service.resolve(input)); }
    @PostMapping("/checkin/confirm") public ApiResponse<Entry> confirm(@Valid @RequestBody Code input) { return ApiResponse.success(service.confirm(input)); }
    @PostMapping("/bookings/{id}/actions") public ApiResponse<Entry> action(@PathVariable String id,@Valid @RequestBody Action input) { return ApiResponse.success(service.action(id,input)); }
    @PutMapping("/bookings/{id}") public ApiResponse<Entry> change(@PathVariable String id,@RequestBody Change input) { return ApiResponse.success(service.change(id,input)); }
    @GetMapping("/bookings/{id}/history") public ApiResponse<List<Audit>> history(@PathVariable String id) { return ApiResponse.success(service.history(id)); }
    @PostMapping("/customers/lookup") public ApiResponse<Customer> lookup(@Valid @RequestBody CustomerInput input) { return ApiResponse.success(service.lookup(input)); }
    @PostMapping("/customers") public ApiResponse<Customer> createCustomer(@Valid @RequestBody CustomerInput input) { return ApiResponse.success(service.createCustomer(input)); }
}
