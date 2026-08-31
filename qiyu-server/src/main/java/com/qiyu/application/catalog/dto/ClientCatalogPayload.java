package com.qiyu.application.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Stable, explicit client content contract. The JSON property names intentionally match the
 * mini-program's existing catalog cache so persistence can replace mock content without a UI change.
 */
public record ClientCatalogPayload(
        HomeCopy homeCopy,
        LoginCopy loginCopy,
        OrderDictionaries orderDictionaries,
        ReviewDictionaries reviewDictionaries,
        ServiceDictionaries serviceDictionaries,
        StoreDetailDictionaries storeDetailDictionaries,
        TimeDictionaries timeDictionaries,
        TherapistDictionaries therapistDictionaries,
        SuccessCopy successCopy,
        Profile profile,
        CheckinDictionaries checkinDictionaries,
        ActionFeedbackDictionaries actionFeedbackDictionaries,
        PageStateDictionaries pageStateDictionaries
) {
    public record HomeCopy(String locationText, String heroTitle, String searchPlaceholder,
                           List<QuickAction> quickActions, String frequentTitle, String frequentMoreText,
                           String nearbyTitle, String nearbySortText, String featuredServiceTitle,
                           String featuredServiceMoreText, String memberTitle, String memberSummary,
                           String memberActionText, StoreCardMeta storeCardMeta,
                           ServiceCardMeta serviceCardMeta) {}

    public record LoginCopy(String brandMark, String brandName, String brandSubtitle, String welcomeText,
                            String panelTitle, String phoneLabel, String phonePlaceholder, String codeLabel,
                            String codePlaceholder, String sendCodeText, String loginButtonText,
                            String loggingInText, String agreementText, String wechatEntryText,
                            String codeSentToastText, String agreementRequiredToastText,
                            String phoneInvalidMessage, String codeInvalidMessage, String demoCode) {}

    public record OrderDictionaries(String pageTitle, String detailTitle, BookingStatusLabel statusLabel,
                                    OrderActionLabel actionLabel, List<OrderTab> tabs,
                                    List<String> detailSteps, String codeTitle, String codeHint,
                                    String codeExtraHint, OrderDetailFields detailFields, String paymentTitle,
                                    PaymentFields paymentFields, String actionSectionTitle,
                                    String checkinButtonText, String cancelModalTitle,
                                    String cancelModalContent, String cancelModalConfirmText,
                                    String cancelSuccessToastText, String paySuccessToastText,
                                    String payFailureToastText, OrderCardMeta cardMeta,
                                    ServiceCardMeta serviceCardMeta, StoreCardMeta storeCardMeta) {
        /** Provides deterministic content only for the explicit in-memory mock profile. */
        public static OrderDictionaries mockDefault() {
            return new OrderDictionaries("我的订单", "预约详情",
                    new BookingStatusLabel("待支付", "已预约", "已签到", "待服务", "服务中", "待结算", "已完成", "已取消"),
                    new OrderActionLabel("支付订金", "取消", "改期", "联系门店", "签到码", "刷新码", "再次预约", "去评价", "查看详情"),
                    List.of(new OrderTab("all", "全部", List.of()), new OrderTab("pending_payment", "待支付", List.of("PENDING_PAYMENT")),
                            new OrderTab("arriving", "待到店", List.of("BOOKED", "CHECKED_IN")),
                            new OrderTab("in_service", "服务中", List.of("WAITING_SERVICE", "IN_SERVICE", "PENDING_SETTLEMENT")),
                            new OrderTab("completed", "已完成", List.of("COMPLETED")), new OrderTab("cancelled", "已取消", List.of("CANCELLED"))),
                    List.of("已预约", "待到店", "服务中", "已完成"), "栖愈\n预约码", "请向前台出示二维码或数字码", "请在到店当日出示，过期后可刷新预约详情。",
                    new OrderDetailFields("服务项目", "技师", "预约时间", "预约人"), "支付信息",
                    new PaymentFields("项目金额", "指定技师", "优惠抵扣", "已支付"), "可用操作", "到店签到", "取消预约",
                    "确认取消该预约？取消后将释放当前时间。", "取消预约", "预约已取消", "订金支付成功", "支付失败，请稍后重试",
                    new OrderCardMeta("实付"), new ServiceCardMeta("分钟", "已服务", "次"), new StoreCardMeta("分", "最近可约"));
        }
    }

    public record ReviewDictionaries(List<String> tags, String pageTitle, ReviewRatingFields ratingFields,
                                     String contentPlaceholder, String imageSectionTitle, String imageHintText,
                                     String addImageText, String uploadingImageText, String uploadFailedText,
                                     String retryUploadText, String anonymousText, String agreementText,
                                     String submitButtonText, String submittedButtonText, String submittingToastText,
                                     String submittedToastText, String maxTagValidationText, String maxTagToastText,
                                     String agreementRequiredMessage, String contentMinLengthMessage) {}

    public record ServiceDictionaries(String pageTitle, String allCategory, List<String> categories,
                                     String storeSwitchLabel, String searchPlaceholder, String clearSearchText,
                                     List<KeyLabel> sortOptions, ServiceCardMeta cardMeta,
                                     StoreCardMeta storeCardMeta, String bannerText, String detailTitle,
                                     String loadingTitle, String loadingDescription, String errorTitle,
                                     String errorMessage, String retryText, String loadMoreText, String favoriteText,
                                     String favoritedText, String shareText, String memberPriceLabel,
                                     String introTitle, String processTitle, String suitableTitle, String noticeTitle,
                                     String noticeText, String recommendedTherapistTitle, String nextAvailablePrefix,
                                     String reviewTitle, String reviewSummarySuffix, String primaryButtonText,
                                     String favoriteAddedToast, String favoriteRemovedToast) {
        public ServiceDictionaries withCategories(List<String> values) {
            return new ServiceDictionaries(pageTitle, allCategory, values, storeSwitchLabel, searchPlaceholder,
                    clearSearchText, sortOptions, cardMeta, storeCardMeta, bannerText, detailTitle, loadingTitle,
                    loadingDescription, errorTitle, errorMessage, retryText, loadMoreText, favoriteText, favoritedText,
                    shareText, memberPriceLabel, introTitle, processTitle, suitableTitle, noticeTitle, noticeText,
                    recommendedTherapistTitle, nextAvailablePrefix, reviewTitle, reviewSummarySuffix, primaryButtonText,
                    favoriteAddedToast, favoriteRemovedToast);
        }
    }

    public record StoreDetailDictionaries(List<KeyLabel> actions, String recommendedServiceTitle,
                                         String allServiceText, String primaryButtonText, String loadingTitle,
                                         String loadingDescription, String errorTitle, String errorMessage,
                                         String retryText, String loadMoreText, String favoriteActiveText,
                                         String favoriteAddedToast, String favoriteRemovedToast, StorePanels panels,
                                         String expandText, String collapseText, String businessHoursText,
                                         String noticeText, List<KeyLabel> tabs, String reviewTitle,
                                         String reviewSummarySuffix, StoreCardMeta storeCardMeta,
                                         ServiceCardMeta serviceCardMeta) {}

    public record TimeDictionaries(List<String> dates, List<String> dateValues, List<KeyLabel> periods,
                                   String defaultPeriod, TimeStatusLabel statusLabel, List<StatusLabel> legend) {}

    public record TherapistDictionaries(String pageTitle, List<KeyLabel> modes, String autoHint,
                                        String nextAvailablePrefix, String specifyFeePrefix, String availableText,
                                        String unavailableText, TherapistMetaCopy metaCopy) {}

    public record SuccessCopy(String title, String subtitle, String bookingCodePrefix, String codeHint,
                              String navigationActionText, String contactActionText, String reminderText,
                              String detailButtonText, String homeButtonText) {}

    public record Profile(ProfileUser user, String title, String settingsIcon, String memberTitle,
                          String memberSubtitle, List<String> memberStats, List<QuickAction> shortcuts,
                          String recentBookingTitle, String recentBookingActionText, List<MenuItem> menuItems,
                          String logoutText, String logoutModalTitle, String logoutModalContent,
                          String logoutConfirmText, String logoutCancelText) {}

    public record CheckinDictionaries(String title, String qrTitle, String refreshText, List<String> steps,
                                      String pendingButtonText, String checkingButtonText, String checkedButtonText,
                                      String successToastText, String failureToastText,
                                      List<KeyLabel> bottomActions) {}

    public record ActionFeedbackDictionaries(String supportUnavailable, String genericUnavailable,
                                            String distanceSorted, String mapUnavailable,
                                            String navigationUnavailable, String contactPlaceholder,
                                            String shareUnavailable, String therapistUnavailable, String slotFull,
                                            String checkinRepeated, String codeRefreshed, String codeRefreshHint,
                                            String codeRefreshFailed, String minGuestCount, String maxGuestCount,
                                            String cancelUnavailable) {}

    public record PageStateDictionaries(HomeState home, StoreListState stores, ListState services,
                                        ListState orders, ConfirmState confirm, LoadingState bookingDetail,
                                        TherapistState therapist, TimeState time, CheckinState checkin,
                                        SubmitState review, LoadingState success, LoadingState profile) {}

    public record QuickAction(String key, String title, String subtitle) {}
    public record KeyLabel(String key, String label) {}
    public record StatusLabel(String status, String label) {}
    public record StoreCardMeta(String ratingUnit, String nextAvailablePrefix) {}
    public record ServiceCardMeta(String durationUnit, String servedPrefix, String servedSuffix) {}
    public record OrderCardMeta(String paidPrefix) {}
    public record ReviewRatingFields(String therapist, String environment, String service) {}
    public record BookingStatusLabel(@JsonProperty("PENDING_PAYMENT") String pendingPayment,
                                     @JsonProperty("BOOKED") String booked,
                                     @JsonProperty("CHECKED_IN") String checkedIn,
                                     @JsonProperty("WAITING_SERVICE") String waitingService,
                                     @JsonProperty("IN_SERVICE") String inService,
                                     @JsonProperty("PENDING_SETTLEMENT") String pendingSettlement,
                                     @JsonProperty("COMPLETED") String completed,
                                     @JsonProperty("CANCELLED") String cancelled) {}
    public record OrderActionLabel(String pay, String cancel, String reschedule, String contact,
                                   @JsonProperty("show_code") String showCode,
                                   @JsonProperty("refresh_code") String refreshCode, String rebook,
                                   String review, @JsonProperty("view_detail") String viewDetail) {}
    public record OrderTab(String key, String label, List<String> statuses) {}
    public record OrderDetailFields(String service, String therapist, String scheduledAt, String contact) {}
    public record PaymentFields(String item, String therapist, String discount, String paid) {}
    public record StorePanels(String facilities, String businessHours, String notice) {}
    public record TimeStatusLabel(String available, String limited, String full) {}
    public record TherapistMetaCopy(String experiencePrefix, String experienceSuffix, String ratingUnit,
                                    String serviceCountPrefix, String serviceCountSuffix) {}
    public record ProfileUser(String name, String phone, String avatarText, String level, String balanceText,
                              Integer couponCount, Integer packageCount) {}
    public record MenuItem(String key, String label, String valueText) {}
    public record LoadingState(String loadingTitle, String loadingDescription, String errorTitle,
                               String errorMessage, String retryText) {}
    public record HomeState(String loadingTitle, String loadingDescription, String errorTitle,
                            String errorMessage, String retryText) {}
    public record StoreListState(String pageTitle, String searchPlaceholder, String businessOnlyText,
                                 List<KeyLabel> sortOptions, StoreCardMeta cardMeta, String mapEntryText,
                                 String locationReadyText, String locateActionText, String locationDeniedWarning,
                                 String locationFailedWarning, String loadingTitle, String loadingDescription,
                                 String errorTitle, String errorMessage, String retryText, String emptyTitle,
                                 String emptyDescription) {}
    public record ListState(String loadingTitle, String loadingDescription, String errorTitle, String errorMessage,
                            String retryText, String emptyTitle, String emptyDescription) {}
    public record ConfirmState(String loadingTitle, String loadingDescription, String errorTitle,
                               String errorMessage, String retryText, String submitErrorTitle,
                               String submitErrorMessage, String paymentRefreshErrorMessage) {}
    public record TherapistState(String loadingTitle, String loadingDescription, String errorTitle,
                                 String errorMessage, String retryText, String emptyTitle, String emptyDescription,
                                 String unavailableFilterText, String availableOnlyFilterText,
                                 String emptySummaryText, String selectedSummaryTitle, String autoSummaryTitle,
                                 String nextButtonText) {}
    public record TimeState(String pageTitle, String loadingTitle, String loadingDescription, String errorTitle,
                            String errorMessage, String retryText, String emptyTitle, String emptyDescription,
                            String noticeText, String emptyActionDateText, String emptyActionTherapistText,
                            String selectedSummaryTitle, String nextButtonText, String emptySlotText) {}
    public record CheckinState(String loadingTitle, String loadingDescription, String errorTitle,
                               String errorMessage, String retryText, String submitErrorTitle,
                               String submitErrorMessage, String refreshCodeText) {}
    public record SubmitState(String loadingTitle, String loadingDescription, String errorTitle,
                              String errorMessage, String retryText, String submitErrorTitle,
                              String submitErrorMessage) {}
}
