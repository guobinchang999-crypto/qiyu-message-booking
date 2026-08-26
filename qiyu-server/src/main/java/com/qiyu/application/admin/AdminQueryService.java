package com.qiyu.application.admin;

import com.qiyu.application.booking.BookingAppService;
import com.qiyu.infrastructure.mock.MockCatalogProvider;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminQueryService {
    private final BookingAppService bookingAppService;
    private final MockCatalogProvider catalogProvider;

    public AdminQueryService(BookingAppService bookingAppService, MockCatalogProvider catalogProvider) {
        this.bookingAppService = bookingAppService;
        this.catalogProvider = catalogProvider;
    }

    public Map<String, Object> dashboard() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("statistics", List.of(
                metric("今日预约", 128, "+12.5%"), metric("待到店", 36, "+8.2%"),
                metric("服务中", 18, "+4.7%"), metric("预计营业额", "¥28,680", "+15.3%")
        ));
        result.put("revenueTrend", List.of(
                metric("08-03", 21580, null), metric("08-04", 24200, null), metric("08-05", 22980, null),
                metric("08-06", 26700, null), metric("08-07", 25120, null), metric("08-08", 28680, null)
        ));
        result.put("storeRanking", List.of(
                metric("静安寺店", 10280, "92"), metric("徐家汇店", 9460, "86"), metric("陆家嘴店", 8940, "78")
        ));
        result.put("therapistUtilization", List.of(
                utilization("林知夏", 92, "7 单服务中 / 已排 8 单"),
                utilization("沈安然", 86, "6 单服务中 / 已排 7 单"),
                utilization("周语宁", 74, "5 单服务中 / 已排 7 单")
        ));
        result.put("alerts", List.of(
                alert("warning", "2 位客户即将超过预约时间"),
                alert("error", "静安寺店 2 号房 14:00 存在资源冲突"),
                alert("processing", "1 位技师请假，受影响预约待处理")
        ));
        return result;
    }

    public Map<String, Object> bookings(String pageNum, String pageSize, String status) {
        List<Map<String, Object>> list = bookingAppService.list(status);
        Map<String, Object> page = new LinkedHashMap<>();
        page.put("list", list);
        page.put("total", list.size());
        page.put("pageNum", pageNum == null ? 1 : Integer.parseInt(pageNum));
        page.put("pageSize", pageSize == null ? 10 : Integer.parseInt(pageSize));
        return page;
    }

    public Map<String, Object> scheduleResources() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("therapistSchedules", catalogProvider.therapists().stream().map(therapist -> {
            Map<String, Object> item = new LinkedHashMap<>(therapist);
            item.put("week", List.of("上班 10:00-22:00", "上班 10:00-22:00", "休息", "已预约 14:00", "请假", "上班 10:00-22:00", "上班 10:00-22:00"));
            return item;
        }).toList());
        result.put("rooms", catalogProvider.rooms());
        result.put("conflicts", List.of("静安寺店 · 2 号房 14:00 需确认排班", "安然 14:00 后无可延长时间"));
        return result;
    }

    private static Map<String, Object> metric(String name, Object value, String comparison) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("name", name);
        item.put("value", value);
        item.put("comparison", comparison);
        return item;
    }

    private static Map<String, Object> alert(String level, String message) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("level", level);
        item.put("message", message);
        return item;
    }

    private static Map<String, Object> utilization(String name, int rate, String text) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("name", name);
        item.put("rate", rate);
        item.put("text", text);
        return item;
    }

}
