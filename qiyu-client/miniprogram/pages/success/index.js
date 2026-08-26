"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const store_actions_1 = require("../../utils/store-actions");
const emptySuccessCopy = { title: '', subtitle: '', bookingCodePrefix: '', codeHint: '', navigationActionText: '', contactActionText: '', reminderText: '', detailButtonText: '', homeButtonText: '' };
const emptyFeedback = {};
const emptyState = { loadingTitle: '', loadingDescription: '', errorTitle: '', errorMessage: '', retryText: '' };
Page({
    data: {
        booking: null,
        copy: emptySuccessCopy,
        feedback: emptyFeedback,
        stateCopy: emptyState,
        bookingId: 'booking-1001',
        loading: true,
        error: ''
    },
    async onLoad(query) {
        this.setData({ bookingId: query.id || 'booking-1001' });
        await this.loadBooking();
    },
    async loadBooking() {
        this.setData({ loading: true, error: '' });
        try {
            const [{ booking, copy }, feedback, pageStates] = await Promise.all([
                booking_service_1.bookingService.getBookingSuccess(this.data.bookingId),
                booking_service_1.bookingService.getActionFeedbackDictionaries(),
                booking_service_1.bookingService.getPageStateDictionaries()
            ]);
            this.setData({
                booking,
                copy,
                feedback,
                stateCopy: pageStates.success,
                loading: false
            });
        }
        catch (error) {
            this.setData({ loading: false, error: this.data.stateCopy.errorMessage });
        }
    },
    detail() {
        if (!this.data.booking)
            return;
        wx.redirectTo({ url: navigation_1.pageUrls.bookingDetail(this.data.booking.id) });
    },
    navigateStore() {
        (0, store_actions_1.navigateToStore)(this.data.booking?.store || null, this.data.feedback);
    },
    contactStore() {
        (0, store_actions_1.callStore)(this.data.booking?.store || null, this.data.feedback);
    },
    home() {
        wx.switchTab({ url: navigation_1.pageRoutes.home });
    }
});
