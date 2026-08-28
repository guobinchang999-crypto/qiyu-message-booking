package com.qiyu.adapter.schedule;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.schedule.ScheduleQueryService;
import com.qiyu.application.schedule.ScheduleQueryService.TimeSlotVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/time-slots")
public class ScheduleController {
    private final ScheduleQueryService scheduleQueryService;

    public ScheduleController(ScheduleQueryService scheduleQueryService) { this.scheduleQueryService = scheduleQueryService; }

    @GetMapping
    public ApiResponse<List<TimeSlotVO>> list(@RequestParam String storeId, @RequestParam String serviceId,
                                                        @RequestParam String therapistId, @RequestParam(required = false) String date) {
        return ApiResponse.success(scheduleQueryService.timeSlots(storeId, serviceId, therapistId, date));
    }
}
