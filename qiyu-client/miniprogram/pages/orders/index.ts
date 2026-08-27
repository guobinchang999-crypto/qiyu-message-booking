import { bookingService } from '../../services/booking-service';
import { pageRoutes, pageUrls } from '../../constants/navigation';
import { ActionFeedbackDictionaryPayload, OrderDictionaryPayload, OrderTabItem, PageStateCopy } from '../../services/contracts';
import { bookingStore } from '../../store/booking';
import { Booking, OrderAction } from '../../types/domain';
import { payBookingDeposit } from '../../utils/payment';
import { callStore } from '../../utils/store-actions';
import { defaultPageStateCopy, resolvePageError } from '../../constants/ui';

const emptyDictionaries: OrderDictionaryPayload = { pageTitle:'', detailTitle:'', statusLabel: {}, actionLabel: {}, tabs: [], detailSteps: [], codeTitle: '', codeHint: '', codeExtraHint:'', detailFields: { service:'', therapist:'', scheduledAt:'', contact:'' }, paymentTitle:'', paymentFields:{ item:'', therapist:'', discount:'', paid:'' }, actionSectionTitle:'', checkinButtonText: '', cancelModalTitle:'', cancelModalContent:'', cancelModalConfirmText:'', cancelSuccessToastText:'', paySuccessToastText:'', payFailureToastText:'', cardMeta:{ paidPrefix:'' }, serviceCardMeta:{ durationUnit:'', servedPrefix:'', servedSuffix:'' }, storeCardMeta:{ ratingUnit:'', nextAvailablePrefix:'' } };
const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
const emptyState = { ...defaultPageStateCopy } as PageStateCopy;
const filterByTab = (bookings: Booking[], tab: string, tabs: OrderTabItem[]): Booking[] => {
  const tabConfig = tabs.find((item) => item.key === tab);
  if (!tabConfig?.statuses?.length) return bookings;
  return bookings.filter((booking) => tabConfig.statuses?.includes(booking.status));
};

Page({
  data:{ bookings:[] as Booking[], visibleBookings:[] as Booking[], dictionaries:emptyDictionaries, feedback:emptyFeedback, stateCopy:emptyState, tabs:[] as OrderTabItem[], tab:'', actingBookingId:'', loading:true, error:'' },
  async onShow(){ await this.loadOrders(); },
  async onPullDownRefresh(){ try { await this.loadOrders(); } finally { wx.stopPullDownRefresh(); } },
  async loadOrders(){ this.setData({ loading:true, error:'' }); try { const [bookings, dictionaries, feedback, pageStates] = await Promise.all([bookingService.getBookings(), bookingService.getOrderDictionaries(), bookingService.getActionFeedbackDictionaries(), bookingService.getPageStateDictionaries()]); const tab = this.data.tab || dictionaries.tabs[0]?.key || ''; this.setData({ bookings, dictionaries, feedback, stateCopy:pageStates.orders, tabs:dictionaries.tabs, tab, visibleBookings:filterByTab(bookings, tab, dictionaries.tabs), loading:false }); } catch (error) { this.setData({ loading:false, error:resolvePageError(error, this.data.stateCopy.errorMessage) }); } },
  detail(event:WechatMiniprogram.CustomEvent<{ id?: string }>){ wx.navigateTo({ url:pageUrls.bookingDetail(event.detail.id || '') }); },
  chooseTab(event:WechatMiniprogram.TouchEvent){ const tab = String(event.currentTarget.dataset.tab || ''); this.setData({ tab, visibleBookings:filterByTab(this.data.bookings, tab, this.data.tabs), error:'' }); },
  handleAction(event:WechatMiniprogram.CustomEvent<{ id?: string; action?: OrderAction }>){
    const id = String(event.detail.id);
    const action = String(event.detail.action) as OrderAction;
    if (action === 'review') {
      wx.navigateTo({ url:pageUrls.review(id) });
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
      wx.navigateTo({ url:pageUrls.checkin(id) });
      return;
    }
    if (action === 'contact') {
      const booking = this.data.bookings.find((item) => item.id === id) || null;
      callStore(booking?.store || null, this.data.feedback);
      return;
    }
    if (action === 'view_detail') {
      wx.navigateTo({ url:pageUrls.bookingDetail(id) });
      return;
    }
    wx.showToast({ title:this.data.feedback.genericMockAction, icon:'none' });
  },
  async payBooking(id: string) {
    if (this.data.actingBookingId) return;
    this.setData({ actingBookingId:id });
    try {
      const paidBooking = await payBookingDeposit(id);
      const bookings = this.data.bookings.map((booking) => booking.id === id ? paidBooking : booking);
      this.setData({ bookings, visibleBookings:filterByTab(bookings, this.data.tab, this.data.tabs) });
      wx.showToast({ title:this.data.dictionaries.paySuccessToastText, icon:'success' });
    } catch (error) {
      wx.showToast({ title:this.data.dictionaries.payFailureToastText, icon:'none' });
    } finally {
      this.setData({ actingBookingId:'' });
    }
  },
  cancelBooking(id: string) {
    if (this.data.actingBookingId) return;
    wx.showModal({
      title:this.data.dictionaries.cancelModalTitle,
      content:this.data.dictionaries.cancelModalContent,
      confirmText:this.data.dictionaries.cancelModalConfirmText,
      confirmColor:'#C25B52',
      success: async (result) => {
        if (!result.confirm) return;
        this.setData({ actingBookingId:id });
        try {
          const cancelledBooking = await bookingService.cancelBooking(id, `cancel-${Date.now()}`);
          const bookings = this.data.bookings.map((booking) => booking.id === id ? cancelledBooking : booking);
          this.setData({ bookings, visibleBookings:filterByTab(bookings, this.data.tab, this.data.tabs) });
          wx.showToast({ title:this.data.dictionaries.cancelSuccessToastText, icon:'none' });
        } catch (error) {
          wx.showToast({ title:this.data.feedback.cancelUnavailable, icon:'none' });
        } finally {
          this.setData({ actingBookingId:'' });
        }
      }
    });
  },
  async rebook(id: string) {
    if (this.data.actingBookingId) return;
    this.setData({ actingBookingId:id });
    try {
      const rebookPayload = await bookingService.getBookingRebookDraft(id);
      bookingStore.update(rebookPayload.draft);
      wx.navigateTo({ url:pageUrls.serviceDetail(rebookPayload.draft.serviceId) });
    } catch (error) {
      wx.showToast({ title:this.data.feedback.genericMockAction, icon:'none' });
    } finally {
      this.setData({ actingBookingId:'' });
    }
  },
  async reschedule(id: string) {
    if (this.data.actingBookingId) return;
    this.setData({ actingBookingId:id });
    try {
      const reschedulePayload = await bookingService.getBookingRescheduleDraft(id);
      bookingStore.update(reschedulePayload.draft);
      wx.navigateTo({ url:pageRoutes.time });
    } catch (error) {
      wx.showToast({ title:this.data.feedback.genericMockAction, icon:'none' });
    } finally {
      this.setData({ actingBookingId:'' });
    }
  }
});
