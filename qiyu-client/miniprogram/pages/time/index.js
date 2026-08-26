"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const emptyFeedback = {};
const emptyState = { pageTitle: '', loadingTitle: '', loadingDescription: '', errorTitle: '', errorMessage: '', retryText: '', noticeText: '', emptyActionDateText: '', emptyActionTherapistText: '', selectedSummaryTitle: '', nextButtonText: '', emptySlotText: '', emptyTitle: '', emptyDescription: '' };
Page({
    data: { slots: [], visibleSlots: [], selectedSlotId: '', selectedSlotText: '', selectedDateIndex: 0, selectedDateText: '', period: 'AFTERNOON', periodText: '', dates: [], periods: [], legend: [], confirmation: null, feedback: emptyFeedback, stateCopy: emptyState, loading: true, error: '' },
    async onLoad() { await this.loadTimeSlots(); },
    async loadTimeSlots() {
        this.setData({ loading: true, error: '' });
        try {
            const draft = booking_1.bookingStore.get();
            const [slots, dictionaries, confirmation, feedback, pageStates] = await Promise.all([
                booking_service_1.bookingService.getTimeSlots(draft),
                booking_service_1.bookingService.getTimeDictionaries(),
                booking_service_1.bookingService.getBookingConfirmation(draft),
                booking_service_1.bookingService.getActionFeedbackDictionaries(),
                booking_service_1.bookingService.getPageStateDictionaries()
            ]);
            const viewSlots = slots.map((slot) => ({ ...slot, statusText: dictionaries.statusLabel[slot.status] || '' }));
            const draftSlot = viewSlots.find((slot) => slot.id === draft.slotId && slot.status !== 'full');
            const period = draftSlot?.period || dictionaries.defaultPeriod;
            const periodText = this.resolvePeriodText(period, dictionaries.periods);
            const visibleSlots = this.filterSlots(viewSlots, period);
            const firstAvailable = draftSlot || visibleSlots.find((slot) => slot.status !== 'full') || viewSlots.find((slot) => slot.status !== 'full');
            this.setData({ slots: viewSlots, visibleSlots, dates: dictionaries.dates, periods: dictionaries.periods, legend: dictionaries.legend, confirmation, feedback, stateCopy: pageStates.time, period, periodText, selectedDateIndex: 0, selectedDateText: dictionaries.dates[0] || '', selectedSlotId: firstAvailable?.id || '', selectedSlotText: this.buildSlotText(firstAvailable, pageStates.time), loading: false });
        }
        catch (error) {
            this.setData({ loading: false, error: this.data.stateCopy.errorMessage });
        }
    },
    filterSlots(slots, period) {
        return slots.filter((slot) => slot.period === period);
    },
    resolvePeriodText(period, periods) {
        return periods.find((item) => item.key === period)?.label || '';
    },
    buildSlotText(slot, stateCopy) {
        const copy = stateCopy || this.data.stateCopy;
        if (!slot)
            return copy.emptySlotText;
        return `${slot.startAt} · ${slot.statusText}`;
    },
    chooseDate(event) {
        const index = Number(event.currentTarget.dataset.index || 0);
        const selectedDateText = this.data.dates[index] || this.data.dates[0] || '';
        const selectedSlot = this.data.visibleSlots.find((slot) => slot.status !== 'full');
        this.setData({ selectedDateIndex: index, selectedDateText, selectedSlotId: selectedSlot?.id || '', selectedSlotText: this.buildSlotText(selectedSlot) });
    },
    choosePeriod(event) {
        const period = String(event.currentTarget.dataset.period || this.data.period);
        const visibleSlots = this.filterSlots(this.data.slots, period);
        const selectedSlot = visibleSlots.find((slot) => slot.status !== 'full');
        this.setData({ period, periodText: this.resolvePeriodText(period, this.data.periods), visibleSlots, selectedSlotId: selectedSlot?.id || '', selectedSlotText: this.buildSlotText(selectedSlot) });
    },
    chooseSlot(event) {
        const slot = event.currentTarget.dataset.slot;
        if (slot.status === 'full') {
            wx.showToast({ title: this.data.feedback.slotFull, icon: 'none' });
            return;
        }
        this.setData({ selectedSlotId: slot.id, selectedSlotText: this.buildSlotText(slot) });
    },
    changeTherapist() {
        wx.navigateBack();
    },
    changeDate() {
        const nextIndex = (this.data.selectedDateIndex + 1) % Math.max(this.data.dates.length, 1);
        const selectedDateText = this.data.dates[nextIndex] || '';
        const selectedSlot = this.data.visibleSlots.find((slot) => slot.status !== 'full');
        this.setData({ selectedDateIndex: nextIndex, selectedDateText, selectedSlotId: selectedSlot?.id || '', selectedSlotText: this.buildSlotText(selectedSlot) });
    },
    next() {
        if (!this.data.selectedSlotId)
            return;
        booking_1.bookingStore.update({ slotId: this.data.selectedSlotId });
        wx.navigateTo({ url: navigation_1.pageRoutes.confirm });
    }
});
