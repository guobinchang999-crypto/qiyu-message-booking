import { bookingService } from '../../services/booking-service';
import { pageRoutes, pageUrls } from '../../constants/navigation';
import { PageStateCopy, SortOption } from '../../services/contracts';
import { ServiceItem } from '../../types/domain';
import { bookingStore } from '../../store/booking';
import { defaultPageStateCopy, resolvePageError } from '../../constants/ui';

type SortKey = 'recommended' | 'sales' | 'price';

const emptyState = { ...defaultPageStateCopy } as PageStateCopy;

const sortServices = (services: ServiceItem[], sortKey: SortKey): ServiceItem[] => {
  return [...services].sort((left, right) => {
    if (sortKey === 'sales') return right.salesCount - left.salesCount;
    if (sortKey === 'price') return left.memberPrice - right.memberPrice;
    return right.salesCount - left.salesCount;
  });
};

const filterServices = (services: ServiceItem[], keyword: string, category: string, allCategory: string, sortKey: SortKey): ServiceItem[] => {
  const normalizedKeyword = keyword.trim();
  const filteredServices = services.filter((service) => {
    const matchesKeyword = !normalizedKeyword || service.name.includes(normalizedKeyword) || service.description.includes(normalizedKeyword);
    const matchesCategory = category === allCategory || service.category === category;
    return matchesKeyword && matchesCategory;
  });
  return sortServices(filteredServices, sortKey);
};

Page({
  data: {
    services: [] as ServiceItem[],
    visibleServices: [] as ServiceItem[],
    pageTitle: '',
    categories: [] as string[],
    sortOptions: [] as Array<SortOption<SortKey>>,
    sortKey: 'recommended' as SortKey,
    allCategory: '',
    storeSwitchLabel: '',
    searchPlaceholder: '',
    clearSearchText: '',
    bannerText: '',
    serviceCardMeta: { durationUnit:'', servedPrefix:'', servedSuffix:'' },
    stateCopy: emptyState,
    category: '',
    keyword: '',
    loading: true,
    error: ''
  },
  async onLoad() {
    await this.loadServices();
  },
  async onPullDownRefresh() {
    try { await this.loadServices(); } finally { wx.stopPullDownRefresh(); }
  },
  async loadServices() {
    this.setData({ loading: true, error: '' });
    try {
      const [services, dictionaries, pageStates] = await Promise.all([
        bookingService.getServices(),
        bookingService.getServiceDictionaries(),
        bookingService.getPageStateDictionaries()
      ]);
      const category = this.data.category || dictionaries.allCategory;
      this.setData({ services, pageTitle: dictionaries.pageTitle, categories: dictionaries.categories, allCategory: dictionaries.allCategory, storeSwitchLabel: dictionaries.storeSwitchLabel, searchPlaceholder: dictionaries.searchPlaceholder, clearSearchText: dictionaries.clearSearchText, sortOptions: dictionaries.sortOptions, bannerText: dictionaries.bannerText, serviceCardMeta: dictionaries.cardMeta, stateCopy: pageStates.services, category, visibleServices: filterServices(services, this.data.keyword, category, dictionaries.allCategory, this.data.sortKey), loading: false });
    } catch (error) {
      this.setData({ loading: false, error: resolvePageError(error, this.data.stateCopy.errorMessage) });
    }
  },
  onSearch(event: WechatMiniprogram.Input) {
    const keyword = String(event.detail.value || '');
    this.setData({ keyword, visibleServices: filterServices(this.data.services, keyword, this.data.category, this.data.allCategory, this.data.sortKey) });
  },
  clearSearch() {
    this.setData({ keyword: '', visibleServices: filterServices(this.data.services, '', this.data.category, this.data.allCategory, this.data.sortKey) });
  },
  chooseCategory(event: WechatMiniprogram.TouchEvent) {
    const category = String(event.currentTarget.dataset.category || this.data.allCategory);
    this.setData({ category, visibleServices: filterServices(this.data.services, this.data.keyword, category, this.data.allCategory, this.data.sortKey) });
  },
  chooseSort(event: WechatMiniprogram.TouchEvent) {
    const sortKey = String(event.currentTarget.dataset.key || 'recommended') as SortKey;
    this.setData({ sortKey, visibleServices: filterServices(this.data.services, this.data.keyword, this.data.category, this.data.allCategory, sortKey) });
  },
  goStores() {
    wx.navigateTo({ url: pageRoutes.stores });
  },
  goService(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    const serviceId = String(event.detail.id || '');
    if (!serviceId) return;
    bookingStore.selectService(serviceId);
    wx.navigateTo({ url: pageUrls.serviceDetail(serviceId) });
  }
});
