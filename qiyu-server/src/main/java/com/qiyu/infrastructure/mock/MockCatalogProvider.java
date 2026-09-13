package com.qiyu.infrastructure.mock;

import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** In-memory catalog used until the test environment and persistence are available. */
@Component
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class MockCatalogProvider {
    private final List<Map<String, Object>> stores = List.of(
            map("id", "store-jingan", "name", "静安寺店", "address", "静安区愚园路 168 号",
                    "phone", "021-6288-1688", "latitude", 31.225349, "longitude", 121.438384,
                    "distance", "1.2km", "rating", 4.9, "businessStatusCode", "OPEN", "businessStatusLabel", "营业中",
                    "nextAvailableAt", "今日 14:00", "businessHours", "10:00-22:30", "frequent", true,
                    "galleryImageUrls", List.of("/stores/jingan/cover.webp"), "facilities", List.of("独立理疗房", "茶歇区"),
                    "highlights", List.of("肩颈舒缓", "中式推拿"), "memberBenefitText", "会员权益 · 全门店通用"),
            map("id", "store-xujiahui", "name", "徐家汇店", "address", "徐汇区天钥桥路 88 号",
                    "phone", "021-6428-3288", "latitude", 31.191982, "longitude", 121.438010,
                    "distance", "3.8km", "rating", 4.8, "businessStatusCode", "OPEN", "businessStatusLabel", "营业中",
                    "nextAvailableAt", "今日 15:30", "businessHours", "10:00-22:30", "frequent", false,
                    "galleryImageUrls", List.of("/stores/xujiahui/cover.webp"), "facilities", List.of("独立理疗房", "茶歇区"),
                    "highlights", List.of("肩颈舒缓", "精油 SPA"), "memberBenefitText", "会员权益 · 全门店通用"),
            map("id", "store-lujiazui", "name", "陆家嘴店", "address", "浦东新区陆家嘴环路 1000 号",
                    "phone", "021-5888-0088", "latitude", 31.235530, "longitude", 121.502893,
                    "distance", "5.6km", "rating", 4.9, "businessStatusCode", "OPEN", "businessStatusLabel", "营业中",
                    "nextAvailableAt", "今日 16:00", "businessHours", "10:00-22:30", "frequent", false,
                    "galleryImageUrls", List.of("/stores/lujiazui/cover.webp"), "facilities", List.of("独立理疗房", "休息区"),
                    "highlights", List.of("中式推拿", "精油 SPA"), "memberBenefitText", "会员权益 · 全门店通用")
    );

    private final List<Map<String, Object>> services = List.of(
            map("id", "service-neck", "name", "肩颈舒缓", "durationMinutes", 60, "price", 198,
                    "memberPrice", 178, "category", "调理", "salesCount", 3280,
                    "tags", List.of("久坐舒缓", "热敷"), "description", "以肩颈放松和深层舒缓为重点，适合长期伏案与疲劳人群。",
                    "processSteps", List.of("热敷放松", "肌肉舒缓", "深层调理", "收尾静养"),
                    "suitableFor", "久坐、伏案、肩颈紧张或希望短暂恢复身心平衡的人。",
                    "coverImageUrl", "", "bannerImageUrl", "", "image", "service-neck"),
            map("id", "service-tui-na", "name", "中式推拿", "durationMinutes", 90, "price", 298,
                    "memberPrice", 268, "category", "推拿", "salesCount", 1890,
                    "tags", List.of("全身放松", "经络调理"), "description", "循经络与肌肉走向进行舒缓推拿，释放累积的紧张感。",
                    "processSteps", List.of("经络评估", "全身推拿", "重点舒缓", "整理放松"),
                    "suitableFor", "适合全身疲劳、运动后紧绷或希望进行系统性放松的人。",
                    "coverImageUrl", "", "bannerImageUrl", "", "image", "service-tui-na"),
            map("id", "service-spa", "name", "精油 SPA", "durationMinutes", 90, "price", 398,
                    "memberPrice", 358, "category", "SPA", "salesCount", 960,
                    "tags", List.of("芳香疗愈", "舒缓睡眠"), "description", "温润精油搭配舒缓手法，帮助身心慢下来。",
                    "processSteps", List.of("香氛选择", "精油舒缓", "背部护理", "静息放松"),
                    "suitableFor", "适合压力较大、睡眠浅或希望获得舒缓护理体验的人。",
                    "coverImageUrl", "", "bannerImageUrl", "", "image", "service-spa")
    );

    private final List<Map<String, Object>> therapists = List.of(
            map("id", "therapist-anran", "name", "安然", "storeId", "store-jingan", "level", "金牌技师",
                    "rating", 4.9, "experienceYears", 8, "serviceCount", 1280, "skills", List.of("肩颈舒缓", "中式推拿"), "extraFee", 30,
                    "nextAvailable", "今天 14:00", "status", "AVAILABLE", "statusLabel", "可预约"),
            map("id", "therapist-ziwei", "name", "紫薇", "storeId", "store-jingan", "level", "资深技师",
                    "rating", 4.8, "experienceYears", 6, "serviceCount", 860, "skills", List.of("精油 SPA", "肩颈舒缓"), "extraFee", 20,
                    "nextAvailable", "今天 15:30", "status", "AVAILABLE", "statusLabel", "可预约"),
            map("id", "therapist-yuanyuan", "name", "媛媛", "storeId", "store-xujiahui", "level", "金牌技师",
                    "rating", 4.9, "experienceYears", 9, "serviceCount", 1560, "skills", List.of("中式推拿", "精油 SPA"), "extraFee", 30,
                    "nextAvailable", "今天 13:30", "status", "BUSY", "statusLabel", "服务中"),
            map("id", "therapist-jingjing", "name", "静静", "storeId", "store-lujiazui", "level", "资深技师",
                    "rating", 4.8, "experienceYears", 5, "serviceCount", 720, "skills", List.of("肩颈舒缓", "中式推拿"), "extraFee", 20,
                    "nextAvailable", "今天 16:00", "status", "ON_LEAVE", "statusLabel", "请假")
    );

    private final List<Map<String, Object>> rooms = List.of(
            map("id", "room-jingan-01", "name", "静安寺店 · 1 号房", "storeId", "store-jingan",
                    "status", "AVAILABLE", "statusLabel", "空闲", "type", "理疗床 × 2", "note", null),
            map("id", "room-jingan-02", "name", "静安寺店 · 2 号房", "storeId", "store-jingan",
                    "status", "BOOKED", "statusLabel", "已预约", "type", "理疗床 × 1", "note", "14:00 安然"),
            map("id", "room-xujiahui-01", "name", "徐家汇店 · 1 号房", "storeId", "store-xujiahui",
                    "status", "IN_USE", "statusLabel", "使用中", "type", "SPA 床 × 1", "note", "预计 15:30 结束"),
            map("id", "room-lujiazui-01", "name", "陆家嘴店 · 1 号房", "storeId", "store-lujiazui",
                    "status", "CLEANING", "statusLabel", "清洁中", "type", "理疗床 × 2", "note", "15:00 后可用")
    );

    public List<Map<String, Object>> stores() { return stores; }
    public List<Map<String, Object>> services() { return services; }

    private List<String> serviceCategories() {
        return java.util.stream.Stream.concat(
                        java.util.stream.Stream.of("全部"),
                        services.stream().map(service -> String.valueOf(service.get("category"))).distinct())
                .toList();
    }
    public List<Map<String, Object>> therapists() { return therapists; }
    public List<Map<String, Object>> rooms() { return rooms; }

    public Map<String, Object> reviewDictionaries() {
        return map(
                "tags", List.of("手法专业", "环境安静", "准时接待", "放松有效"),
                "pageTitle", "服务评价",
                "ratingFields", map("therapist", "技师手法", "environment", "门店环境", "service", "服务体验"),
                "contentPlaceholder", "写下这次服务体验，可帮助我们持续改进",
                "imageSectionTitle", "服务照片",
                "imageHintText", "最多上传 3 张，支持预览、删除和失败重试",
                "addImageText", "添加照片",
                "uploadingImageText", "上传中",
                "uploadFailedText", "上传失败",
                "retryUploadText", "重试",
                "anonymousText", "匿名评价",
                "agreementText", "我确认评价内容真实",
                "submitButtonText", "提交评价",
                "submittedButtonText", "已提交",
                "submittingToastText", "正在提交",
                "submittedToastText", "评价已提交",
                "maxTagValidationText", "满意标签最多选择 3 个",
                "maxTagToastText", "最多选择 3 个标签",
                "agreementRequiredMessage", "请先确认评价规则",
                "contentMinLengthMessage", "评价内容至少 5 个字"
        );
    }

    public Map<String, Object> loginCopy() {
        return map(
                "brandMark", "栖",
                "brandName", "栖愈",
                "brandSubtitle", "推拿 · SPA",
                "welcomeText", "给身体一段安静的时间",
                "panelTitle", "欢迎回来",
                "phoneLabel", "手机号",
                "phonePlaceholder", "请输入手机号",
                "codeLabel", "验证码",
                "codePlaceholder", "演示验证码 123456",
                "sendCodeText", "获取验证码",
                "loginButtonText", "登录 / 注册",
                "loggingInText", "登录中",
                "agreementText", "我已阅读并同意《服务协议》和《隐私政策》",
                "wechatEntryText", "微信快捷登录（演示）",
                "codeSentToastText", "验证码已发送",
                "agreementRequiredToastText", "请先阅读并同意服务协议",
                "phoneInvalidMessage", "请输入正确的手机号",
                "codeInvalidMessage", "请输入 6 位验证码",
                "demoCode", "123456"
        );
    }

    public Map<String, Object> homeCopy() {
        return map(
                "locationText", "上海 · 静安",
                "heroTitle", "今天，想怎样被好好照顾？",
                "searchPlaceholder", "⌕ 搜索服务项目、门店或技师",
                "quickActions", List.of(
                        map("key", "booking", "title", "预约", "subtitle", "快速预约"),
                        map("key", "orders", "title", "订单", "subtitle", "查看预约"),
                        map("key", "benefits", "title", "券", "subtitle", "优惠权益"),
                        map("key", "support", "title", "◉", "subtitle", "联系客服")
                ),
                "frequentTitle", "我的常去门店",
                "frequentMoreText", "查看全部 ›",
                "nearbyTitle", "附近门店",
                "nearbySortText", "按距离排序",
                "featuredServiceTitle", "精选服务",
                "featuredServiceMoreText", "查看全部 ›",
                "memberTitle", "会员权益 · 全门店通用",
                "memberSummary", "余额 ¥680 · 2 张优惠券",
                "memberActionText", "查看权益 ›",
                "storeCardMeta", map("ratingUnit", "分", "nextAvailablePrefix", "最近可约"),
                "serviceCardMeta", map("durationUnit", "分钟", "servedPrefix", "已服务", "servedSuffix", "次")
        );
    }

    public Map<String, Object> serviceDictionaries() {
        return map(
                "pageTitle", "服务项目",
                "allCategory", "全部",
                "categories", serviceCategories(),
                "storeSwitchLabel", "静安寺店 ›",
                "searchPlaceholder", "搜索肩颈、推拿、SPA",
                "clearSearchText", "清除",
                "sortOptions", List.of(
                        map("key", "recommended", "label", "推荐优先"),
                        map("key", "sales", "label", "销量优先"),
                        map("key", "price", "label", "会员价优先")
                ),
                "cardMeta", map("durationUnit", "分钟", "servedPrefix", "已服务", "servedSuffix", "次"),
                "storeCardMeta", map("ratingUnit", "分", "nextAvailablePrefix", "最近可约"),
                "bannerText", "会员权益 · 全门店通用 · 精选项目今日可约",
                "detailTitle", "服务详情",
                "loadingTitle", "正在加载服务详情",
                "loadingDescription", "请稍候",
                "errorTitle", "服务详情加载失败",
                "errorMessage", "服务详情加载失败，请稍后重试",
                "retryText", "重试",
                "loadMoreText", "加载更多评价",
                "favoriteText", "收藏",
                "favoritedText", "已收藏",
                "shareText", "分享",
                "memberPriceLabel", "会员价",
                "introTitle", "服务介绍",
                "processTitle", "服务流程",
                "suitableTitle", "适合人群",
                "noticeTitle", "注意事项",
                "noticeText", "请提前 10 分钟到店；如需改期，请尽量在预约前联系门店。",
                "recommendedTherapistTitle", "推荐技师",
                "nextAvailablePrefix", "最近可约",
                "reviewTitle", "用户评价",
                "reviewSummarySuffix", "次服务后持续收集反馈，以下为近期真实体验摘要。",
                "primaryButtonText", "选择技师",
                "favoriteAddedToast", "已加入收藏",
                "favoriteRemovedToast", "已取消收藏"
        );
    }

    public Map<String, Object> storeDetailDictionaries() {
        return map(
                "actions", List.of(
                        map("key", "navigation", "label", "导航"),
                        map("key", "contact", "label", "联系门店"),
                        map("key", "favorite", "label", "收藏")
                ),
                "recommendedServiceTitle", "推荐服务",
                "allServiceText", "全部 ›",
                "primaryButtonText", "立即预约",
                "loadingTitle", "正在加载门店详情",
                "loadingDescription", "请稍候",
                "errorTitle", "门店详情加载失败",
                "errorMessage", "门店详情加载失败，请稍后重试",
                "retryText", "重试",
                "loadMoreText", "加载更多评价",
                "favoriteActiveText", "已收藏",
                "favoriteAddedToast", "已收藏门店",
                "favoriteRemovedToast", "已取消收藏",
                "panels", map("facilities", "设施服务", "businessHours", "营业时间", "notice", "预约须知"),
                "expandText", "展开",
                "collapseText", "收起",
                "businessHoursText", "每日 10:00-22:00，最晚可预约 20:00 场次。",
                "noticeText", "请提前 10 分钟到店；如需取消或改期，请尽量提前联系门店。",
                "tabs", List.of(
                        map("key", "services", "label", "项目"),
                        map("key", "therapists", "label", "技师"),
                        map("key", "reviews", "label", "评价")
                ),
                "reviewTitle", "门店评价",
                "reviewSummarySuffix", "分 · 以下为近期到店体验摘要。",
                "storeCardMeta", map("ratingUnit", "分", "nextAvailablePrefix", "最近可约"),
                "serviceCardMeta", map("durationUnit", "分钟", "servedPrefix", "已服务", "servedSuffix", "次")
        );
    }

    public Map<String, Object> timeDictionaries() {
        java.util.List<String> labels = new java.util.ArrayList<>();
        java.util.List<String> values = new java.util.ArrayList<>();
        java.time.LocalDate today = java.time.LocalDate.now();
        String[] weekdays = {"周日", "周一", "周二", "周三", "周四", "周五", "周六"};
        for (int offset = 0; offset < 7; offset++) {
            java.time.LocalDate date = today.plusDays(offset);
            labels.add((offset == 0 ? "今天" : weekdays[date.getDayOfWeek().getValue() % 7]) + "\n" + date.getMonthValue() + "月" + date.getDayOfMonth() + "日");
            values.add(date.toString());
        }
        return map(
                "dates", labels,
                "dateValues", values,
                "periods", List.of(
                        map("key", "MORNING", "label", "上午"),
                        map("key", "AFTERNOON", "label", "下午"),
                        map("key", "EVENING", "label", "晚上")
                ),
                "defaultPeriod", "AFTERNOON",
                "statusLabel", map("available", "可预约", "limited", "即将约满", "full", "已约满"),
                "legend", List.of(
                        map("status", "available", "label", "可预约"),
                        map("status", "limited", "label", "即将约满"),
                        map("status", "full", "label", "已约满")
                )
        );
    }

    public Map<String, Object> therapistDictionaries() {
        return map(
                "pageTitle", "选择技师",
                "modes", List.of(
                        map("key", "specified", "label", "指定技师"),
                        map("key", "auto", "label", "系统自动分配")
                ),
                "autoHint", "系统将为你匹配当前最合适的可约技师",
                "nextAvailablePrefix", "最近可约",
                "specifyFeePrefix", "指定费",
                "availableText", "可指定",
                "unavailableText", "当前不可约",
                "metaCopy", map(
                        "experiencePrefix", "从业",
                        "experienceSuffix", "年",
                        "ratingUnit", "分",
                        "serviceCountPrefix", "服务",
                        "serviceCountSuffix", "次"
                )
        );
    }

    public Map<String, Object> successCopy() {
        return map(
                "title", "预约成功",
                "subtitle", "已为你保留安静的放松时光",
                "bookingCodePrefix", "预约编号",
                "codeHint", "到店后可在预约详情或签到页出示预约码。",
                "navigationActionText", "导航",
                "contactActionText", "联系门店",
                "reminderText", "到店前 30 分钟将再次提醒你，请提前 10 分钟到店。",
                "detailButtonText", "查看预约详情",
                "homeButtonText", "返回首页"
        );
    }

    public Map<String, Object> profile() {
        return map(
                "user", map("name", "林知夏", "phone", "138****1288", "avatarText", "林",
                        "level", "栖愈银卡会员", "balanceText", "680.00", "couponCount", 2, "packageCount", 4),
                "title", "我的",
                "settingsIcon", "⚙",
                "memberTitle", "会员权益 · 全门店通用",
                "memberSubtitle", "每一次停下来，都值得被温柔照顾",
                "memberStats", List.of("余额 ¥680.00", "套餐 4 次", "优惠券 2 张"),
                "shortcuts", List.of(
                        map("key", "orders", "title", "预约", "subtitle", "我的预约"),
                        map("key", "coupons", "title", "券", "subtitle", "优惠券"),
                        map("key", "packages", "title", "卡", "subtitle", "套餐卡"),
                        map("key", "favorites", "title", "♡", "subtitle", "收藏")
                ),
                "recentBookingTitle", "最近预约",
                "recentBookingActionText", "查看详情 ›",
                "menuItems", List.of(
                        map("key", "orders", "label", "最近预约", "valueText", "查看全部 ›"),
                        map("key", "contacts", "label", "常用联系人", "valueText", "›"),
                        map("key", "support", "label", "联系客服", "valueText", "›"),
                        map("key", "settings", "label", "设置", "valueText", "›")
                ),
                "logoutText", "退出登录",
                "logoutModalTitle", "退出登录",
                "logoutModalContent", "退出后将回到登录页，当前预约记录不会被删除。",
                "logoutConfirmText", "退出",
                "logoutCancelText", "取消"
        );
    }

    public Map<String, Object> checkinDictionaries() {
        return map(
                "title", "到店签到",
                "qrTitle", "栖愈\n预约二维码",
                "refreshText", "二维码每 5 分钟自动刷新",
                "steps", List.of("预约成功", "到店签到", "等待服务"),
                "pendingButtonText", "我已到店",
                "checkingButtonText", "签到中",
                "checkedButtonText", "已完成签到",
                "successToastText", "签到成功，前台将为你安排房间",
                "failureToastText", "签到失败，请稍后重试",
                "bottomActions", List.of(
                        map("key", "navigation", "label", "导航到店"),
                        map("key", "contact", "label", "联系门店")
                )
        );
    }

    public Map<String, Object> actionFeedbackDictionaries() {
        return map(
                "supportUnavailable", "客服入口将在接入企微后开放",
                "genericUnavailable", "该入口暂不可用",
                "distanceSorted", "已按距离展示附近门店",
                "mapUnavailable", "地图暂不可用，请稍后重试",
                "navigationUnavailable", "导航能力将在接入定位后开放",
                "contactPlaceholder", "已为你呼出门店联系电话占位",
                "shareUnavailable", "分享能力将在小程序环境中接入",
                "therapistUnavailable", "该技师当前不可约",
                "slotFull", "该时间已约满",
                "checkinRepeated", "当前预约无需重复签到",
                "codeRefreshed", "签到码已刷新",
                "codeRefreshHint", "二维码已刷新，请向前台出示最新页面",
                "codeRefreshFailed", "刷新失败，请稍后重试",
                "minGuestCount", "至少 1 人",
                "maxGuestCount", "最多 4 人",
                "cancelUnavailable", "取消失败，请稍后重试"
        );
    }

    public Map<String, Object> pageStateDictionaries() {
        return map(
                "home", map(
                        "loadingTitle", "正在加载首页",
                        "loadingDescription", "为你整理常去门店和附近门店",
                        "errorTitle", "首页加载失败",
                        "errorMessage", "首页数据加载失败，请稍后重试",
                        "retryText", "重试"
                ),
                "stores", map(
                        "pageTitle", "选择门店",
                        "searchPlaceholder", "搜索门店或地址",
                        "businessOnlyText", "营业中",
                        "sortOptions", List.of(
                                map("key", "frequent", "label", "常去优先"),
                                map("key", "distance", "label", "距离优先"),
                                map("key", "rating", "label", "评分优先")
                        ),
                        "cardMeta", map("ratingUnit", "分", "nextAvailablePrefix", "最近可约"),
                        "mapEntryText", "打开地图选择位置",
                        "locationReadyText", "定位正常",
                        "locateActionText", "重新定位",
                        "locationDeniedWarning", "定位权限未开启，当前按默认城市门店距离展示。",
                        "locationFailedWarning", "定位暂时失败，可以稍后重试或直接选择门店。",
                        "loadingTitle", "正在加载门店",
                        "loadingDescription", "为你整理常去门店和附近门店",
                        "errorTitle", "门店加载失败",
                        "errorMessage", "门店加载失败，请稍后重试",
                        "retryText", "重试",
                        "emptyTitle", "没有找到匹配门店",
                        "emptyDescription", "可以更换关键词，或取消营业中筛选后再试"
                ),
                "services", map(
                        "loadingTitle", "正在加载服务项目",
                        "loadingDescription", "为你整理全门店通用的可约项目",
                        "errorTitle", "服务项目加载失败",
                        "errorMessage", "服务项目加载失败，请稍后重试",
                        "retryText", "重试",
                        "emptyTitle", "没有找到匹配项目",
                        "emptyDescription", "可以更换关键词或切换分类"
                ),
                "orders", map(
                        "loadingTitle", "正在加载订单",
                        "loadingDescription", "请稍候",
                        "errorTitle", "订单加载失败",
                        "errorMessage", "订单加载失败，请稍后重试",
                        "retryText", "重试",
                        "emptyTitle", "暂无对应订单",
                        "emptyDescription", "切换其他状态，或返回首页预约新的服务"
                ),
                "confirm", map(
                        "loadingTitle", "正在加载预约信息",
                        "loadingDescription", "请稍候",
                        "errorTitle", "预约信息加载失败",
                        "errorMessage", "预约信息加载失败，请稍后重试",
                        "retryText", "重试",
                        "submitErrorTitle", "无法提交预约",
                        "submitErrorMessage", "预约提交失败，请稍后重试",
                        "paymentRefreshErrorMessage", "人数变更后费用刷新失败，请重试"
                ),
                "bookingDetail", map(
                        "loadingTitle", "正在加载预约详情",
                        "loadingDescription", "请稍候",
                        "errorTitle", "预约详情加载失败",
                        "errorMessage", "预约详情加载失败，请稍后重试",
                        "retryText", "重试"
                ),
                "therapist", map(
                        "loadingTitle", "正在加载技师",
                        "loadingDescription", "为你查询当前可约技师",
                        "errorTitle", "技师加载失败",
                        "errorMessage", "技师加载失败，请稍后重试",
                        "retryText", "重试",
                        "emptyTitle", "暂无可指定技师",
                        "emptyDescription", "可以切换为系统自动分配",
                        "unavailableFilterText", "显示全部技师",
                        "availableOnlyFilterText", "仅看可约技师",
                        "emptySummaryText", "请选择可指定技师",
                        "selectedSummaryTitle", "已选技师",
                        "autoSummaryTitle", "系统自动分配",
                        "nextButtonText", "下一步"
                ),
                "time", map(
                        "pageTitle", "选择时间",
                        "loadingTitle", "正在加载可约时间",
                        "loadingDescription", "为你查询当前门店排班",
                        "errorTitle", "时间加载失败",
                        "errorMessage", "可约时间加载失败，请稍后重试",
                        "retryText", "重试",
                        "emptyTitle", "暂无可约时间",
                        "emptyDescription", "请更换日期或技师后再试",
                        "noticeText", "温馨提示：请提前 10 分钟到店，迟到可能影响服务时长。",
                        "emptyActionDateText", "换个日期",
                        "emptyActionTherapistText", "更换技师",
                        "selectedSummaryTitle", "已选时间",
                        "nextButtonText", "下一步",
                        "emptySlotText", "请选择可预约时间"
                ),
                "checkin", map(
                        "loadingTitle", "正在加载签到信息",
                        "loadingDescription", "请稍候",
                        "errorTitle", "签到信息加载失败",
                        "errorMessage", "签到信息加载失败，请稍后重试",
                        "retryText", "重试",
                        "submitErrorTitle", "签到失败",
                        "submitErrorMessage", "签到失败，请联系前台或稍后重试",
                        "refreshCodeText", "刷新签到码"
                ),
                "review", map(
                        "loadingTitle", "正在加载评价信息",
                        "loadingDescription", "请稍候",
                        "errorTitle", "评价信息加载失败",
                        "errorMessage", "评价信息加载失败，请稍后重试",
                        "retryText", "重试",
                        "submitErrorTitle", "评价提交失败",
                        "submitErrorMessage", "评价提交失败，请稍后重试"
                ),
                "success", map(
                        "loadingTitle", "正在加载预约结果",
                        "loadingDescription", "请稍候",
                        "errorTitle", "预约结果加载失败",
                        "errorMessage", "预约结果加载失败，请稍后重试",
                        "retryText", "重试"
                ),
                "profile", map(
                        "loadingTitle", "正在加载我的页面",
                        "loadingDescription", "请稍候",
                        "errorTitle", "我的页面加载失败",
                        "errorMessage", "我的页面加载失败，请稍后重试",
                        "retryText", "重试"
                )
        );
    }

    public Map<String, Object> findStore(String id) { return findById(stores, id, "门店不存在"); }
    public Map<String, Object> findService(String id) { return findById(services, id, "服务项目不存在"); }
    public Map<String, Object> findTherapist(String id) { return findById(therapists, id, "技师不存在"); }
    public Map<String, Object> findRoom(String id) { return findById(rooms, id, "房间不存在"); }

    public List<Map<String, Object>> therapists(String storeId, String serviceId) {
        String serviceName = serviceId == null || serviceId.isBlank() ? null : String.valueOf(findService(serviceId).get("name"));
        return therapists.stream()
                .filter(item -> storeId == null || storeId.isBlank() || storeId.equals(item.get("storeId")))
                .filter(item -> serviceName == null || ((List<?>) item.get("skills")).contains(serviceName))
                .toList();
    }

    public List<Map<String, Object>> rooms(String storeId, String status) {
        return rooms.stream()
                .filter(item -> storeId == null || storeId.isBlank() || storeId.equals(item.get("storeId")))
                .filter(item -> status == null || status.isBlank() || status.equals(item.get("status")))
                .toList();
    }

    private Map<String, Object> findById(List<Map<String, Object>> source, String id, String message) {
        return source.stream().filter(item -> id.equals(item.get("id"))).findFirst()
                .orElseThrow(() -> new IllegalArgumentException(message));
    }

    private static Map<String, Object> map(Object... entries) {
        Map<String, Object> value = new LinkedHashMap<>();
        for (int index = 0; index < entries.length; index += 2) {
            value.put(String.valueOf(entries[index]), entries[index + 1]);
        }
        return value;
    }
}
