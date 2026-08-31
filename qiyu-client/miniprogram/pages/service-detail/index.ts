import { bookingService } from '../../services/booking-service';
import { pageRoutes, pageUrls } from '../../constants/navigation';
import { ActionFeedbackDictionaryPayload, ServiceDictionaryPayload } from '../../services/contracts';
import { bookingStore } from '../../store/booking';
import { ServiceItem, Store, StoreReview, Therapist } from '../../types/domain';
import { imagePlaceholderLabels, resolvePageError } from '../../constants/ui';
const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
const reviewPageSize = 2;
const emptyDictionaries: ServiceDictionaryPayload = {
  pageTitle:'',
  categories:[],
  allCategory:'',
  storeSwitchLabel:'',
  searchPlaceholder:'',
  clearSearchText:'',
  sortOptions:[],
  cardMeta: { durationUnit:'', servedPrefix:'', servedSuffix:'' },
  storeCardMeta: { ratingUnit:'', nextAvailablePrefix:'' },
  bannerText:'',
  detailTitle:'',
  loadingTitle:'',
  loadingDescription:'',
  errorTitle:'',
  errorMessage:'',
  retryText:'',
  loadMoreText:'',
  favoriteText:'',
  favoritedText:'',
  shareText:'',
  memberPriceLabel:'',
  introTitle:'',
  processTitle:'',
  suitableTitle:'',
  noticeTitle:'',
  noticeText:'',
  recommendedTherapistTitle:'',
  nextAvailablePrefix:'',
  reviewTitle:'',
  reviewSummarySuffix:'',
  primaryButtonText:'',
  favoriteAddedToast:'',
  favoriteRemovedToast:''
};

Page({
  data: {
    service: null as ServiceItem | null,
    store: null as Store | null,
    therapists: [] as Therapist[],
    reviews: [] as StoreReview[],
    reviewPage: 1,
    reviewHasMore: false,
    reviewLoadingMore: false,
    serviceId: '',
    serviceMetaText: '',
    feedback: emptyFeedback,
    dictionaries: emptyDictionaries,
    favorite: false,
    favoriteUpdating: false,
    placeholderLabel: imagePlaceholderLabels.brand,
    loading: true,
    error: ''
  },
  async onLoad(query: { id?: string }) {
    const serviceId = query.id || '';
    if (!serviceId) {
      this.setData({ loading: false, error: emptyDictionaries.errorMessage });
      return;
    }
    bookingStore.selectService(serviceId);
    this.setData({ serviceId });
    await this.loadService();
  },
  async loadService() {
    this.setData({ loading: true, error: '' });
    try {
      const [feedback, dictionaries] = await Promise.all([
        bookingService.getActionFeedbackDictionaries(),
        bookingService.getServiceDictionaries()
      ]);
      this.setData({ feedback, dictionaries });
      const draft = bookingStore.get();
      const stores = await bookingService.getStores();
      const storeId = draft.storeId || stores.find((item) => item.isFrequent)?.id || stores[0]?.id || '';
      if (!storeId) throw new Error(dictionaries.errorMessage);
      bookingStore.selectStore(storeId);
      const [service, store, therapists, reviewPage, favorite] = await Promise.all([
        bookingService.getService(this.data.serviceId),
        bookingService.getStore(storeId),
        bookingService.getTherapists(this.data.serviceId),
        bookingService.getStoreReviews(storeId, this.data.serviceId, 1, reviewPageSize),
        bookingService.getFavorite('services', this.data.serviceId)
      ]);
      const metaItems = [`${service.durationMinutes}${dictionaries.cardMeta.durationUnit}`, service.tags[0], `${dictionaries.cardMeta.servedPrefix}${service.salesCount}${dictionaries.cardMeta.servedSuffix}`].filter(Boolean);
      this.setData({
        service,
        store,
        therapists: therapists.filter((item) => item.storeId === storeId).slice(0, 2),
        reviews: reviewPage.items,
        reviewPage: reviewPage.page,
        reviewHasMore: reviewPage.hasMore,
        serviceMetaText: metaItems.join(' · '),
        favorite: favorite.favorite,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false, error: resolvePageError(error, this.data.dictionaries.errorMessage) });
    }
  },
  goTherapist() {
    if (!this.data.service || this.data.loading) return;
    wx.navigateTo({ url: pageRoutes.therapist });
  },
  async toggleFavorite() {
    if (!this.data.service || this.data.favoriteUpdating) return;
    const favorite = !this.data.favorite;
    this.setData({ favoriteUpdating: true });
    try {
      const result = await bookingService.setFavorite('services', this.data.serviceId, favorite);
      this.setData({ favorite: result.favorite });
      wx.showToast({ title: result.favorite ? this.data.dictionaries.favoriteAddedToast : this.data.dictionaries.favoriteRemovedToast, icon: 'none' });
    } catch (error) {
      wx.showToast({ title: this.data.feedback.genericUnavailable, icon: 'none' });
    } finally {
      this.setData({ favoriteUpdating: false });
    }
  },
  onShareAppMessage() {
    const service = this.data.service;
    return {
      title: service ? service.name : this.data.dictionaries.detailTitle,
      path: pageUrls.serviceDetail(this.data.serviceId)
    };
  },
  async loadMoreReviews() {
    if (this.data.reviewLoadingMore || !this.data.reviewHasMore) return;
    const storeId = this.data.store?.id || bookingStore.get().storeId;
    this.setData({ reviewLoadingMore: true });
    try {
      const reviewPage = await bookingService.getStoreReviews(storeId, this.data.serviceId, this.data.reviewPage + 1, reviewPageSize);
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
  back() {
    wx.navigateBack();
  }
});
