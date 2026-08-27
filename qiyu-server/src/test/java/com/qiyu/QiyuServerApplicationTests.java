package com.qiyu;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@SpringBootTest
class QiyuServerApplicationTests {
    @Autowired
    private MockMvc mockMvc;
    private String customerToken;
    private String adminToken;

    @BeforeEach
    void authenticateRequests() throws Exception {
        customerToken = issueToken("{\"clientType\":\"MINI_PROGRAM\",\"grantType\":\"SMS_CODE\",\"identifier\":\"13800001288\",\"credential\":\"123456\"}");
        adminToken = issueToken("{\"clientType\":\"ADMIN_WEB\",\"grantType\":\"PASSWORD\",\"identifier\":\"admin\",\"credential\":\"123456\"}");
    }

    private String issueToken(String requestBody) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login").contentType(APPLICATION_JSON).content(requestBody))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(response, "$.data.accessToken");
    }

    private ResultActions clientPerform(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + customerToken));
    }

    private ResultActions adminPerform(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + adminToken));
    }

    @Test
    void contextLoads() {
        // Ensures the COLA Light wiring can start without external infrastructure.
    }

    @Test
    void protectedEndpointsRejectAnonymousRequests() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
        mockMvc.perform(get("/api/v1/member/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void customerCannotEnterAdminDomainOrReadAnotherCustomersBooking() throws Exception {
        clientPerform(get("/api/v1/admin/dashboard"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
        clientPerform(get("/api/v1/bookings/BK-202608-1999"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    void employeeWithoutDashboardPermissionIsRejected() throws Exception {
        String employeeToken = issueToken("{\"clientType\":\"ADMIN_WEB\",\"grantType\":\"PASSWORD\",\"identifier\":\"employee\",\"credential\":\"123456\"}");
        mockMvc.perform(get("/api/v1/admin/dashboard").header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    void logoutImmediatelyInvalidatesTheSession() throws Exception {
        clientPerform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk());
        clientPerform(get("/api/v1/member/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void mockAuthSupportsCodeIssueAndLogin() throws Exception {
        clientPerform(post("/api/v1/auth/send-code")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"mobile":"13800001288"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mobile").value("13800001288"))
                .andExpect(jsonPath("$.data.expiresIn").value(60))
                .andExpect(jsonPath("$.data.verificationCode").value("123456"))
                .andExpect(jsonPath("$.data.mock").value(true));

        clientPerform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"mobile":"13800001288","code":"123456"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.mobile").value("13800001288"));
    }

    @Test
    void mockAuthRejectsInvalidCode() throws Exception {
        clientPerform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"mobile":"13800001288","code":"000000"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void catalogDictionariesExposeBackendStatusOptions() throws Exception {
        clientPerform(get("/api/v1/catalog/dictionaries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookingStatus", hasSize(8)))
                .andExpect(jsonPath("$.data.bookingStatus[0].value").value("PENDING_PAYMENT"))
                .andExpect(jsonPath("$.data.roomStatus[0].value").value("AVAILABLE"))
                .andExpect(jsonPath("$.data.timeSlotStatus[0].label").value("可预约"));
    }

    @Test
    void adminDashboardContractExposesArrivalRateForRemoteMapping() throws Exception {
        adminPerform(get("/api/v1/admin/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.statistics", hasSize(4)))
                .andExpect(jsonPath("$.data.storeRanking[0].name").value("静安寺店"))
                .andExpect(jsonPath("$.data.storeRanking[0].comparison").value("92"))
                .andExpect(jsonPath("$.data.therapistUtilization", hasSize(3)))
                .andExpect(jsonPath("$.data.therapistUtilization[0].rate").value(92))
                .andExpect(jsonPath("$.data.revenueTrend", hasSize(6)));
    }

    @Test
    void adminScheduleResourcesContractExposesWeeklySchedulesAndRooms() throws Exception {
        adminPerform(get("/api/v1/admin/schedule-resources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.therapistSchedules", hasSize(4)))
                .andExpect(jsonPath("$.data.therapistSchedules[0].week", hasSize(7)))
                .andExpect(jsonPath("$.data.rooms", hasSize(4)))
                .andExpect(jsonPath("$.data.rooms[0].status").value("AVAILABLE"));
    }

    @Test
    void storeManagerCannotReadAnotherStoreBookingOrItsDraft() throws Exception {
        String managerToken = issueToken("{\"clientType\":\"ADMIN_WEB\",\"grantType\":\"PASSWORD\",\"identifier\":\"manager\",\"credential\":\"123456\"}");

        mockMvc.perform(get("/api/v1/bookings/BK-202608-1999").header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/bookings/BK-202608-1999/rebook-draft").header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeCannotReadAnotherTherapistBooking() throws Exception {
        String employeeToken = issueToken("{\"clientType\":\"ADMIN_WEB\",\"grantType\":\"PASSWORD\",\"identifier\":\"employee\",\"credential\":\"123456\"}");

        mockMvc.perform(get("/api/v1/bookings/BK-202608-1999").header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void catalogResourceOptionsSupportStoreFiltering() throws Exception {
        clientPerform(get("/api/v1/stores"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].businessStatusCode").value("OPEN"))
                .andExpect(jsonPath("$.data[0].businessStatusLabel").value("营业中"))
                .andExpect(jsonPath("$.data[0].phone").value("021-6288-1688"))
                .andExpect(jsonPath("$.data[0].latitude").value(31.225349))
                .andExpect(jsonPath("$.data[0].longitude").value(121.438384));

        clientPerform(get("/api/v1/catalog/options/therapists")
                        .param("storeId", "store-jingan")
                        .param("serviceId", "service-neck"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].storeId").value("store-jingan"));

        clientPerform(get("/api/v1/catalog/options/rooms")
                        .param("storeId", "store-jingan")
                        .param("status", "AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].value").value("room-jingan-01"));
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
    void timeSlotsRespectServiceBuffersAndResourceOverlap() throws Exception {
        clientPerform(get("/api/v1/time-slots")
                        .param("storeId", "store-jingan")
                        .param("serviceId", "service-neck")
                        .param("therapistId", "therapist-anran")
                        .param("date", "2026-08-08"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].time").value("10:00"))
                .andExpect(jsonPath("$.data[0].status").value("FULL"))
                .andExpect(jsonPath("$.data[1].time").value("10:30"))
                .andExpect(jsonPath("$.data[1].status").value("FULL"))
                .andExpect(jsonPath("$.data[4].time").value("14:00"))
                .andExpect(jsonPath("$.data[4].status").value("AVAILABLE"));
    }

    @Test
    void serviceCatalogKeepsClientDisplayFields() throws Exception {
        clientPerform(get("/api/v1/services/service-neck"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("调理"))
                .andExpect(jsonPath("$.data.salesCount").value(3280))
                .andExpect(jsonPath("$.data.tags[0]").value("久坐舒缓"))
                .andExpect(jsonPath("$.data.processSteps[0]").value("热敷放松"))
                .andExpect(jsonPath("$.data.suitableFor").value("久坐、伏案、肩颈紧张或希望短暂恢复身心平衡的人。"));
    }

    @Test
    void clientCatalogExposesMiniProgramDictionaries() throws Exception {
        clientPerform(get("/api/v1/catalog/client"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.homeCopy.memberTitle").value("会员权益 · 全门店通用"))
                .andExpect(jsonPath("$.data.homeCopy.serviceCardMeta.durationUnit").value("分钟"))
                .andExpect(jsonPath("$.data.orderDictionaries.statusLabel.BOOKED").value("已预约"))
                .andExpect(jsonPath("$.data.orderDictionaries.actionLabel.refresh_code").value("刷新码"))
                .andExpect(jsonPath("$.data.orderDictionaries.paymentFields.discount").value("优惠抵扣"))
                .andExpect(jsonPath("$.data.orderDictionaries.codeExtraHint").value("请在到店当日出示，过期后可刷新预约详情。"))
                .andExpect(jsonPath("$.data.orderDictionaries.tabs[1].key").value("pending_payment"))
                .andExpect(jsonPath("$.data.orderDictionaries.cancelModalTitle").value("取消预约"))
                .andExpect(jsonPath("$.data.orderDictionaries.paySuccessToastText").value("订金支付成功"))
                .andExpect(jsonPath("$.data.orderDictionaries.cardMeta.paidPrefix").value("实付"))
                .andExpect(jsonPath("$.data.reviewDictionaries.ratingFields.therapist").value("技师手法"))
                .andExpect(jsonPath("$.data.reviewDictionaries.addImageText").value("添加照片"))
                .andExpect(jsonPath("$.data.serviceDictionaries.pageTitle").value("服务项目"))
                .andExpect(jsonPath("$.data.serviceDictionaries.categories[1]").value("调理"))
                .andExpect(jsonPath("$.data.serviceDictionaries.clearSearchText").value("清除"))
                .andExpect(jsonPath("$.data.serviceDictionaries.sortOptions[2].key").value("price"))
                .andExpect(jsonPath("$.data.serviceDictionaries.cardMeta.servedPrefix").value("已服务"))
                .andExpect(jsonPath("$.data.serviceDictionaries.storeCardMeta.ratingUnit").value("分"))
                .andExpect(jsonPath("$.data.serviceDictionaries.reviewSummarySuffix").value("次服务后持续收集反馈，以下为近期真实体验摘要。"))
                .andExpect(jsonPath("$.data.serviceDictionaries.loadMoreText").value("加载更多评价"))
                .andExpect(jsonPath("$.data.loginCopy.loginButtonText").value("登录 / 注册"))
                .andExpect(jsonPath("$.data.therapistDictionaries.availableText").value("可指定"))
                .andExpect(jsonPath("$.data.therapistDictionaries.metaCopy.serviceCountSuffix").value("次"))
                .andExpect(jsonPath("$.data.successCopy.navigationActionText").value("导航"))
                .andExpect(jsonPath("$.data.profile.recentBookingTitle").value("最近预约"))
                .andExpect(jsonPath("$.data.serviceDictionaries.introTitle").value("服务介绍"))
                .andExpect(jsonPath("$.data.storeDetailDictionaries.primaryButtonText").value("立即预约"))
                .andExpect(jsonPath("$.data.storeDetailDictionaries.panels.facilities").value("设施服务"))
                .andExpect(jsonPath("$.data.storeDetailDictionaries.storeCardMeta.ratingUnit").value("分"))
                .andExpect(jsonPath("$.data.storeDetailDictionaries.reviewSummarySuffix").value("分 · 以下为近期到店体验摘要。"))
                .andExpect(jsonPath("$.data.storeDetailDictionaries.loadMoreText").value("加载更多评价"))
                .andExpect(jsonPath("$.data.checkinDictionaries.pendingButtonText").value("我已到店"))
                .andExpect(jsonPath("$.data.actionFeedbackDictionaries.mapUnavailable").value("地图暂不可用，请稍后重试"))
                .andExpect(jsonPath("$.data.actionFeedbackDictionaries.navigationUnavailable").value("导航能力将在接入定位后开放"))
                .andExpect(jsonPath("$.data.actionFeedbackDictionaries.codeRefreshFailed").value("刷新失败，请稍后重试"))
                .andExpect(jsonPath("$.data.actionFeedbackDictionaries.cancelUnavailable").value("取消失败，请稍后重试"))
                .andExpect(jsonPath("$.data.pageStateDictionaries.stores.sortOptions[0].key").value("frequent"))
                .andExpect(jsonPath("$.data.pageStateDictionaries.stores.mapEntryText").value("打开地图选择位置"))
                .andExpect(jsonPath("$.data.pageStateDictionaries.stores.locateActionText").value("重新定位"))
                .andExpect(jsonPath("$.data.pageStateDictionaries.stores.cardMeta.nextAvailablePrefix").value("最近可约"))
                .andExpect(jsonPath("$.data.pageStateDictionaries.services.emptyTitle").value("没有找到匹配项目"))
                .andExpect(jsonPath("$.data.timeDictionaries.periods[1].key").value("AFTERNOON"))
                .andExpect(jsonPath("$.data.timeDictionaries.periods[1].label").value("下午"))
                .andExpect(jsonPath("$.data.pageStateDictionaries.time.pageTitle").value("选择时间"))
                .andExpect(jsonPath("$.data.pageStateDictionaries.time.emptyActionTherapistText").value("更换技师"));
    }

    @Test
    void bookingConfirmationReturnsAggregatedSummary() throws Exception {
        clientPerform(post("/api/v1/bookings/confirmation")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "storeId": "store-jingan",
                                  "serviceId": "service-neck",
                                  "date": "2026-08-08",
                                  "startTime": "14:00",
                                  "guestCount": 2,
                                  "couponId": "新人体验券 ¥20"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.store.id").value("store-jingan"))
                .andExpect(jsonPath("$.data.therapistDisplayName").value("系统自动分配技师"))
                .andExpect(jsonPath("$.data.payment.itemAmount").value(356))
                .andExpect(jsonPath("$.data.payment.discountAmount").value(20))
                .andExpect(jsonPath("$.data.payment.depositDue").value(100))
                .andExpect(jsonPath("$.data.guestCount").value(2))
                .andExpect(jsonPath("$.data.pageTitle").value("确认预约"))
                .andExpect(jsonPath("$.data.editActions.therapist").value("修改技师"))
                .andExpect(jsonPath("$.data.cardMeta.durationUnit").value("分钟"))
                .andExpect(jsonPath("$.data.formCopy.contactRequiredMessage").value("请填写预约人姓名"));
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
    void bookingFulfillmentTransitionsFollowExplicitDomainRules() throws Exception {
        clientPerform(post("/api/v1/bookings/BK-202608-1000/checkin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CHECKED_IN"));
        adminPerform(post("/api/v1/bookings/BK-202608-1000/start-service"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_SERVICE"));
        adminPerform(post("/api/v1/bookings/BK-202608-1000/finish-service"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING_SETTLEMENT"));
        adminPerform(post("/api/v1/bookings/BK-202608-1000/settle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
    void bookingFulfillmentRejectsInvalidTransitions() throws Exception {
        adminPerform(post("/api/v1/bookings/BK-202608-1001/start-service"))
                .andExpect(status().isBadRequest());
        adminPerform(post("/api/v1/bookings/BK-202608-1000/settle"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createBookingUsesIdAfterSeededMockBookings() throws Exception {
        clientPerform(post("/api/v1/bookings")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "storeId": "store-jingan",
                                  "serviceId": "service-neck",
                                  "therapistId": "therapist-anran",
                                  "date": "2026-08-08",
                                  "startTime": "18:00",
                                  "customerName": "林知夏",
                                  "mobile": "13800001288"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("BK-202608-1003"));
    }

    @Test
    void memberProfileReturnsUnifiedBenefits() throws Exception {
        clientPerform(get("/api/v1/member/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.name").value("林知夏"))
                .andExpect(jsonPath("$.data.memberTitle").value("会员权益 · 全门店通用"))
                .andExpect(jsonPath("$.data.shortcuts", hasSize(4)))
                .andExpect(jsonPath("$.data.menuItems[0].key").value("orders"))
                .andExpect(jsonPath("$.data.logoutModalTitle").value("退出登录"));
    }

    @Test
    void storeReviewsCanBeFilteredByStore() throws Exception {
        clientPerform(get("/api/v1/reviews").param("storeId", "store-jingan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andExpect(jsonPath("$.data.total").value(5))
                .andExpect(jsonPath("$.data.hasMore").value(true))
                .andExpect(jsonPath("$.data.items[0].storeId").value("store-jingan"))
                .andExpect(jsonPath("$.data.items[0].tags", hasSize(2)));

        clientPerform(get("/api/v1/reviews")
                        .param("storeId", "store-jingan")
                        .param("serviceId", "service-neck"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andExpect(jsonPath("$.data.total").value(4))
                .andExpect(jsonPath("$.data.hasMore").value(true))
                .andExpect(jsonPath("$.data.items[0].serviceId").value("service-neck"));
    }

    @Test
    void reviewImageUploadReturnsMockCdnUrl() throws Exception {
        clientPerform(post("/api/v1/reviews/images")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "fileName": "review-1.jpg",
                                  "requestId": "upload-test"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.imageUrl").value("https://mock-cdn.qiyu.local/reviews/review-1.jpg"))
                .andExpect(jsonPath("$.data.fileName").value("review-1.jpg"));
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
    void submittedReviewAppearsInFilteredReviewList() throws Exception {
        clientPerform(post("/api/v1/reviews")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "bookingId": "BK-202608-1000",
                                  "storeRating": 5,
                                  "therapistRating": 5,
                                  "serviceRating": 5,
                                  "tags": ["手法专业"],
                                  "content": "这次肩颈放松很到位",
                                  "anonymous": true,
                                  "imageUrls": ["https://mock-cdn.qiyu.local/reviews/review-1.jpg"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.review.storeId").value("store-jingan"))
                .andExpect(jsonPath("$.data.review.serviceId").value("service-neck"))
                .andExpect(jsonPath("$.data.review.userName").value("匿名用户"))
                .andExpect(jsonPath("$.data.review.imageUrls", hasSize(1)));

        clientPerform(get("/api/v1/reviews")
                        .param("storeId", "store-jingan")
                        .param("serviceId", "service-neck"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].content").value("这次肩颈放松很到位"))
                .andExpect(jsonPath("$.data.items[0].tags[0]").value("手法专业"));
    }

    @Test
    void bookingSuccessReturnsBookingAndCopy() throws Exception {
        clientPerform(get("/api/v1/bookings/BK-202608-1000/success"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.booking.id").value("BK-202608-1000"))
                .andExpect(jsonPath("$.data.copy.title").value("预约成功"))
                .andExpect(jsonPath("$.data.copy.detailButtonText").value("查看预约详情"));
    }

    @Test
    void rebookDraftReturnsEditableBookingDraft() throws Exception {
        clientPerform(get("/api/v1/bookings/BK-202608-1000/rebook-draft"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sourceBookingId").value("BK-202608-1000"))
                .andExpect(jsonPath("$.data.draft.storeId").value("store-jingan"))
                .andExpect(jsonPath("$.data.draft.serviceId").value("service-neck"))
                .andExpect(jsonPath("$.data.draft.therapistMode").value("auto"))
                .andExpect(jsonPath("$.data.draft.guestCount").value(1));
    }

    @Test
    void rescheduleDraftReturnsCurrentResourceAndEmptySlot() throws Exception {
        clientPerform(get("/api/v1/bookings/BK-202608-1002/reschedule-draft"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sourceBookingId").value("BK-202608-1002"))
                .andExpect(jsonPath("$.data.draft.storeId").value("store-jingan"))
                .andExpect(jsonPath("$.data.draft.serviceId").value("service-neck"))
                .andExpect(jsonPath("$.data.draft.therapistMode").value("specified"))
                .andExpect(jsonPath("$.data.draft.therapistId").value("therapist-anran"))
                .andExpect(jsonPath("$.data.draft.guestCount").value(1))
                .andExpect(jsonPath("$.data.draft.flow").value("reschedule"))
                .andExpect(jsonPath("$.data.draft.sourceBookingId").value("BK-202608-1002"));
    }

    @Test
    void rescheduleBookingUpdatesAppointmentTime() throws Exception {
        clientPerform(post("/api/v1/bookings/BK-202608-1002/reschedule")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-10",
                                  "startTime": "16:00"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("BK-202608-1002"))
                .andExpect(jsonPath("$.data.appointmentDate").value("2026-08-10"))
                .andExpect(jsonPath("$.data.startTime").value("16:00"));
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
    void conflictingCreateAndRescheduleAreRejectedWithoutMutatingOriginalBooking() throws Exception {
        clientPerform(post("/api/v1/bookings")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "storeId": "store-jingan",
                                  "serviceId": "service-neck",
                                  "therapistId": "therapist-anran",
                                  "date": "2026-08-08",
                                  "startTime": "10:30",
                                  "customerName": "冲突测试",
                                  "mobile": "13800001288"
                                }
                                """))
                .andExpect(status().isBadRequest());

        clientPerform(post("/api/v1/bookings/BK-202608-1002/reschedule")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-08",
                                  "startTime": "10:30"
                                }
                                """))
                .andExpect(status().isBadRequest());

        clientPerform(get("/api/v1/bookings/BK-202608-1002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.appointmentDate").value("2026-08-11"))
                .andExpect(jsonPath("$.data.startTime").value("10:00"));
    }

    @Test
    void cancelBookingChangesStatus() throws Exception {
        clientPerform(post("/api/v1/bookings/BK-202608-1000/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("BK-202608-1000"))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.statusLabel").value("已取消"));

        clientPerform(get("/api/v1/bookings/BK-202608-1000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    void payBookingChangesPendingPaymentToBooked() throws Exception {
        clientPerform(post("/api/v1/bookings/BK-202608-1001/payment")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "requestId": "pay-test"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookingId").value("BK-202608-1001"))
                .andExpect(jsonPath("$.data.paymentNo").value("PAY-BK-202608-1001-pay-test"))
                .andExpect(jsonPath("$.data.parameters.package").value("prepay_id=mock-BK-202608-1001"))
                .andExpect(jsonPath("$.data.parameters.mockPayment").value(true));

        clientPerform(post("/api/v1/bookings/BK-202608-1001/pay"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("BK-202608-1001"))
                .andExpect(jsonPath("$.data.status").value("BOOKED"))
                .andExpect(jsonPath("$.data.statusLabel").value("已预约"));
    }

    @Test
    void refreshBookingVerificationCodeReturnsNewCode() throws Exception {
        clientPerform(post("/api/v1/bookings/BK-202608-1002/verification-code/refresh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("BK-202608-1002"))
                .andExpect(jsonPath("$.data.verificationCode", matchesPattern("\\d{6}")))
                .andExpect(jsonPath("$.data.verificationQrImageUrl", matchesPattern("https://mock-cdn\\.qiyu\\.local/checkin/\\d{6}\\.png")));
    }
}
