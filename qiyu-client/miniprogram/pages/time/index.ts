import { ActionFeedbackDictionaryPayload, BookingConfirmationPayload, TimePeriodOption, TimeStateCopy } from '../../services/contracts';
import { bookingService } from '../../services/booking-service';
import { pageRoutes } from '../../constants/navigation';
import { bookingStore } from '../../store/booking';
import { TimePeriodCode, TimeSlot, TimeSlotStatus } from '../../types/domain';
import { defaultPageStateCopy, resolvePageError } from '../../constants/ui';
type TimeSlotView = TimeSlot & { statusText:string };
type LegendItem = { status:TimeSlotStatus; label:string };
const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
const emptyState: TimeStateCopy = { pageTitle:'', ...defaultPageStateCopy, noticeText:'', emptyActionDateText:'', emptyActionTherapistText:'', selectedSummaryTitle:'', nextButtonText:'', emptySlotText:'' };
const dateValues = (count: number): string[] => Array.from({ length: count }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});
Page({
  data:{ slots:[] as TimeSlotView[], visibleSlots:[] as TimeSlotView[], selectedSlotId:'', selectedSlotText:'', selectedDateIndex:0, selectedDateText:'', dateValues:[] as string[], period:'AFTERNOON' as TimePeriodCode, periodText:'', dates:[] as string[], periods:[] as TimePeriodOption[], legend:[] as LegendItem[], confirmation:null as BookingConfirmationPayload | null, feedback:emptyFeedback, stateCopy:emptyState, loading:true, error:'' },
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
      const availableDates = dateValues(dictionaries.dates.length);
      const selectedDateIndex = Math.max(0, availableDates.indexOf(draft.appointmentDate));
      const draftSlot = viewSlots.find((slot) => slot.id === draft.slotId && slot.status !== 'full');
      const period = draftSlot?.period || dictionaries.defaultPeriod;
      const periodText = this.resolvePeriodText(period, dictionaries.periods);
      const visibleSlots = this.filterSlots(viewSlots, period);
      const firstAvailable = draftSlot || visibleSlots.find((slot) => slot.status !== 'full') || viewSlots.find((slot) => slot.status !== 'full');
      this.setData({ slots:viewSlots, visibleSlots, dates:dictionaries.dates, dateValues:availableDates, periods:dictionaries.periods, legend:dictionaries.legend, confirmation, feedback, stateCopy:pageStates.time, period, periodText, selectedDateIndex, selectedDateText:dictionaries.dates[selectedDateIndex] || '', selectedSlotId:firstAvailable?.id || '', selectedSlotText:this.buildSlotText(firstAvailable, pageStates.time), loading:false });
    } catch (error) {
      this.setData({ loading:false, error:resolvePageError(error, this.data.stateCopy.errorMessage) });
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
  async chooseDate(event: WechatMiniprogram.TouchEvent) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const appointmentDate = this.data.dateValues[index];
    if (!appointmentDate || appointmentDate === bookingStore.get().appointmentDate) return;
    bookingStore.update({ appointmentDate, slotId:undefined });
    await this.loadTimeSlots();
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
  async changeDate() {
    const nextIndex = (this.data.selectedDateIndex + 1) % Math.max(this.data.dates.length, 1);
    const appointmentDate = this.data.dateValues[nextIndex];
    if (!appointmentDate) return;
    bookingStore.update({ appointmentDate, slotId:undefined });
    await this.loadTimeSlots();
  },
  next(){
    if (!this.data.selectedSlotId) return;
    bookingStore.update({ slotId:this.data.selectedSlotId });
    wx.navigateTo({ url:pageRoutes.confirm });
  }
});
