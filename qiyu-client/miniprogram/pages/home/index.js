"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const ui_1 = require("../../constants/ui");
const emptyHomeCopy = { locationText: '', heroTitle: '', searchPlaceholder: '', quickActions: [], frequentTitle: '', frequentMoreText: '', nearbyTitle: '', nearbySortText: '', featuredServiceTitle: '', featuredServiceMoreText: '', memberTitle: '', memberSummary: '', memberActionText: '', storeCardMeta: { ratingUnit: '', nextAvailablePrefix: '' }, serviceCardMeta: { durationUnit: '', servedPrefix: '', servedSuffix: '' } };
const emptyFeedback = {};
const emptyState = { ...ui_1.defaultPageStateCopy };
Page({
    data: { frequentStores: [], nearbyStores: [], services: [], therapists: [], copy: emptyHomeCopy, quickActions: [], feedback: emptyFeedback, stateCopy: emptyState, loading: true, error: '' },
    async onShow() { await this.loadHome(); },
    async onPullDownRefresh() { try {
        await this.loadHome();
    }
    finally {
        wx.stopPullDownRefresh();
    } },
    async loadHome() { this.setData({ loading: true, error: '' }); try {
        const [data, feedback, pageStates] = await Promise.all([booking_service_1.bookingService.getHome(), booking_service_1.bookingService.getActionFeedbackDictionaries(), booking_service_1.bookingService.getPageStateDictionaries()]);
        this.setData({ frequentStores: data.frequentStores, nearbyStores: data.nearbyStores, services: data.featuredServices, therapists: data.featuredTherapists, copy: data.copy, quickActions: data.copy.quickActions.map((action) => ({ ...action, isSupport: action.key === 'support' })), feedback, stateCopy: pageStates.home, loading: false });
    }
    catch (error) {
        this.setData({ loading: false, error: (0, ui_1.resolvePageError)(error, this.data.stateCopy.errorMessage) });
    } },
    onQuickAction(event) {
        const key = String(event.currentTarget.dataset.key || '');
        if (key === 'booking') {
            this.goServices();
            return;
        }
        if (key === 'orders') {
            this.goOrders();
            return;
        }
        if (key === 'benefits' || key === 'coupons' || key === 'packages') {
            this.goProfile();
            return;
        }
        wx.showToast({ title: this.data.feedback.genericUnavailable, icon: 'none' });
    },
    onSupportContactError() { wx.showToast({ title: this.data.feedback.supportUnavailable, icon: 'none' }); },
    goStores() { wx.navigateTo({ url: navigation_1.pageRoutes.stores }); },
    goServices() { wx.switchTab({ url: navigation_1.pageRoutes.services }); },
    goStore(event) {
        const storeId = event.detail.id || '';
        if (!storeId)
            return;
        booking_1.bookingStore.selectStore(storeId);
        wx.navigateTo({ url: navigation_1.pageUrls.storeDetail(storeId) });
    },
    goService(event) {
        const serviceId = event.detail.id || '';
        if (!serviceId)
            return;
        booking_1.bookingStore.selectService(serviceId);
        wx.navigateTo({ url: navigation_1.pageUrls.serviceDetail(serviceId) });
    },
    goOrders() { wx.switchTab({ url: navigation_1.pageRoutes.orders }); },
    goProfile() { wx.switchTab({ url: navigation_1.pageRoutes.profile }); },
    showDistanceSort() { wx.showToast({ title: this.data.feedback.distanceSorted, icon: 'none' }); }
});
