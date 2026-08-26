"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const config_1 = require("../../services/config");
const emptyProfile = {
    user: { name: '', phone: '', avatarText: '', level: '', balanceText: '', couponCount: 0, packageCount: 0 },
    title: '',
    settingsIcon: '',
    memberTitle: '',
    memberSubtitle: '',
    memberStats: [],
    shortcuts: [],
    recentBookingTitle: '',
    recentBookingActionText: '',
    menuItems: [],
    logoutText: '',
    logoutModalTitle: '',
    logoutModalContent: '',
    logoutConfirmText: '',
    logoutCancelText: ''
};
const emptyState = { loadingTitle: '', loadingDescription: '', errorTitle: '', errorMessage: '', retryText: '' };
Page({
    data: { profile: emptyProfile, recentBooking: null, stateCopy: emptyState, loading: true, error: '' },
    async onShow() { await this.loadProfile(); },
    async onPullDownRefresh() { try {
        await this.loadProfile();
    }
    finally {
        wx.stopPullDownRefresh();
    } },
    async loadProfile() {
        this.setData({ loading: true, error: '' });
        try {
            const [profile, bookings, pageStates] = await Promise.all([booking_service_1.bookingService.getProfile(), booking_service_1.bookingService.getBookings(), booking_service_1.bookingService.getPageStateDictionaries()]);
            this.setData({ profile, recentBooking: bookings[0] || null, stateCopy: pageStates.profile, loading: false });
        }
        catch (error) {
            this.setData({ loading: false, error: this.data.stateCopy.errorMessage });
        }
    },
    onShortcut(event) {
        if (event.currentTarget.dataset.key === 'orders')
            this.goOrders();
    },
    onMenu(event) {
        if (event.currentTarget.dataset.key === 'orders')
            this.goOrders();
    },
    goOrders() { wx.switchTab({ url: navigation_1.pageRoutes.orders }); },
    goRecentBooking() {
        if (!this.data.recentBooking)
            return;
        wx.navigateTo({ url: navigation_1.pageUrls.bookingDetail(this.data.recentBooking.id) });
    },
    logout() {
        wx.showModal({
            title: this.data.profile.logoutModalTitle,
            content: this.data.profile.logoutModalContent,
            confirmText: this.data.profile.logoutConfirmText,
            confirmColor: '#C25B52',
            cancelText: this.data.profile.logoutCancelText,
            success: (result) => {
                if (result.confirm) {
                    wx.removeStorageSync(config_1.AUTH_TOKEN_STORAGE_KEY);
                    wx.reLaunch({ url: navigation_1.pageRoutes.login });
                }
            }
        });
    }
});
