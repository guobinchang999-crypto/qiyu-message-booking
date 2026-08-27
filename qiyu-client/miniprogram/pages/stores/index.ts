import { bookingService } from '../../services/booking-service';
import { pageUrls } from '../../constants/navigation';
import { ActionFeedbackDictionaryPayload, SortOption, StoreListStateCopy } from '../../services/contracts';
import { bookingStore } from '../../store/booking';
import { Store } from '../../types/domain';
import { defaultPageStateCopy, resolvePageError } from '../../constants/ui';

type SortKey = 'frequent' | 'distance' | 'rating';
type LocationStatus = 'ready' | 'denied' | 'failed';

const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
const emptyState = { ...defaultPageStateCopy, pageTitle:'', searchPlaceholder:'', businessOnlyText:'', sortOptions:[], cardMeta:{ ratingUnit:'', nextAvailablePrefix:'' }, mapEntryText:'', locationReadyText:'', locateActionText:'', locationDeniedWarning:'', locationFailedWarning:'' } as StoreListStateCopy;
const earthRadiusKm = 6371;

const toRadians = (degree: number): number => degree * Math.PI / 180;

const distanceBetween = (fromLatitude: number, fromLongitude: number, toLatitude: number, toLongitude: number): number => {
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const fromLatitudeRadians = toRadians(fromLatitude);
  const toLatitudeRadians = toRadians(toLatitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(fromLatitudeRadians) * Math.cos(toLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const withDistancesFrom = (stores: Store[], latitude: number, longitude: number): Store[] => stores.map((store) => {
  if (!Number.isFinite(store.latitude) || !Number.isFinite(store.longitude)) return store;
  return { ...store, distanceKm: Number(distanceBetween(latitude, longitude, store.latitude, store.longitude).toFixed(1)) };
});

const sortStores = (stores: Store[], sortKey: SortKey): Store[] => {
  return [...stores].sort((left, right) => {
    if (sortKey === 'distance') return left.distanceKm - right.distanceKm;
    if (sortKey === 'rating') return right.rating - left.rating || left.distanceKm - right.distanceKm;
    if (left.isFrequent !== right.isFrequent) return left.isFrequent ? -1 : 1;
    return left.distanceKm - right.distanceKm;
  });
};

const filterStores = (stores: Store[], keyword: string, businessOnly: boolean, sortKey: SortKey): Store[] => {
  const normalizedKeyword = keyword.trim();
  const filteredStores = stores.filter((store) => {
    const matchesKeyword = !normalizedKeyword || store.name.includes(normalizedKeyword) || store.address.includes(normalizedKeyword);
    const matchesStatus = !businessOnly || store.businessStatusCode === 'OPEN';
    return matchesKeyword && matchesStatus;
  });
  return sortStores(filteredStores, sortKey);
};

const isPermissionDenied = (message?: string): boolean => {
  return Boolean(message && (message.includes('auth deny') || message.includes('authorize') || message.includes('permission')));
};

Page({
  data: {
    stores: [] as Store[],
    visibleStores: [] as Store[],
    sortOptions: [] as Array<SortOption<SortKey>>,
    storeCardMeta: { ratingUnit:'', nextAvailablePrefix:'' },
    sortKey: 'frequent' as SortKey,
    keyword: '',
    businessOnly: false,
    feedback: emptyFeedback,
    stateCopy: emptyState,
    locationStatus: 'ready' as LocationStatus,
    selectedLocationText: '',
    loading: true,
    error: ''
  },
  async onLoad() {
    await this.loadStores();
  },
  async onPullDownRefresh() {
    try { await this.loadStores(); } finally { wx.stopPullDownRefresh(); }
  },
  async loadStores() {
    this.setData({ loading: true, error: '' });
    try {
      const [stores, feedback, pageStates] = await Promise.all([
        bookingService.getStores(),
        bookingService.getActionFeedbackDictionaries(),
        bookingService.getPageStateDictionaries()
      ]);
      this.setData({ stores, feedback, stateCopy: pageStates.stores, sortOptions: pageStates.stores.sortOptions, storeCardMeta: pageStates.stores.cardMeta, visibleStores: filterStores(stores, this.data.keyword, this.data.businessOnly, this.data.sortKey), loading: false });
    } catch (error) {
      this.setData({ loading: false, error: resolvePageError(error, this.data.stateCopy.errorMessage) });
    }
  },
  onSearch(event: WechatMiniprogram.Input) {
    const keyword = String(event.detail.value || '');
    this.setData({ keyword, visibleStores: filterStores(this.data.stores, keyword, this.data.businessOnly, this.data.sortKey) });
  },
  toggleBusinessOnly() {
    const businessOnly = !this.data.businessOnly;
    this.setData({ businessOnly, visibleStores: filterStores(this.data.stores, this.data.keyword, businessOnly, this.data.sortKey) });
  },
  chooseSort(event: WechatMiniprogram.TouchEvent) {
    const sortKey = String(event.currentTarget.dataset.key || 'frequent') as SortKey;
    this.setData({ sortKey, visibleStores: filterStores(this.data.stores, this.data.keyword, this.data.businessOnly, sortKey) });
  },
  refreshLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (location) => {
        const sortKey: SortKey = 'distance';
        const stores = withDistancesFrom(this.data.stores, location.latitude, location.longitude);
        this.setData({
          stores,
          locationStatus: 'ready',
          selectedLocationText: this.data.stateCopy.locationReadyText,
          sortKey,
          visibleStores: filterStores(stores, this.data.keyword, this.data.businessOnly, sortKey)
        });
      },
      fail: (error) => {
        this.setData({ locationStatus: isPermissionDenied(error.errMsg) ? 'denied' : 'failed' });
      }
    });
  },
  openMap() {
    wx.chooseLocation({
      success: (location) => {
        const selectedLocationText = location.name || location.address || '';
        const sortKey: SortKey = 'distance';
        const stores = withDistancesFrom(this.data.stores, location.latitude, location.longitude);
        this.setData({
          stores,
          locationStatus: 'ready',
          selectedLocationText,
          sortKey,
          visibleStores: filterStores(stores, this.data.keyword, this.data.businessOnly, sortKey)
        });
      },
      fail: () => {
        this.setData({ locationStatus: 'failed' });
        wx.showToast({ title:this.data.feedback.mapUnavailable, icon:'none' });
      }
    });
  },
  goStore(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    const storeId = event.detail.id || '';
    bookingStore.selectStore(storeId);
    wx.navigateTo({ url: pageUrls.storeDetail(storeId) });
  },
  back() {
    wx.navigateBack();
  }
});
