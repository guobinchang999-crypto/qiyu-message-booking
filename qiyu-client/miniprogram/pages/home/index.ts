import { bookingService } from '../../services/booking-service';
import { pageRoutes, pageUrls } from '../../constants/navigation';
import { ActionFeedbackDictionaryPayload, HomeCopy, HomeQuickAction, PageStateCopy } from '../../services/contracts';
import { bookingStore } from '../../store/booking';
import { ServiceItem, Store, Therapist } from '../../types/domain';
import { defaultPageStateCopy, resolvePageError } from '../../constants/ui';
type HomeQuickActionView = HomeQuickAction & { isSupport:boolean };
const emptyHomeCopy: HomeCopy = { locationText:'', heroTitle:'', searchPlaceholder:'', quickActions:[], frequentTitle:'', frequentMoreText:'', nearbyTitle:'', nearbySortText:'', featuredServiceTitle:'', featuredServiceMoreText:'', memberTitle:'', memberSummary:'', memberActionText:'', storeCardMeta:{ ratingUnit:'', nextAvailablePrefix:'' }, serviceCardMeta:{ durationUnit:'', servedPrefix:'', servedSuffix:'' } };
const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
const emptyState = { ...defaultPageStateCopy } as PageStateCopy;
Page({
  data:{ frequentStores:[] as Store[], nearbyStores:[] as Store[], services:[] as ServiceItem[], therapists:[] as Therapist[], copy:emptyHomeCopy, quickActions:[] as HomeQuickActionView[], feedback:emptyFeedback, stateCopy:emptyState, loading:true, error:'' },
  async onShow(){ await this.loadHome(); },
  async onPullDownRefresh(){ try { await this.loadHome(); } finally { wx.stopPullDownRefresh(); } },
  async loadHome(){ this.setData({ loading:true, error:'' }); try { const [data, feedback, pageStates] = await Promise.all([bookingService.getHome(), bookingService.getActionFeedbackDictionaries(), bookingService.getPageStateDictionaries()]); this.setData({ frequentStores:data.frequentStores, nearbyStores:data.nearbyStores, services:data.featuredServices, therapists:data.featuredTherapists, copy:data.copy, quickActions:data.copy.quickActions.map((action) => ({ ...action, isSupport:action.key === 'support' })), feedback, stateCopy:pageStates.home, loading:false }); } catch (error) { this.setData({ loading:false, error:resolvePageError(error, this.data.stateCopy.errorMessage) }); } },
  onQuickAction(event:WechatMiniprogram.TouchEvent){
    const key = String(event.currentTarget.dataset.key || '');
    if (key === 'booking') { this.goServices(); return; }
    if (key === 'orders') { this.goOrders(); return; }
    if (key === 'benefits' || key === 'coupons' || key === 'packages') { this.goProfile(); return; }
    wx.showToast({ title:this.data.feedback.genericMockAction, icon:'none' });
  },
  onSupportContactError(){ wx.showToast({ title:this.data.feedback.supportUnavailable, icon:'none' }); },
  goStores(){ wx.navigateTo({ url:pageRoutes.stores }); },
  goServices(){ wx.switchTab({ url:pageRoutes.services }); },
  goStore(event:WechatMiniprogram.CustomEvent<{ id?: string }>){
    const storeId = event.detail.id || 'jingan';
    bookingStore.selectStore(storeId);
    wx.navigateTo({ url:pageUrls.storeDetail(storeId) });
  },
  goService(event:WechatMiniprogram.CustomEvent<{ id?: string }>){
    const serviceId = event.detail.id || 'neck';
    bookingStore.selectService(serviceId);
    wx.navigateTo({ url:pageUrls.serviceDetail(serviceId) });
  },
  goOrders(){ wx.switchTab({ url:pageRoutes.orders }); },
  goProfile(){ wx.switchTab({ url:pageRoutes.profile }); },
  showDistanceSort(){ wx.showToast({ title:this.data.feedback.distanceSorted, icon:'none' }); }
});
