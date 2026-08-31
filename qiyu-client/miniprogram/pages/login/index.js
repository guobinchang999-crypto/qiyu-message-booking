"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const config_1 = require("../../services/config");
const http_1 = require("../../services/http");
const SMS_COUNTDOWN_SECONDS = 60;
const emptyCopy = {
    brandMark: '',
    brandName: '',
    brandSubtitle: '',
    welcomeText: '',
    panelTitle: '',
    phoneLabel: '',
    phonePlaceholder: '',
    codeLabel: '',
    codePlaceholder: '',
    sendCodeText: '',
    loginButtonText: '',
    loggingInText: '',
    agreementText: '',
    wechatEntryText: '',
    codeSentToastText: '',
    agreementRequiredToastText: '',
    phoneInvalidMessage: '',
    codeInvalidMessage: '',
    demoCode: ''
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
    countdownTimer: 0,
    async onLoad() {
        try {
            this.setData({ copy: await booking_service_1.bookingService.getLoginCopy() });
        }
        catch (error) {
            this.setData({ copy: emptyCopy });
        }
    },
    onUnload() {
        this.clearCountdown();
    },
    onPhoneInput(event) {
        this.setData({ phone: event.detail.value, phoneError: '' });
    },
    onCodeInput(event) {
        this.setData({ code: event.detail.value, codeError: '' });
    },
    onAgreementChange() {
        if (this.data.submitting)
            return;
        this.setData({ agreed: !this.data.agreed });
    },
    async sendCode() {
        if (this.data.submitting || this.data.sendingCode || this.data.countdown > 0)
            return;
        if (!this.validatePhone())
            return;
        this.setData({ sendingCode: true });
        try {
            const result = await booking_service_1.bookingService.sendLoginCode(this.data.phone);
            this.setData({ sendingCode: false, countdown: result.expiresIn || SMS_COUNTDOWN_SECONDS, code: this.data.code || result.verificationCode || this.data.copy.demoCode, codeError: '' });
            wx.showToast({ title: this.data.copy.codeSentToastText, icon: 'none' });
            this.startCountdown();
        }
        catch (error) {
            this.setData({ sendingCode: false });
            wx.showToast({ title: this.data.copy.codeSentToastText, icon: 'none' });
        }
    },
    async onLogin() {
        if (this.data.submitting)
            return;
        const validPhone = this.validatePhone();
        const validCode = this.validateCode();
        if (!validPhone || !validCode)
            return;
        if (!this.data.agreed) {
            wx.showToast({ title: this.data.copy.agreementRequiredToastText, icon: 'none' });
            return;
        }
        this.setData({ submitting: true });
        try {
            const result = await booking_service_1.bookingService.login(this.data.phone, this.data.code);
            wx.setStorageSync(config_1.AUTH_TOKEN_STORAGE_KEY, result.accessToken);
            wx.setStorageSync(config_1.AUTH_SESSION_STORAGE_KEY, { ...result, expiresAt: Date.now() + result.expiresIn * 1000 });
            (0, http_1.clearLoginRedirectGuard)();
            wx.reLaunch({ url: navigation_1.pageRoutes.home });
        }
        catch (error) {
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
        }, 1000);
    },
    clearCountdown() {
        if (!this.countdownTimer)
            return;
        clearInterval(this.countdownTimer);
        this.countdownTimer = 0;
    }
});
