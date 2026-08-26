import { ActionFeedbackDictionaryPayload, BookingConfirmationPayload, TimePeriodOption, TimeStateCopy } from '../../services/contracts';
import { bookingService } from '../../services/booking-service';
import { pageRoutes } from '../../constants/navigation';
import { bookingStore } from '../../store/booking';
import { TimePeriodCode, TimeSlot, TimeSlotStatus } from '../../types/domain';
type TimeSlotView = TimeSlot & { statusText:string };
type LegendItem = { status:TimeSlotStatus; label:string };
const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
const emptyState: TimeStateCopy = { pageTitle:'', loadingTitle:'', loadingDescription:'', errorTitle:'', errorMessage:'', retryText:'', noticeText:'', emptyActionDateText:'', emptyActionTherapistText:'', selectedSummaryTitle:'', nextButtonText:'', emptySlotText:'', emptyTitle:'', emptyDescription:'' };
Page({
  data:{ slots:[] as TimeSlotView[], visibleSlots:[] as TimeSlotView[], selectedSlotId:'', selectedSlotText:'', selectedDateIndex:0, selectedDateText:'', period:'AFTERNOON' as TimePeriodCode, periodText:'', dates:[] as string[], periods:[] as TimePeriodOption[], legend:[] as LegendItem[], confirmation:null as BookingConfirmationPayload | null, feedback:emptyFeedback, stateCopy:emptyState, loading:true, error:'' },
  async onLoad(){ await this.loadTimeSlots(); },
  async loadTimeSlots(){
    this.setData({ loading:true, error:'' });
    try {
      const draft = bookingStore.get();
      const [slots, dictionaries, confirmation, feedback, pageStates] = await Promise.all([
        bookingService.getTimeSlots(draft),
        bookingService.getTimeDictionaries(),
        bookingService.getBookingConfirmation(draft),
        bookingService.getActionFeedbackDictionaries(),
        bookingService.getPageStateDictionaries()
      ]);
      const viewSlots = slots.map((slot) => ({ ...slot, statusText:dictionaries.statusLabel[slot.status] || '' }));
      const draftSlot = viewSlots.find((slot) => slot.id === draft.slotId && slot.status !== 'full');
      const period = draftSlot?.period || dictionaries.defaultPeriod;
      const periodText = this.resolvePeriodText(period, dictionaries.periods);
      const visibleSlots = this.filterSlots(viewSlots, period);
      const firstAvailable = draftSlot || visibleSlots.find((slot) => slot.status !== 'full') || viewSlots.find((slot) => slot.status !== 'full');
      this.setData({ slots:viewSlots, visibleSlots, dates:dictionaries.dates, periods:dictionaries.periods, legend:dictionaries.legend, confirmation, feedback, stateCopy:pageStates.time, period, periodText, selectedDateIndex:0, selectedDateText:dictionaries.dates[0] || '', selectedSlotId:firstAvailable?.id || '', selectedSlotText:this.buildSlotText(firstAvailable, pageStates.time), loading:false });
    } catch (error) {
      this.setData({ loading:false, error:this.data.stateCopy.errorMessage });
    }
  },
  filterSlots(slots: TimeSlotView[], period: TimePeriodCode) {
    return slots.filter((slot) => slot.period === period);
  },
  resolvePeriodText(period: TimePeriodCode, periods: TimePeriodOption[]) {
    return periods.find((item) => item.key === period)?.label || '';
  },
  buildSlotText(slot?: TimeSlotView, stateCopy?: TimeStateCopy) {
    const copy = stateCopy || this.data.stateCopy;
    if (!slot) return copy.emptySlotText;
    return `${slot.startAt} · ${slot.statusText}`;
  },
  chooseDate(event: WechatMiniprogram.TouchEvent) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const selectedDateText = this.data.dates[index] || this.data.dates[0] || '';
    const selectedSlot = this.data.visibleSlots.find((slot) => slot.status !== 'full');
    this.setData({ selectedDateIndex:index, selectedDateText, selectedSlotId:selectedSlot?.id || '', selectedSlotText:this.buildSlotText(selectedSlot) });
  },
  choosePeriod(event:WechatMiniprogram.TouchEvent){
    const period = String(event.currentTarget.dataset.period || this.data.period) as TimePeriodCode;
    const visibleSlots = this.filterSlots(this.data.slots, period);
    const selectedSlot = visibleSlots.find((slot) => slot.status !== 'full');
    this.setData({ period, periodText:this.resolvePeriodText(period, this.data.periods), visibleSlots, selectedSlotId:selectedSlot?.id || '', selectedSlotText:this.buildSlotText(selectedSlot) });
  },
  chooseSlot(event:WechatMiniprogram.TouchEvent){
    const slot = event.currentTarget.dataset.slot as TimeSlotView;
    if (slot.status === 'full') {
      wx.showToast({ title:this.data.feedback.slotFull, icon:'none' });
      return;
    }
    this.setData({ selectedSlotId:slot.id, selectedSlotText:this.buildSlotText(slot) });
  },
  changeTherapist() {
    wx.navigateBack();
  },
  changeDate() {
    const nextIndex = (this.data.selectedDateIndex + 1) % Math.max(this.data.dates.length, 1);
    const selectedDateText = this.data.dates[nextIndex] || '';
    const selectedSlot = this.data.visibleSlots.find((slot) => slot.status !== 'full');
    this.setData({ selectedDateIndex:nextIndex, selectedDateText, selectedSlotId:selectedSlot?.id || '', selectedSlotText:this.buildSlotText(selectedSlot) });
  },
  next(){
    if (!this.data.selectedSlotId) return;
    bookingStore.update({ slotId:this.data.selectedSlotId });
    wx.navigateTo({ url:pageRoutes.confirm });
  }
});
