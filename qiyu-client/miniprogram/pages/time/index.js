"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const ui_1 = require("../../constants/ui");
const emptyFeedback = {};
const emptyState = { pageTitle: '', ...ui_1.defaultPageStateCopy, noticeText: '', emptyActionDateText: '', emptyActionTherapistText: '', selectedSummaryTitle: '', nextButtonText: '', emptySlotText: '' };
const dateValues = (count) => Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
});
Page({
    data: { slots: [], visibleSlots: [], selectedSlotId: '', selectedSlotText: '', selectedDateIndex: 0, selectedDateText: '', dateValues: [], period: 'AFTERNOON', periodText: '', dates: [], periods: [], legend: [], confirmation: null, feedback: emptyFeedback, stateCopy: emptyState, loading: true, error: '' },
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
            // Dates come from the server so the client clock cannot drift ahead of the store calendar;
            // the client-side fallback only covers legacy backends that omit dateValues.
            const availableDates = dictionaries.dateValues?.length ? dictionaries.dateValues : dateValues(dictionaries.dates.length);
            const selectedDateIndex = Math.max(0, availableDates.indexOf(draft.appointmentDate));
            const draftSlot = viewSlots.find((slot) => slot.id === draft.slotId && slot.status !== 'full');
            const period = draftSlot?.period || dictionaries.defaultPeriod;
            const periodText = this.resolvePeriodText(period, dictionaries.periods);
            const visibleSlots = this.filterSlots(viewSlots, period);
            const firstAvailable = draftSlot || visibleSlots.find((slot) => slot.status !== 'full') || viewSlots.find((slot) => slot.status !== 'full');
            this.setData({ slots: viewSlots, visibleSlots, dates: dictionaries.dates, dateValues: availableDates, periods: dictionaries.periods, legend: dictionaries.legend, confirmation, feedback, stateCopy: pageStates.time, period, periodText, selectedDateIndex, selectedDateText: dictionaries.dates[selectedDateIndex] || '', selectedSlotId: firstAvailable?.id || '', selectedSlotText: this.buildSlotText(firstAvailable, pageStates.time), loading: false });
        }
        catch (error) {
            this.setData({ loading: false, error: (0, ui_1.resolvePageError)(error, this.data.stateCopy.errorMessage) });
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
    async chooseDate(event) {
        const index = Number(event.currentTarget.dataset.index || 0);
        const appointmentDate = this.data.dateValues[index];
        if (!appointmentDate || appointmentDate === booking_1.bookingStore.get().appointmentDate)
            return;
        booking_1.bookingStore.update({ appointmentDate, slotId: undefined });
        await this.loadTimeSlots();
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
    async changeDate() {
        const nextIndex = (this.data.selectedDateIndex + 1) % Math.max(this.data.dates.length, 1);
        const appointmentDate = this.data.dateValues[nextIndex];
        if (!appointmentDate)
            return;
        booking_1.bookingStore.update({ appointmentDate, slotId: undefined });
        await this.loadTimeSlots();
    },
    next() {
        if (!this.data.selectedSlotId)
            return;
        booking_1.bookingStore.update({ slotId: this.data.selectedSlotId });
        wx.navigateTo({ url: navigation_1.pageRoutes.confirm });
    }
});
