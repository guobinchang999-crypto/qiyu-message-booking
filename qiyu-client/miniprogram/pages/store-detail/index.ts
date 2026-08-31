import { bookingService } from '../../services/booking-service';
import { pageUrls } from '../../constants/navigation';
import { ActionFeedbackDictionaryPayload, StoreDetailDictionaryPayload } from '../../services/contracts';
import { bookingStore } from '../../store/booking';
import { ServiceItem, Store, StoreReview, Therapist } from '../../types/domain';
import { imagePlaceholderLabels, resolvePageError } from '../../constants/ui';
import { callStore, navigateToStore } from '../../utils/store-actions';

const emptyDictionaries: StoreDetailDictionaryPayload = {
  actions: [],
  recommendedServiceTitle: '',
  allServiceText: '',
  primaryButtonText: '',
  loadingTitle: '',
  loadingDescription: '',
  errorTitle: '',
  errorMessage: '',
  retryText: '',
  loadMoreText: '',
  favoriteActiveText: '',
  favoriteAddedToast: '',
  favoriteRemovedToast: '',
  panels: { facilities:'', businessHours:'', notice:'' },
  expandText: '',
  collapseText: '',
  businessHoursText: '',
  noticeText: '',
  tabs: [],
  reviewTitle: '',
  reviewSummarySuffix: '',
  storeCardMeta: { ratingUnit:'', nextAvailablePrefix:'' },
  serviceCardMeta: { durationUnit:'', servedPrefix:'', servedSuffix:'' }
};
const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
type StoreTab = 'services' | 'therapists' | 'reviews';
const reviewPageSize = 2;

Page({
  data: {
    store: null as Store | null,
    storeId: '',
    services: [] as ServiceItem[],
    therapists: [] as Therapist[],
    reviews: [] as StoreReview[],
    reviewPage: 1,
    reviewHasMore: false,
    reviewLoadingMore: false,
    dictionaries: emptyDictionaries,
    feedback: emptyFeedback,
    activeTab: 'services' as StoreTab,
    expandedPanels: { facilities: false, businessHours: false, notice: false },
    galleryIndex: 1,
    galleryImages: [] as string[],
    galleryTotal: 0,
    favorite: false,
    favoriteUpdating: false,
    placeholderLabel: imagePlaceholderLabels.brand,
    loading: true,
    error: ''
  },
  async onLoad(query: { id?: string }) {
    const storeId = query.id || '';
    if (!storeId) {
      this.setData({ loading: false, error: emptyDictionaries.errorMessage });
      return;
    }
    bookingStore.selectStore(storeId);
    this.setData({ storeId });
    await this.loadStore();
  },
  async loadStore() {
    this.setData({ loading: true, error: '' });
    try {
      const [dictionaries, feedback] = await Promise.all([
        bookingService.getStoreDetailDictionaries(),
        bookingService.getActionFeedbackDictionaries()
      ]);
      this.setData({ dictionaries, feedback });
      const [store, services, therapists, reviewPage, favorite] = await Promise.all([
        bookingService.getStore(this.data.storeId),
        bookingService.getServices(),
        bookingService.getTherapists(''),
        bookingService.getStoreReviews(this.data.storeId, undefined, 1, reviewPageSize),
        bookingService.getFavorite('stores', this.data.storeId)
      ]);
      const galleryImages = store.galleryImageUrls?.length ? store.galleryImageUrls : [store.galleryImageUrl || store.coverImageUrl || ''];
      this.setData({ store, services, therapists: therapists.filter((item) => item.storeId === store.id), reviews: reviewPage.items, reviewPage: reviewPage.page, reviewHasMore: reviewPage.hasMore, galleryImages, galleryIndex: 1, galleryTotal: galleryImages.length, favorite: favorite.favorite, loading: false });
    } catch (error) {
      this.setData({ loading: false, error: resolvePageError(error, this.data.dictionaries.errorMessage) });
    }
  },
  goService(event?: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    if (this.data.loading || this.data.error) return;
    const serviceId = event?.detail?.id || '';
    if (!serviceId) return;
    bookingStore.selectStore(this.data.storeId);
    bookingStore.selectService(serviceId);
    wx.navigateTo({ url: pageUrls.serviceDetail(serviceId) });
  },
  chooseTab(event: WechatMiniprogram.TouchEvent) {
    this.setData({ activeTab: String(event.currentTarget.dataset.tab || 'services') as StoreTab });
  },
  togglePanel(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key || '') as keyof typeof this.data.expandedPanels;
    if (!key) return;
    this.setData({ [`expandedPanels.${key}`]: !this.data.expandedPanels[key] });
  },
  onGalleryChange(event: WechatMiniprogram.SwiperChange) {
    this.setData({ galleryIndex: event.detail.current + 1 });
  },
  async loadMoreReviews() {
    if (this.data.reviewLoadingMore || !this.data.reviewHasMore) return;
    this.setData({ reviewLoadingMore: true });
    try {
      const reviewPage = await bookingService.getStoreReviews(this.data.storeId, undefined, this.data.reviewPage + 1, reviewPageSize);
      this.setData({
        reviews: [...this.data.reviews, ...reviewPage.items],
        reviewPage: reviewPage.page,
        reviewHasMore: reviewPage.hasMore,
        reviewLoadingMore: false
      });
    } catch (error) {
      this.setData({ reviewLoadingMore: false });
    }
  },
  async onAction(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key || '');
    if (key === 'favorite') {
      if (this.data.favoriteUpdating) return;
      const favorite = !this.data.favorite;
      this.setData({ favoriteUpdating: true });
      try {
        const result = await bookingService.setFavorite('stores', this.data.storeId, favorite);
        this.setData({ favorite: result.favorite });
        wx.showToast({ title: result.favorite ? this.data.dictionaries.favoriteAddedToast : this.data.dictionaries.favoriteRemovedToast, icon: 'none' });
      } catch (error) {
        wx.showToast({ title: this.data.feedback.genericUnavailable, icon: 'none' });
      } finally {
        this.setData({ favoriteUpdating: false });
      }
      return;
    }
    if (key === 'navigation') {
      navigateToStore(this.data.store, this.data.feedback);
      return;
    }
    if (key === 'contact') {
      callStore(this.data.store, this.data.feedback);
    }
  },
  back() {
    wx.navigateBack();
  }
});
