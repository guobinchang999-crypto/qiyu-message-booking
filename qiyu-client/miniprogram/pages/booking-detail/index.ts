import { bookingService } from '../../services/booking-service';
import { pageRoutes, pageUrls } from '../../constants/navigation';
import { ActionFeedbackDictionaryPayload, OrderDictionaryPayload, PageStateCopy } from '../../services/contracts';
import { bookingStore } from '../../store/booking';
import { Booking, BookingStatus, OrderAction } from '../../types/domain';
import { payBookingDeposit } from '../../utils/payment';
import { callStore } from '../../utils/store-actions';

const emptyDictionaries: OrderDictionaryPayload = { pageTitle:'', detailTitle:'', statusLabel: {}, actionLabel: {}, tabs: [], detailSteps: [], codeTitle: '', codeHint: '', codeExtraHint:'', detailFields: { service:'', therapist:'', scheduledAt:'', contact:'' }, paymentTitle:'', paymentFields:{ item:'', therapist:'', discount:'', paid:'' }, actionSectionTitle:'', checkinButtonText: '', cancelModalTitle:'', cancelModalContent:'', cancelModalConfirmText:'', cancelSuccessToastText:'', paySuccessToastText:'', payFailureToastText:'', cardMeta:{ paidPrefix:'' }, serviceCardMeta:{ durationUnit:'', servedPrefix:'', servedSuffix:'' }, storeCardMeta:{ ratingUnit:'', nextAvailablePrefix:'' } };
const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
const emptyState: PageStateCopy = { loadingTitle:'', loadingDescription:'', errorTitle:'', errorMessage:'', retryText:'' };
type DetailStep = { label: string; state: 'done' | 'active' | '' };
type DetailRow = { key: string; label: string; value: string };
type PaymentRow = { key: string; label: string; value: string; tone?: 'discount' };

const formatCode = (code: string): string => {
  if (code.length <= 6) return code;
  return code.replace(/(.{3})/g, '$1 ').trim();
};

const buildSteps = (booking: Booking, labels: string[]): DetailStep[] => {
  const activeIndexByStatus: Record<BookingStatus, number> = {
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

const buildDetailRows = (booking: Booking, dictionaries: OrderDictionaryPayload): DetailRow[] => [
  { key:'service', label:dictionaries.detailFields.service, value:`${booking.service.name} · ${booking.service.durationMinutes}${dictionaries.serviceCardMeta.durationUnit}` },
  { key:'therapist', label:dictionaries.detailFields.therapist, value:booking.therapist.name },
  { key:'scheduledAt', label:dictionaries.detailFields.scheduledAt, value:booking.scheduledAt },
  { key:'contact', label:dictionaries.detailFields.contact, value:booking.contact }
];
const buildPaymentRows = (booking: Booking, dictionaries: OrderDictionaryPayload): PaymentRow[] => [
  { key:'item', label:dictionaries.paymentFields.item, value:`¥${booking.payment.itemAmount}` },
  { key:'therapist', label:dictionaries.paymentFields.therapist, value:`¥${booking.payment.therapistFee}` },
  { key:'discount', label:dictionaries.paymentFields.discount, value:`-¥${booking.payment.discountAmount}`, tone:'discount' },
  { key:'paid', label:dictionaries.paymentFields.paid, value:`¥${booking.payment.paidAmount}` }
];

Page({
  data: {
    booking: null as Booking | null,
    bookingId: 'booking-1001',
    dictionaries: emptyDictionaries,
    feedback: emptyFeedback,
    stateCopy: emptyState,
    statusText: '',
    steps: [] as DetailStep[],
    detailRows: [] as DetailRow[],
    paymentRows: [] as PaymentRow[],
    codeText: '',
    qrImageLoadFailed: false,
    canCheckin: false,
    acting: false,
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
      const [booking, dictionaries, feedback, pageStates] = await Promise.all([
        bookingService.getBooking(this.data.bookingId),
        bookingService.getOrderDictionaries(),
        bookingService.getActionFeedbackDictionaries(),
        bookingService.getPageStateDictionaries()
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
    } catch (error) {
      this.setData({ loading: false, error: this.data.stateCopy.errorMessage });
    }
  },
  checkin() {
    if (!this.data.booking || this.data.loading || this.data.acting || !this.data.canCheckin) return;
    wx.navigateTo({ url: pageUrls.checkin(this.data.booking.id) });
  },
  handleAction(event: WechatMiniprogram.TouchEvent) {
    const action = String(event.currentTarget.dataset.action || '') as OrderAction;
    if (!this.data.booking || this.data.acting) return;
    if (action === 'show_code') {
      wx.navigateTo({ url:pageUrls.checkin(this.data.booking.id) });
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
      wx.navigateTo({ url:pageUrls.review(this.data.booking.id) });
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
      callStore(this.data.booking.store, this.data.feedback);
      return;
    }
    wx.showToast({ title:this.data.feedback.genericMockAction, icon:'none' });
  },
  cancelBooking() {
    if (!this.data.booking || this.data.acting) return;
    wx.showModal({
      title:this.data.dictionaries.cancelModalTitle,
      content:this.data.dictionaries.cancelModalContent,
      confirmText:this.data.dictionaries.cancelModalConfirmText,
      confirmColor:'#C25B52',
      success: async (result) => {
        if (!result.confirm || !this.data.booking) return;
        this.setData({ acting:true });
        try {
          const booking = await bookingService.cancelBooking(this.data.booking.id, `cancel-${Date.now()}`);
          this.setData({
            booking,
            statusText: this.data.dictionaries.statusLabel[booking.status] || '',
            steps: buildSteps(booking, this.data.dictionaries.detailSteps),
            canCheckin: false
          });
          wx.showToast({ title:this.data.dictionaries.cancelSuccessToastText, icon:'none' });
        } catch (error) {
          wx.showToast({ title:this.data.feedback.cancelUnavailable, icon:'none' });
        } finally {
          this.setData({ acting:false });
        }
      }
    });
  },
  async payBooking() {
    if (!this.data.booking || this.data.acting) return;
    this.setData({ acting:true });
    try {
      const booking = await payBookingDeposit(this.data.booking.id);
      this.setData({
        booking,
        statusText: this.data.dictionaries.statusLabel[booking.status] || '',
        steps: buildSteps(booking, this.data.dictionaries.detailSteps),
        paymentRows: buildPaymentRows(booking, this.data.dictionaries),
        canCheckin: booking.status === 'BOOKED'
      });
      wx.showToast({ title:this.data.dictionaries.paySuccessToastText, icon:'success' });
    } catch (error) {
      wx.showToast({ title:this.data.dictionaries.payFailureToastText, icon:'none' });
    } finally {
      this.setData({ acting:false });
    }
  },
  async refreshCode() {
    if (!this.data.booking || this.data.acting) return;
    this.setData({ acting:true });
    try {
      const booking = await bookingService.refreshBookingCode(this.data.booking.id, `refresh-code-${Date.now()}`);
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
      wx.showToast({ title:this.data.feedback.codeRefreshed, icon:'none' });
    } catch (error) {
      wx.showToast({ title:this.data.feedback.codeRefreshFailed, icon:'none' });
    } finally {
      this.setData({ acting:false });
    }
  },
  onQrImageError() {
    this.setData({ qrImageLoadFailed: true });
  },
  async rebook() {
    if (!this.data.booking || this.data.acting) return;
    this.setData({ acting:true });
    try {
      const rebookPayload = await bookingService.getBookingRebookDraft(this.data.booking.id);
      bookingStore.update(rebookPayload.draft);
      wx.navigateTo({ url:pageUrls.serviceDetail(rebookPayload.draft.serviceId) });
    } catch (error) {
      wx.showToast({ title:this.data.feedback.genericMockAction, icon:'none' });
    } finally {
      this.setData({ acting:false });
    }
  },
  async reschedule() {
    if (!this.data.booking || this.data.acting) return;
    this.setData({ acting:true });
    try {
      const reschedulePayload = await bookingService.getBookingRescheduleDraft(this.data.booking.id);
      bookingStore.update(reschedulePayload.draft);
      wx.navigateTo({ url:pageRoutes.time });
    } catch (error) {
      wx.showToast({ title:this.data.feedback.genericMockAction, icon:'none' });
    } finally {
      this.setData({ acting:false });
    }
  }
});
