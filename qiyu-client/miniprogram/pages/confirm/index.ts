import { ActionFeedbackDictionaryPayload, BookingConfirmationPayload, ConfirmStateCopy } from '../../services/contracts';
import { bookingService } from '../../services/booking-service';
import { pageRoutes, pageUrls } from '../../constants/navigation';
import { bookingStore } from '../../store/booking';
import { defaultActionStateCopy, defaultPageStateCopy, resolvePageError } from '../../constants/ui';

const MIN_GUEST_COUNT = 1;
const MAX_GUEST_COUNT = 4;
const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
const emptyState: ConfirmStateCopy = { ...defaultPageStateCopy, submitErrorTitle:defaultActionStateCopy.submitErrorTitle, submitErrorMessage:defaultActionStateCopy.bookingSubmitErrorMessage, paymentRefreshErrorMessage:defaultActionStateCopy.paymentRefreshErrorMessage };

Page({
  data: {
    draft: bookingStore.get(),
    confirmation: null as BookingConfirmationPayload | null,
    feedback: emptyFeedback,
    stateCopy: emptyState,
    loading: true,
    refreshingPayment: false,
    submitting: false,
    agreed: true,
    error: ''
  },
  async onShow() {
    this.setData({ draft: bookingStore.get() });
    await this.loadConfirmation();
  },
  async loadConfirmation() {
    const draft = bookingStore.get();
    this.setData({ draft, loading: true, error: '' });
    try {
      const [confirmation, feedback, pageStates] = await Promise.all([
        bookingService.getBookingConfirmation(draft),
        bookingService.getActionFeedbackDictionaries(),
        bookingService.getPageStateDictionaries()
      ]);
      this.setData({ confirmation, feedback, stateCopy: pageStates.confirm, loading: false });
    } catch (error) {
      this.setData({ loading: false, error: resolvePageError(error, this.data.stateCopy.errorMessage) });
    }
  },
  async changeGuestCount(event: WechatMiniprogram.TouchEvent) {
    if (this.data.submitting || this.data.loading || this.data.refreshingPayment) return;
    const delta = Number(event.currentTarget.dataset.delta || 0);
    const nextGuestCount = Math.min(MAX_GUEST_COUNT, Math.max(MIN_GUEST_COUNT, this.data.draft.guestCount + delta));
    if (nextGuestCount === this.data.draft.guestCount) {
      wx.showToast({ title: nextGuestCount === MIN_GUEST_COUNT ? this.data.feedback.minGuestCount : this.data.feedback.maxGuestCount, icon: 'none' });
      return;
    }
    bookingStore.update({ guestCount: nextGuestCount });
    const draft = bookingStore.get();
    this.setData({ draft, refreshingPayment: true, error: '' });
    try {
      this.setData({ confirmation: await bookingService.getBookingConfirmation(draft), refreshingPayment: false });
    } catch (error) {
      this.setData({ refreshingPayment: false, error: this.data.stateCopy.paymentRefreshErrorMessage });
    }
  },
  onNameInput(event: WechatMiniprogram.Input) {
    bookingStore.update({ contact: event.detail.value });
    this.setData({ draft: bookingStore.get(), error: '' });
  },
  onRemarkInput(event: WechatMiniprogram.Input) {
    bookingStore.update({ remark: event.detail.value });
    this.setData({ draft: bookingStore.get() });
  },
  onAgreement() {
    if (this.data.submitting) return;
    this.setData({ agreed: !this.data.agreed, error: '' });
  },
  editStore() {
    if (this.data.submitting) return;
    wx.navigateTo({ url: pageRoutes.stores });
  },
  editService() {
    if (this.data.submitting) return;
    wx.switchTab({ url: pageRoutes.services });
  },
  editTherapist() {
    if (this.data.submitting) return;
    wx.navigateTo({ url: pageRoutes.therapist });
  },
  editTime() {
    if (this.data.submitting) return;
    wx.navigateTo({ url: pageRoutes.time });
  },
  async submit() {
    if (this.data.submitting || this.data.loading || this.data.refreshingPayment) return;
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
        ? await bookingService.rescheduleBooking(this.data.draft, `reschedule-${Date.now()}`)
        : await bookingService.createBooking(this.data.draft, `create-${Date.now()}`);
      wx.redirectTo({ url: pageUrls.success(booking.id) });
    } catch (error) {
      this.setData({ error: this.data.stateCopy.submitErrorMessage, submitting: false });
      wx.showToast({ title: this.data.stateCopy.submitErrorMessage, icon: 'none' });
    }
  }
});
