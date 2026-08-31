"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const payment_1 = require("../../utils/payment");
const store_actions_1 = require("../../utils/store-actions");
const ui_1 = require("../../constants/ui");
const emptyDictionaries = { pageTitle: '', detailTitle: '', statusLabel: {}, actionLabel: {}, tabs: [], detailSteps: [], codeTitle: '', codeHint: '', codeExtraHint: '', detailFields: { service: '', therapist: '', scheduledAt: '', contact: '' }, paymentTitle: '', paymentFields: { item: '', therapist: '', discount: '', paid: '' }, actionSectionTitle: '', checkinButtonText: '', cancelModalTitle: '', cancelModalContent: '', cancelModalConfirmText: '', cancelSuccessToastText: '', paySuccessToastText: '', payFailureToastText: '', cardMeta: { paidPrefix: '' }, serviceCardMeta: { durationUnit: '', servedPrefix: '', servedSuffix: '' }, storeCardMeta: { ratingUnit: '', nextAvailablePrefix: '' } };
const emptyFeedback = {};
const emptyState = { ...ui_1.defaultPageStateCopy };
const filterByTab = (bookings, tab, tabs) => {
    const tabConfig = tabs.find((item) => item.key === tab);
    if (!tabConfig?.statuses?.length)
        return bookings;
    return bookings.filter((booking) => tabConfig.statuses?.includes(booking.status));
};
Page({
    data: { bookings: [], visibleBookings: [], dictionaries: emptyDictionaries, feedback: emptyFeedback, stateCopy: emptyState, tabs: [], tab: '', actingBookingId: '', loading: true, error: '' },
    async onShow() { await this.loadOrders(); },
    async onPullDownRefresh() { try {
        await this.loadOrders();
    }
    finally {
        wx.stopPullDownRefresh();
    } },
    async loadOrders() { this.setData({ loading: true, error: '' }); try {
        const [bookings, dictionaries, feedback, pageStates] = await Promise.all([booking_service_1.bookingService.getBookings(), booking_service_1.bookingService.getOrderDictionaries(), booking_service_1.bookingService.getActionFeedbackDictionaries(), booking_service_1.bookingService.getPageStateDictionaries()]);
        const tab = this.data.tab || dictionaries.tabs[0]?.key || '';
        this.setData({ bookings, dictionaries, feedback, stateCopy: pageStates.orders, tabs: dictionaries.tabs, tab, visibleBookings: filterByTab(bookings, tab, dictionaries.tabs), loading: false });
    }
    catch (error) {
        this.setData({ loading: false, error: (0, ui_1.resolvePageError)(error, this.data.stateCopy.errorMessage) });
    } },
    detail(event) { wx.navigateTo({ url: navigation_1.pageUrls.bookingDetail(event.detail.id || '') }); },
    chooseTab(event) { const tab = String(event.currentTarget.dataset.tab || ''); this.setData({ tab, visibleBookings: filterByTab(this.data.bookings, tab, this.data.tabs), error: '' }); },
    handleAction(event) {
        const id = String(event.detail.id);
        const action = String(event.detail.action);
        if (action === 'review') {
            wx.navigateTo({ url: navigation_1.pageUrls.review(id) });
            return;
        }
        if (action === 'pay') {
            this.payBooking(id);
            return;
        }
        if (action === 'cancel') {
            this.cancelBooking(id);
            return;
        }
        if (action === 'reschedule') {
            this.reschedule(id);
            return;
        }
        if (action === 'rebook') {
            this.rebook(id);
            return;
        }
        if (action === 'show_code') {
            wx.navigateTo({ url: navigation_1.pageUrls.checkin(id) });
            return;
        }
        if (action === 'contact') {
            const booking = this.data.bookings.find((item) => item.id === id) || null;
            (0, store_actions_1.callStore)(booking?.store || null, this.data.feedback);
            return;
        }
        if (action === 'view_detail') {
            wx.navigateTo({ url: navigation_1.pageUrls.bookingDetail(id) });
            return;
        }
        wx.showToast({ title: this.data.feedback.genericUnavailable, icon: 'none' });
    },
    async payBooking(id) {
        if (this.data.actingBookingId)
            return;
        this.setData({ actingBookingId: id });
        try {
            const paidBooking = await (0, payment_1.payBookingDeposit)(id);
            const bookings = this.data.bookings.map((booking) => booking.id === id ? paidBooking : booking);
            this.setData({ bookings, visibleBookings: filterByTab(bookings, this.data.tab, this.data.tabs) });
            wx.showToast({ title: this.data.dictionaries.paySuccessToastText, icon: 'success' });
        }
        catch (error) {
            wx.showToast({ title: this.data.dictionaries.payFailureToastText, icon: 'none' });
        }
        finally {
            this.setData({ actingBookingId: '' });
        }
    },
    cancelBooking(id) {
        if (this.data.actingBookingId)
            return;
        wx.showModal({
            title: this.data.dictionaries.cancelModalTitle,
            content: this.data.dictionaries.cancelModalContent,
            confirmText: this.data.dictionaries.cancelModalConfirmText,
            confirmColor: '#C25B52',
            success: async (result) => {
                if (!result.confirm)
                    return;
                this.setData({ actingBookingId: id });
                try {
                    const cancelledBooking = await booking_service_1.bookingService.cancelBooking(id, `cancel-${Date.now()}`);
                    const bookings = this.data.bookings.map((booking) => booking.id === id ? cancelledBooking : booking);
                    this.setData({ bookings, visibleBookings: filterByTab(bookings, this.data.tab, this.data.tabs) });
                    wx.showToast({ title: this.data.dictionaries.cancelSuccessToastText, icon: 'none' });
                }
                catch (error) {
                    wx.showToast({ title: this.data.feedback.cancelUnavailable, icon: 'none' });
                }
                finally {
                    this.setData({ actingBookingId: '' });
                }
            }
        });
    },
    async rebook(id) {
        if (this.data.actingBookingId)
            return;
        this.setData({ actingBookingId: id });
        try {
            const rebookPayload = await booking_service_1.bookingService.getBookingRebookDraft(id);
            booking_1.bookingStore.update(rebookPayload.draft);
            wx.navigateTo({ url: navigation_1.pageUrls.serviceDetail(rebookPayload.draft.serviceId) });
        }
        catch (error) {
            wx.showToast({ title: this.data.feedback.genericUnavailable, icon: 'none' });
        }
        finally {
            this.setData({ actingBookingId: '' });
        }
    },
    async reschedule(id) {
        if (this.data.actingBookingId)
            return;
        this.setData({ actingBookingId: id });
        try {
            const reschedulePayload = await booking_service_1.bookingService.getBookingRescheduleDraft(id);
            booking_1.bookingStore.update(reschedulePayload.draft);
            wx.navigateTo({ url: navigation_1.pageRoutes.time });
        }
        catch (error) {
            wx.showToast({ title: this.data.feedback.genericUnavailable, icon: 'none' });
        }
        finally {
            this.setData({ actingBookingId: '' });
        }
    }
});
