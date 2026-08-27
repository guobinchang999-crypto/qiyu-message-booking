"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const ui_1 = require("../../constants/ui");
const emptyFeedback = {};
const emptyState = { ...ui_1.defaultPageStateCopy, pageTitle: '', searchPlaceholder: '', businessOnlyText: '', sortOptions: [], cardMeta: { ratingUnit: '', nextAvailablePrefix: '' }, mapEntryText: '', locationReadyText: '', locateActionText: '', locationDeniedWarning: '', locationFailedWarning: '' };
const earthRadiusKm = 6371;
const toRadians = (degree) => degree * Math.PI / 180;
const distanceBetween = (fromLatitude, fromLongitude, toLatitude, toLongitude) => {
    const latitudeDelta = toRadians(toLatitude - fromLatitude);
    const longitudeDelta = toRadians(toLongitude - fromLongitude);
    const fromLatitudeRadians = toRadians(fromLatitude);
    const toLatitudeRadians = toRadians(toLatitude);
    const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(fromLatitudeRadians) * Math.cos(toLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const withDistancesFrom = (stores, latitude, longitude) => stores.map((store) => {
    if (!Number.isFinite(store.latitude) || !Number.isFinite(store.longitude))
        return store;
    return { ...store, distanceKm: Number(distanceBetween(latitude, longitude, store.latitude, store.longitude).toFixed(1)) };
});
const sortStores = (stores, sortKey) => {
    return [...stores].sort((left, right) => {
        if (sortKey === 'distance')
            return left.distanceKm - right.distanceKm;
        if (sortKey === 'rating')
            return right.rating - left.rating || left.distanceKm - right.distanceKm;
        if (left.isFrequent !== right.isFrequent)
            return left.isFrequent ? -1 : 1;
        return left.distanceKm - right.distanceKm;
    });
};
const filterStores = (stores, keyword, businessOnly, sortKey) => {
    const normalizedKeyword = keyword.trim();
    const filteredStores = stores.filter((store) => {
        const matchesKeyword = !normalizedKeyword || store.name.includes(normalizedKeyword) || store.address.includes(normalizedKeyword);
        const matchesStatus = !businessOnly || store.businessStatusCode === 'OPEN';
        return matchesKeyword && matchesStatus;
    });
    return sortStores(filteredStores, sortKey);
};
const isPermissionDenied = (message) => {
    return Boolean(message && (message.includes('auth deny') || message.includes('authorize') || message.includes('permission')));
};
Page({
    data: {
        stores: [],
        visibleStores: [],
        sortOptions: [],
        storeCardMeta: { ratingUnit: '', nextAvailablePrefix: '' },
        sortKey: 'frequent',
        keyword: '',
        businessOnly: false,
        feedback: emptyFeedback,
        stateCopy: emptyState,
        locationStatus: 'ready',
        selectedLocationText: '',
        loading: true,
        error: ''
    },
    async onLoad() {
        await this.loadStores();
    },
    async onPullDownRefresh() {
        try {
            await this.loadStores();
        }
        finally {
            wx.stopPullDownRefresh();
        }
    },
    async loadStores() {
        this.setData({ loading: true, error: '' });
        try {
            const [stores, feedback, pageStates] = await Promise.all([
                booking_service_1.bookingService.getStores(),
                booking_service_1.bookingService.getActionFeedbackDictionaries(),
                booking_service_1.bookingService.getPageStateDictionaries()
            ]);
            this.setData({ stores, feedback, stateCopy: pageStates.stores, sortOptions: pageStates.stores.sortOptions, storeCardMeta: pageStates.stores.cardMeta, visibleStores: filterStores(stores, this.data.keyword, this.data.businessOnly, this.data.sortKey), loading: false });
        }
        catch (error) {
            this.setData({ loading: false, error: (0, ui_1.resolvePageError)(error, this.data.stateCopy.errorMessage) });
        }
    },
    onSearch(event) {
        const keyword = String(event.detail.value || '');
        this.setData({ keyword, visibleStores: filterStores(this.data.stores, keyword, this.data.businessOnly, this.data.sortKey) });
    },
    toggleBusinessOnly() {
        const businessOnly = !this.data.businessOnly;
        this.setData({ businessOnly, visibleStores: filterStores(this.data.stores, this.data.keyword, businessOnly, this.data.sortKey) });
    },
    chooseSort(event) {
        const sortKey = String(event.currentTarget.dataset.key || 'frequent');
        this.setData({ sortKey, visibleStores: filterStores(this.data.stores, this.data.keyword, this.data.businessOnly, sortKey) });
    },
    refreshLocation() {
        wx.getLocation({
            type: 'gcj02',
            success: (location) => {
                const sortKey = 'distance';
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
                const sortKey = 'distance';
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
                wx.showToast({ title: this.data.feedback.mapUnavailable, icon: 'none' });
            }
        });
    },
    goStore(event) {
        const storeId = event.detail.id || '';
        booking_1.bookingStore.selectStore(storeId);
        wx.navigateTo({ url: navigation_1.pageUrls.storeDetail(storeId) });
    },
    back() {
        wx.navigateBack();
    }
});
