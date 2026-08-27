import { bookingService } from '../../services/booking-service';
import { pageRoutes, pageUrls } from '../../constants/navigation';
import { PageStateCopy, ProfilePayload } from '../../services/contracts';
import { Booking } from '../../types/domain';
import { AUTH_SESSION_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from '../../services/config';
import { defaultPageStateCopy, resolvePageError } from '../../constants/ui';

const emptyProfile: ProfilePayload = {
  user: { name:'', phone:'', avatarText:'', level:'', balanceText:'', couponCount:0, packageCount:0 },
  title:'',
  settingsIcon:'',
  memberTitle:'',
  memberSubtitle:'',
  memberStats:[],
  shortcuts:[],
  recentBookingTitle:'',
  recentBookingActionText:'',
  menuItems:[],
  logoutText:'',
  logoutModalTitle:'',
  logoutModalContent:'',
  logoutConfirmText:'',
  logoutCancelText:''
};
const emptyState: PageStateCopy = { ...defaultPageStateCopy };

Page({
  data:{ profile:emptyProfile, recentBooking:null as Booking | null, stateCopy:emptyState, loading:true, error:'' },
  async onShow(){ await this.loadProfile(); },
  async onPullDownRefresh(){ try { await this.loadProfile(); } finally { wx.stopPullDownRefresh(); } },
  async loadProfile(){
    this.setData({ loading:true, error:'' });
    try {
      const [profile, bookings, pageStates] = await Promise.all([bookingService.getProfile(), bookingService.getBookings(), bookingService.getPageStateDictionaries()]);
      this.setData({ profile, recentBooking:bookings[0] || null, stateCopy:pageStates.profile, loading:false });
    } catch (error) {
      this.setData({ loading:false, error:resolvePageError(error, this.data.stateCopy.errorMessage) });
    }
  },
  onShortcut(event:WechatMiniprogram.TouchEvent){
    if (event.currentTarget.dataset.key === 'orders') this.goOrders();
  },
  onMenu(event:WechatMiniprogram.TouchEvent){
    if (event.currentTarget.dataset.key === 'orders') this.goOrders();
  },
  goOrders(){ wx.switchTab({ url:pageRoutes.orders }); },
  goRecentBooking(){
    if (!this.data.recentBooking) return;
    wx.navigateTo({ url:pageUrls.bookingDetail(this.data.recentBooking.id) });
  },
  logout(){
    wx.showModal({
      title:this.data.profile.logoutModalTitle,
      content:this.data.profile.logoutModalContent,
      confirmText:this.data.profile.logoutConfirmText,
      confirmColor:'#C25B52',
      cancelText:this.data.profile.logoutCancelText,
      success:(result) => {
        if (result.confirm) {
          wx.removeStorageSync(AUTH_TOKEN_STORAGE_KEY);
          wx.removeStorageSync(AUTH_SESSION_STORAGE_KEY);
          wx.reLaunch({ url:pageRoutes.login });
        }
      }
    });
  }
});
