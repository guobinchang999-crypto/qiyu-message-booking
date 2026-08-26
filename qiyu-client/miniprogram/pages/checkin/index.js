"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const store_actions_1 = require("../../utils/store-actions");
const formatCode = (code) => {
    if (code.length <= 6)
        return code;
    return code.replace(/(.{3})/g, '$1 ').trim();
};
const emptyDictionaries = { title: '', qrTitle: '', refreshText: '', steps: [], pendingButtonText: '', checkingButtonText: '', checkedButtonText: '', successToastText: '', failureToastText: '', bottomActions: [] };
const emptyFeedback = {};
const emptyState = { loadingTitle: '', loadingDescription: '', errorTitle: '', errorMessage: '', retryText: '', submitErrorTitle: '', submitErrorMessage: '', refreshCodeText: '' };
const buildProgress = (steps, checked) => steps.map((label, index) => {
    if (index === 0)
        return { label, state: 'done' };
    if (index === 1)
        return { label, state: checked ? 'done' : 'current' };
    if (index === 2)
        return { label, state: checked ? 'current' : '' };
    return { label, state: '' };
});
const resolveButtonText = (dictionaries, checking, checked) => {
    if (checked)
        return dictionaries.checkedButtonText;
    if (checking)
        return dictionaries.checkingButtonText;
    return dictionaries.pendingButtonText;
};
Page({
    data: {
        booking: null,
        dictionaries: emptyDictionaries,
        feedback: emptyFeedback,
        stateCopy: emptyState,
        progressSteps: [],
        loading: true,
        error: '',
        codeText: '',
        qrImageLoadFailed: false,
        refreshHint: '',
        buttonText: '',
        checking: false,
        refreshingCode: false,
        checked: false
    },
    async onLoad(query) {
        await this.loadBooking(query.id || 'booking-1001');
    },
    async loadBooking(id) {
        this.setData({ loading: true, error: '' });
        try {
            const [booking, dictionaries, feedback, pageStates] = await Promise.all([
                booking_service_1.bookingService.getBooking(id || this.data.booking?.id || 'booking-1001'),
                booking_service_1.bookingService.getCheckinDictionaries(),
                booking_service_1.bookingService.getActionFeedbackDictionaries(),
                booking_service_1.bookingService.getPageStateDictionaries()
            ]);
            const checked = booking.status === 'CHECKED_IN';
            this.setData({
                booking,
                dictionaries,
                feedback,
                stateCopy: pageStates.checkin,
                codeText: formatCode(booking.code),
                qrImageLoadFailed: false,
                refreshHint: dictionaries.refreshText,
                progressSteps: buildProgress(dictionaries.steps, checked),
                buttonText: resolveButtonText(dictionaries, false, checked),
                checked,
                loading: false
            });
        }
        catch (error) {
            this.setData({ loading: false, error: this.data.stateCopy.errorMessage });
        }
    },
    async checkin() {
        if (this.data.checking || !this.data.booking)
            return;
        if (this.data.checked || this.data.booking.status !== 'BOOKED') {
            wx.showToast({ title: this.data.feedback.checkinRepeated, icon: 'none' });
            return;
        }
        this.setData({ checking: true, error: '', buttonText: resolveButtonText(this.data.dictionaries, true, false) });
        try {
            const booking = await booking_service_1.bookingService.checkinBooking(this.data.booking.id, `checkin-${Date.now()}`);
            this.setData({
                booking,
                codeText: formatCode(booking.code),
                qrImageLoadFailed: false,
                progressSteps: buildProgress(this.data.dictionaries.steps, true),
                buttonText: resolveButtonText(this.data.dictionaries, false, true),
                checking: false,
                checked: true
            });
            wx.showToast({ title: this.data.dictionaries.successToastText, icon: 'success' });
        }
        catch (error) {
            this.setData({ checking: false, buttonText: resolveButtonText(this.data.dictionaries, false, false), error: this.data.stateCopy.submitErrorMessage });
            wx.showToast({ title: this.data.dictionaries.failureToastText, icon: 'none' });
        }
    },
    async refreshCode() {
        if (!this.data.booking || this.data.checking || this.data.refreshingCode)
            return;
        this.setData({ refreshingCode: true });
        try {
            const booking = await booking_service_1.bookingService.refreshBookingCode(this.data.booking.id, `refresh-code-${Date.now()}`);
            this.setData({ booking, codeText: formatCode(booking.code), qrImageLoadFailed: false, refreshHint: this.data.feedback.codeRefreshHint });
            wx.showToast({ title: this.data.feedback.codeRefreshed, icon: 'none' });
        }
        catch (error) {
            wx.showToast({ title: this.data.feedback.codeRefreshFailed, icon: 'none' });
        }
        finally {
            this.setData({ refreshingCode: false });
        }
    },
    onQrImageError() {
        this.setData({ qrImageLoadFailed: true });
    },
    handleBottomAction(event) {
        const key = String(event.currentTarget.dataset.key || '');
        if (key === 'navigation') {
            (0, store_actions_1.navigateToStore)(this.data.booking?.store || null, this.data.feedback);
            return;
        }
        if (key === 'contact') {
            (0, store_actions_1.callStore)(this.data.booking?.store || null, this.data.feedback);
            return;
        }
        wx.showToast({ title: this.data.feedback.genericMockAction, icon: 'none' });
    }
});
