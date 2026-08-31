"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const ui_1 = require("../../constants/ui");
const emptyState = { ...ui_1.defaultPageStateCopy };
const sortServices = (services, sortKey) => {
    return [...services].sort((left, right) => {
        if (sortKey === 'sales')
            return right.salesCount - left.salesCount;
        if (sortKey === 'price')
            return left.memberPrice - right.memberPrice;
        return right.salesCount - left.salesCount;
    });
};
const filterServices = (services, keyword, category, allCategory, sortKey) => {
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
        services: [],
        visibleServices: [],
        pageTitle: '',
        categories: [],
        sortOptions: [],
        sortKey: 'recommended',
        allCategory: '',
        storeSwitchLabel: '',
        searchPlaceholder: '',
        clearSearchText: '',
        bannerText: '',
        serviceCardMeta: { durationUnit: '', servedPrefix: '', servedSuffix: '' },
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
        try {
            await this.loadServices();
        }
        finally {
            wx.stopPullDownRefresh();
        }
    },
    async loadServices() {
        this.setData({ loading: true, error: '' });
        try {
            const [services, dictionaries, pageStates] = await Promise.all([
                booking_service_1.bookingService.getServices(),
                booking_service_1.bookingService.getServiceDictionaries(),
                booking_service_1.bookingService.getPageStateDictionaries()
            ]);
            const category = this.data.category || dictionaries.allCategory;
            this.setData({ services, pageTitle: dictionaries.pageTitle, categories: dictionaries.categories, allCategory: dictionaries.allCategory, storeSwitchLabel: dictionaries.storeSwitchLabel, searchPlaceholder: dictionaries.searchPlaceholder, clearSearchText: dictionaries.clearSearchText, sortOptions: dictionaries.sortOptions, bannerText: dictionaries.bannerText, serviceCardMeta: dictionaries.cardMeta, stateCopy: pageStates.services, category, visibleServices: filterServices(services, this.data.keyword, category, dictionaries.allCategory, this.data.sortKey), loading: false });
        }
        catch (error) {
            this.setData({ loading: false, error: (0, ui_1.resolvePageError)(error, this.data.stateCopy.errorMessage) });
        }
    },
    onSearch(event) {
        const keyword = String(event.detail.value || '');
        this.setData({ keyword, visibleServices: filterServices(this.data.services, keyword, this.data.category, this.data.allCategory, this.data.sortKey) });
    },
    clearSearch() {
        this.setData({ keyword: '', visibleServices: filterServices(this.data.services, '', this.data.category, this.data.allCategory, this.data.sortKey) });
    },
    chooseCategory(event) {
        const category = String(event.currentTarget.dataset.category || this.data.allCategory);
        this.setData({ category, visibleServices: filterServices(this.data.services, this.data.keyword, category, this.data.allCategory, this.data.sortKey) });
    },
    chooseSort(event) {
        const sortKey = String(event.currentTarget.dataset.key || 'recommended');
        this.setData({ sortKey, visibleServices: filterServices(this.data.services, this.data.keyword, this.data.category, this.data.allCategory, sortKey) });
    },
    goStores() {
        wx.navigateTo({ url: navigation_1.pageRoutes.stores });
    },
    goService(event) {
        const serviceId = String(event.detail.id || '');
        if (!serviceId)
            return;
        booking_1.bookingStore.selectService(serviceId);
        wx.navigateTo({ url: navigation_1.pageUrls.serviceDetail(serviceId) });
    }
});
