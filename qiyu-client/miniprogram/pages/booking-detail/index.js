"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const payment_1 = require("../../utils/payment");
const store_actions_1 = require("../../utils/store-actions");
const emptyDictionaries = { pageTitle: '', detailTitle: '', statusLabel: {}, actionLabel: {}, tabs: [], detailSteps: [], codeTitle: '', codeHint: '', codeExtraHint: '', detailFields: { service: '', therapist: '', scheduledAt: '', contact: '' }, paymentTitle: '', paymentFields: { item: '', therapist: '', discount: '', paid: '' }, actionSectionTitle: '', checkinButtonText: '', cancelModalTitle: '', cancelModalContent: '', cancelModalConfirmText: '', cancelSuccessToastText: '', paySuccessToastText: '', payFailureToastText: '', cardMeta: { paidPrefix: '' }, serviceCardMeta: { durationUnit: '', servedPrefix: '', servedSuffix: '' }, storeCardMeta: { ratingUnit: '', nextAvailablePrefix: '' } };
const emptyFeedback = {};
const emptyState = { loadingTitle: '', loadingDescription: '', errorTitle: '', errorMessage: '', retryText: '' };
const formatCode = (code) => {
    if (code.length <= 6)
        return code;
    return code.replace(/(.{3})/g, '$1 ').trim();
};
const buildSteps = (booking, labels) => {
    const activeIndexByStatus = {
        PENDING_PAYMENT: 0,
        BOOKED: 1,
        CHECKED_IN: 1,
        WAITING_SERVICE: 2,
        IN_SERVICE: 2,
        PENDING_SETTLEMENT: 2,
        COMPLETED: 3,
        CANCELLED: 0
    };
    const activeIndex = activeIndexByStatus[booking.status];
    return labels.map((label, index) => ({ label, state: index < activeIndex ? 'done' : index === activeIndex ? 'active' : '' }));
};
const buildDetailRows = (booking, dictionaries) => [
    { key: 'service', label: dictionaries.detailFields.service, value: `${booking.service.name} · ${booking.service.durationMinutes}${dictionaries.serviceCardMeta.durationUnit}` },
    { key: 'therapist', label: dictionaries.detailFields.therapist, value: booking.therapist.name },
    { key: 'scheduledAt', label: dictionaries.detailFields.scheduledAt, value: booking.scheduledAt },
    { key: 'contact', label: dictionaries.detailFields.contact, value: booking.contact }
];
const buildPaymentRows = (booking, dictionaries) => [
    { key: 'item', label: dictionaries.paymentFields.item, value: `¥${booking.payment.itemAmount}` },
    { key: 'therapist', label: dictionaries.paymentFields.therapist, value: `¥${booking.payment.therapistFee}` },
    { key: 'discount', label: dictionaries.paymentFields.discount, value: `-¥${booking.payment.discountAmount}`, tone: 'discount' },
    { key: 'paid', label: dictionaries.paymentFields.paid, value: `¥${booking.payment.paidAmount}` }
];
Page({
    data: {
        booking: null,
        bookingId: 'booking-1001',
        dictionaries: emptyDictionaries,
        feedback: emptyFeedback,
        stateCopy: emptyState,
        statusText: '',
        steps: [],
        detailRows: [],
        paymentRows: [],
        codeText: '',
        qrImageLoadFailed: false,
        canCheckin: false,
        acting: false,
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
            const [booking, dictionaries, feedback, pageStates] = await Promise.all([
                booking_service_1.bookingService.getBooking(this.data.bookingId),
                booking_service_1.bookingService.getOrderDictionaries(),
                booking_service_1.bookingService.getActionFeedbackDictionaries(),
                booking_service_1.bookingService.getPageStateDictionaries()
            ]);
            this.setData({
                booking,
                dictionaries,
                feedback,
                stateCopy: pageStates.bookingDetail,
                statusText: dictionaries.statusLabel[booking.status] || dictionaries.statusLabel.BOOKED || '',
                steps: buildSteps(booking, dictionaries.detailSteps),
                detailRows: buildDetailRows(booking, dictionaries),
                paymentRows: buildPaymentRows(booking, dictionaries),
                codeText: formatCode(booking.code),
                qrImageLoadFailed: false,
                canCheckin: booking.status === 'BOOKED',
                loading: false
            });
        }
        catch (error) {
            this.setData({ loading: false, error: this.data.stateCopy.errorMessage });
        }
    },
    checkin() {
        if (!this.data.booking || this.data.loading || this.data.acting || !this.data.canCheckin)
            return;
        wx.navigateTo({ url: navigation_1.pageUrls.checkin(this.data.booking.id) });
    },
    handleAction(event) {
        const action = String(event.currentTarget.dataset.action || '');
        if (!this.data.booking || this.data.acting)
            return;
        if (action === 'show_code') {
            wx.navigateTo({ url: navigation_1.pageUrls.checkin(this.data.booking.id) });
            return;
        }
        if (action === 'refresh_code') {
            this.refreshCode();
            return;
        }
        if (action === 'pay') {
            this.payBooking();
            return;
        }
        if (action === 'review') {
            wx.navigateTo({ url: navigation_1.pageUrls.review(this.data.booking.id) });
            return;
        }
        if (action === 'rebook') {
            this.rebook();
            return;
        }
        if (action === 'cancel') {
            this.cancelBooking();
            return;
        }
        if (action === 'reschedule') {
            this.reschedule();
            return;
        }
        if (action === 'contact') {
            (0, store_actions_1.callStore)(this.data.booking.store, this.data.feedback);
            return;
        }
        wx.showToast({ title: this.data.feedback.genericMockAction, icon: 'none' });
    },
    cancelBooking() {
        if (!this.data.booking || this.data.acting)
            return;
        wx.showModal({
            title: this.data.dictionaries.cancelModalTitle,
            content: this.data.dictionaries.cancelModalContent,
            confirmText: this.data.dictionaries.cancelModalConfirmText,
            confirmColor: '#C25B52',
            success: async (result) => {
                if (!result.confirm || !this.data.booking)
                    return;
                this.setData({ acting: true });
                try {
                    const booking = await booking_service_1.bookingService.cancelBooking(this.data.booking.id, `cancel-${Date.now()}`);
                    this.setData({
                        booking,
                        statusText: this.data.dictionaries.statusLabel[booking.status] || '',
                        steps: buildSteps(booking, this.data.dictionaries.detailSteps),
                        canCheckin: false
                    });
                    wx.showToast({ title: this.data.dictionaries.cancelSuccessToastText, icon: 'none' });
                }
                catch (error) {
                    wx.showToast({ title: this.data.feedback.cancelUnavailable, icon: 'none' });
                }
                finally {
                    this.setData({ acting: false });
                }
            }
        });
    },
    async payBooking() {
        if (!this.data.booking || this.data.acting)
            return;
        this.setData({ acting: true });
        try {
            const booking = await (0, payment_1.payBookingDeposit)(this.data.booking.id);
            this.setData({
                booking,
                statusText: this.data.dictionaries.statusLabel[booking.status] || '',
                steps: buildSteps(booking, this.data.dictionaries.detailSteps),
                paymentRows: buildPaymentRows(booking, this.data.dictionaries),
                canCheckin: booking.status === 'BOOKED'
            });
            wx.showToast({ title: this.data.dictionaries.paySuccessToastText, icon: 'success' });
        }
        catch (error) {
            wx.showToast({ title: this.data.dictionaries.payFailureToastText, icon: 'none' });
        }
        finally {
            this.setData({ acting: false });
        }
    },
    async refreshCode() {
        if (!this.data.booking || this.data.acting)
            return;
        this.setData({ acting: true });
        try {
            const booking = await booking_service_1.bookingService.refreshBookingCode(this.data.booking.id, `refresh-code-${Date.now()}`);
            this.setData({
                booking,
                statusText: this.data.dictionaries.statusLabel[booking.status] || '',
                steps: buildSteps(booking, this.data.dictionaries.detailSteps),
                detailRows: buildDetailRows(booking, this.data.dictionaries),
                paymentRows: buildPaymentRows(booking, this.data.dictionaries),
                codeText: formatCode(booking.code),
                qrImageLoadFailed: false,
                canCheckin: booking.status === 'BOOKED'
            });
            wx.showToast({ title: this.data.feedback.codeRefreshed, icon: 'none' });
        }
        catch (error) {
            wx.showToast({ title: this.data.feedback.codeRefreshFailed, icon: 'none' });
        }
        finally {
            this.setData({ acting: false });
        }
    },
    onQrImageError() {
        this.setData({ qrImageLoadFailed: true });
    },
    async rebook() {
        if (!this.data.booking || this.data.acting)
            return;
        this.setData({ acting: true });
        try {
            const rebookPayload = await booking_service_1.bookingService.getBookingRebookDraft(this.data.booking.id);
            booking_1.bookingStore.update(rebookPayload.draft);
            wx.navigateTo({ url: navigation_1.pageUrls.serviceDetail(rebookPayload.draft.serviceId) });
        }
        catch (error) {
            wx.showToast({ title: this.data.feedback.genericMockAction, icon: 'none' });
        }
        finally {
            this.setData({ acting: false });
        }
    },
    async reschedule() {
        if (!this.data.booking || this.data.acting)
            return;
        this.setData({ acting: true });
        try {
            const reschedulePayload = await booking_service_1.bookingService.getBookingRescheduleDraft(this.data.booking.id);
            booking_1.bookingStore.update(reschedulePayload.draft);
            wx.navigateTo({ url: navigation_1.pageRoutes.time });
        }
        catch (error) {
            wx.showToast({ title: this.data.feedback.genericMockAction, icon: 'none' });
        }
        finally {
            this.setData({ acting: false });
        }
    }
});
