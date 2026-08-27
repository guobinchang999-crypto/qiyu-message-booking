import { bookingService } from '../../services/booking-service';
import { pageRoutes } from '../../constants/navigation';
import { LoginCopyPayload } from '../../services/contracts';
import { AUTH_SESSION_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from '../../services/config';

const SMS_COUNTDOWN_SECONDS = 60;
const emptyCopy: LoginCopyPayload = {
  brandMark:'',
  brandName:'',
  brandSubtitle:'',
  welcomeText:'',
  panelTitle:'',
  phoneLabel:'',
  phonePlaceholder:'',
  codeLabel:'',
  codePlaceholder:'',
  sendCodeText:'',
  loginButtonText:'',
  loggingInText:'',
  agreementText:'',
  wechatEntryText:'',
  codeSentToastText:'',
  agreementRequiredToastText:'',
  phoneInvalidMessage:'',
  codeInvalidMessage:'',
  demoCode:''
};

Page({
  data: {
    copy: emptyCopy,
    phone: '13800001288',
    code: '',
    agreed: false,
    submitting: false,
    sendingCode: false,
    countdown: 0,
    phoneError: '',
    codeError: ''
  },
  countdownTimer: 0 as number,
  async onLoad() {
    try {
      this.setData({ copy: await bookingService.getLoginCopy() });
    } catch (error) {
      this.setData({ copy: emptyCopy });
    }
  },
  onUnload() {
    this.clearCountdown();
  },
  onPhoneInput(event: WechatMiniprogram.Input) {
    this.setData({ phone: event.detail.value, phoneError: '' });
  },
  onCodeInput(event: WechatMiniprogram.Input) {
    this.setData({ code: event.detail.value, codeError: '' });
  },
  onAgreementChange() {
    if (this.data.submitting) return;
    this.setData({ agreed: !this.data.agreed });
  },
  async sendCode() {
    if (this.data.submitting || this.data.sendingCode || this.data.countdown > 0) return;
    if (!this.validatePhone()) return;
    this.setData({ sendingCode: true });
    try {
      const result = await bookingService.sendLoginCode(this.data.phone);
      this.setData({ sendingCode: false, countdown: result.expiresIn || SMS_COUNTDOWN_SECONDS, code: this.data.code || result.verificationCode || this.data.copy.demoCode, codeError: '' });
      wx.showToast({ title: this.data.copy.codeSentToastText, icon: 'none' });
      this.startCountdown();
    } catch (error) {
      this.setData({ sendingCode: false });
      wx.showToast({ title: this.data.copy.codeSentToastText, icon: 'none' });
    }
  },
  async onLogin() {
    if (this.data.submitting) return;
    const validPhone = this.validatePhone();
    const validCode = this.validateCode();
    if (!validPhone || !validCode) return;
    if (!this.data.agreed) {
      wx.showToast({ title: this.data.copy.agreementRequiredToastText, icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    try {
      const result = await bookingService.login(this.data.phone, this.data.code);
      wx.setStorageSync(AUTH_TOKEN_STORAGE_KEY, result.accessToken);
      wx.setStorageSync(AUTH_SESSION_STORAGE_KEY, { ...result, expiresAt: Date.now() + result.expiresIn * 1000 });
      wx.reLaunch({ url: pageRoutes.home });
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({ title: this.data.copy.codeInvalidMessage, icon: 'none' });
    }
  },
  validatePhone() {
    if (!/^1\d{10}$/.test(this.data.phone)) {
      this.setData({ phoneError: this.data.copy.phoneInvalidMessage });
      return false;
    }
    return true;
  },
  validateCode() {
    if (!/^\d{6}$/.test(this.data.code)) {
      this.setData({ codeError: this.data.copy.codeInvalidMessage });
      return false;
    }
    return true;
  },
  startCountdown() {
    this.clearCountdown();
    this.countdownTimer = setInterval(() => {
      const next = this.data.countdown - 1;
      if (next <= 0) {
        this.clearCountdown();
        this.setData({ countdown: 0 });
        return;
      }
      this.setData({ countdown: next });
    }, 1000) as unknown as number;
  },
  clearCountdown() {
    if (!this.countdownTimer) return;
    clearInterval(this.countdownTimer);
    this.countdownTimer = 0;
  }
});
