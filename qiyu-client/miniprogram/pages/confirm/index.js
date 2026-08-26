"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const MIN_GUEST_COUNT = 1;
const MAX_GUEST_COUNT = 4;
const emptyFeedback = {};
const emptyState = { loadingTitle: '', loadingDescription: '', errorTitle: '', errorMessage: '', retryText: '', submitErrorTitle: '', submitErrorMessage: '', paymentRefreshErrorMessage: '' };
Page({
    data: {
        draft: booking_1.bookingStore.get(),
        confirmation: null,
        feedback: emptyFeedback,
        stateCopy: emptyState,
        loading: true,
        refreshingPayment: false,
        submitting: false,
        agreed: true,
        error: ''
    },
    async onShow() {
        this.setData({ draft: booking_1.bookingStore.get() });
        await this.loadConfirmation();
    },
    async loadConfirmation() {
        const draft = booking_1.bookingStore.get();
        this.setData({ draft, loading: true, error: '' });
        try {
            const [confirmation, feedback, pageStates] = await Promise.all([
                booking_service_1.bookingService.getBookingConfirmation(draft),
                booking_service_1.bookingService.getActionFeedbackDictionaries(),
                booking_service_1.bookingService.getPageStateDictionaries()
            ]);
            this.setData({ confirmation, feedback, stateCopy: pageStates.confirm, loading: false });
        }
        catch (error) {
            this.setData({ loading: false, error: this.data.stateCopy.errorMessage });
        }
    },
    async changeGuestCount(event) {
        if (this.data.submitting || this.data.loading || this.data.refreshingPayment)
            return;
        const delta = Number(event.currentTarget.dataset.delta || 0);
        const nextGuestCount = Math.min(MAX_GUEST_COUNT, Math.max(MIN_GUEST_COUNT, this.data.draft.guestCount + delta));
        if (nextGuestCount === this.data.draft.guestCount) {
            wx.showToast({ title: nextGuestCount === MIN_GUEST_COUNT ? this.data.feedback.minGuestCount : this.data.feedback.maxGuestCount, icon: 'none' });
            return;
        }
        booking_1.bookingStore.update({ guestCount: nextGuestCount });
        const draft = booking_1.bookingStore.get();
        this.setData({ draft, refreshingPayment: true, error: '' });
        try {
            this.setData({ confirmation: await booking_service_1.bookingService.getBookingConfirmation(draft), refreshingPayment: false });
        }
        catch (error) {
            this.setData({ refreshingPayment: false, error: this.data.stateCopy.paymentRefreshErrorMessage });
        }
    },
    onNameInput(event) {
        booking_1.bookingStore.update({ contact: event.detail.value });
        this.setData({ draft: booking_1.bookingStore.get(), error: '' });
    },
    onRemarkInput(event) {
        booking_1.bookingStore.update({ remark: event.detail.value });
        this.setData({ draft: booking_1.bookingStore.get() });
    },
    onAgreement() {
        if (this.data.submitting)
            return;
        this.setData({ agreed: !this.data.agreed, error: '' });
    },
    editStore() {
        if (this.data.submitting)
            return;
        wx.navigateTo({ url: navigation_1.pageRoutes.stores });
    },
    editService() {
        if (this.data.submitting)
            return;
        wx.switchTab({ url: navigation_1.pageRoutes.services });
    },
    editTherapist() {
        if (this.data.submitting)
            return;
        wx.navigateTo({ url: navigation_1.pageRoutes.therapist });
    },
    editTime() {
        if (this.data.submitting)
            return;
        wx.navigateTo({ url: navigation_1.pageRoutes.time });
    },
    async submit() {
        if (this.data.submitting || this.data.loading || this.data.refreshingPayment)
            return;
        if (!this.data.agreed) {
            this.setData({ error: this.data.confirmation?.agreementRequiredMessage || '' });
            return;
        }
        if (!this.data.draft.contact.trim()) {
            this.setData({ error: this.data.confirmation?.formCopy.contactRequiredMessage || '' });
            return;
        }
        this.setData({ submitting: true, error: '' });
        try {
            const booking = this.data.draft.flow === 'reschedule'
                ? await booking_service_1.bookingService.rescheduleBooking(this.data.draft, `reschedule-${Date.now()}`)
                : await booking_service_1.bookingService.createBooking(this.data.draft, `create-${Date.now()}`);
            wx.redirectTo({ url: navigation_1.pageUrls.success(booking.id) });
        }
        catch (error) {
            this.setData({ error: this.data.stateCopy.submitErrorMessage, submitting: false });
            wx.showToast({ title: this.data.stateCopy.submitErrorMessage, icon: 'none' });
        }
    }
});
