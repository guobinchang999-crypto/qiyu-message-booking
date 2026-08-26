import { bookingService } from '../../services/booking-service';
import { pageRoutes, pageUrls } from '../../constants/navigation';
import { ActionFeedbackDictionaryPayload, PageStateCopy, SuccessCopy } from '../../services/contracts';
import { Booking } from '../../types/domain';
import { callStore, navigateToStore } from '../../utils/store-actions';
const emptySuccessCopy: SuccessCopy = { title:'', subtitle:'', bookingCodePrefix:'', codeHint:'', navigationActionText:'', contactActionText:'', reminderText:'', detailButtonText:'', homeButtonText:'' };
const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
const emptyState: PageStateCopy = { loadingTitle:'', loadingDescription:'', errorTitle:'', errorMessage:'', retryText:'' };

Page({
  data: {
    booking: null as Booking | null,
    copy: emptySuccessCopy,
    feedback: emptyFeedback,
    stateCopy: emptyState,
    bookingId: 'booking-1001',
    loading: true,
    error: ''
  },
  async onLoad(query: { id?: string }) {
    this.setData({ bookingId: query.id || 'booking-1001' });
    await this.loadBooking();
  },
  async loadBooking() {
    this.setData({ loading: true, error: '' });
    try {
      const [{ booking, copy }, feedback, pageStates] = await Promise.all([
        bookingService.getBookingSuccess(this.data.bookingId),
        bookingService.getActionFeedbackDictionaries(),
        bookingService.getPageStateDictionaries()
      ]);
      this.setData({
        booking,
        copy,
        feedback,
        stateCopy: pageStates.success,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false, error: this.data.stateCopy.errorMessage });
    }
  },
  detail() {
    if (!this.data.booking) return;
    wx.redirectTo({ url: pageUrls.bookingDetail(this.data.booking.id) });
  },
  navigateStore() {
    navigateToStore(this.data.booking?.store || null, this.data.feedback);
  },
  contactStore() {
    callStore(this.data.booking?.store || null, this.data.feedback);
  },
  home() {
    wx.switchTab({ url: pageRoutes.home });
  }
});
