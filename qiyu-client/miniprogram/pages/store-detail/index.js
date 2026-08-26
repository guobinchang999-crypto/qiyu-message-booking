"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const ui_1 = require("../../constants/ui");
const store_actions_1 = require("../../utils/store-actions");
const emptyDictionaries = {
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
    panels: { facilities: '', businessHours: '', notice: '' },
    expandText: '',
    collapseText: '',
    businessHoursText: '',
    noticeText: '',
    tabs: [],
    reviewTitle: '',
    reviewSummarySuffix: '',
    storeCardMeta: { ratingUnit: '', nextAvailablePrefix: '' },
    serviceCardMeta: { durationUnit: '', servedPrefix: '', servedSuffix: '' }
};
const emptyFeedback = {};
const reviewPageSize = 2;
Page({
    data: {
        store: null,
        storeId: 'jingan',
        services: [],
        therapists: [],
        reviews: [],
        reviewPage: 1,
        reviewHasMore: false,
        reviewLoadingMore: false,
        dictionaries: emptyDictionaries,
        feedback: emptyFeedback,
        activeTab: 'services',
        expandedPanels: { facilities: false, businessHours: false, notice: false },
        galleryIndex: 1,
        galleryImages: [],
        galleryTotal: 0,
        favorite: false,
        placeholderLabel: ui_1.imagePlaceholderLabels.brand,
        loading: true,
        error: ''
    },
    async onLoad(query) {
        const storeId = query.id || 'jingan';
        booking_1.bookingStore.selectStore(storeId);
        this.setData({ storeId });
        await this.loadStore();
    },
    async loadStore() {
        this.setData({ loading: true, error: '' });
        try {
            const [dictionaries, feedback] = await Promise.all([
                booking_service_1.bookingService.getStoreDetailDictionaries(),
                booking_service_1.bookingService.getActionFeedbackDictionaries()
            ]);
            this.setData({ dictionaries, feedback });
            const [store, home, therapists, reviewPage] = await Promise.all([
                booking_service_1.bookingService.getStore(this.data.storeId),
                booking_service_1.bookingService.getHome(),
                booking_service_1.bookingService.getTherapists('neck'),
                booking_service_1.bookingService.getStoreReviews(this.data.storeId, undefined, 1, reviewPageSize)
            ]);
            const galleryImages = store.galleryImageUrls?.length ? store.galleryImageUrls : [store.galleryImageUrl || store.coverImageUrl || ''];
            this.setData({ store, services: home.featuredServices, therapists, reviews: reviewPage.items, reviewPage: reviewPage.page, reviewHasMore: reviewPage.hasMore, galleryImages, galleryIndex: 1, galleryTotal: galleryImages.length, loading: false });
        }
        catch (error) {
            this.setData({ loading: false, error: this.data.dictionaries.errorMessage });
        }
    },
    goService(event) {
        if (this.data.loading || this.data.error)
            return;
        const serviceId = event?.detail?.id || 'neck';
        booking_1.bookingStore.selectStore(this.data.storeId);
        booking_1.bookingStore.selectService(serviceId);
        wx.navigateTo({ url: navigation_1.pageUrls.serviceDetail(serviceId) });
    },
    chooseTab(event) {
        this.setData({ activeTab: String(event.currentTarget.dataset.tab || 'services') });
    },
    togglePanel(event) {
        const key = String(event.currentTarget.dataset.key || '');
        if (!key)
            return;
        this.setData({ [`expandedPanels.${key}`]: !this.data.expandedPanels[key] });
    },
    onGalleryChange(event) {
        this.setData({ galleryIndex: event.detail.current + 1 });
    },
    async loadMoreReviews() {
        if (this.data.reviewLoadingMore || !this.data.reviewHasMore)
            return;
        this.setData({ reviewLoadingMore: true });
        try {
            const reviewPage = await booking_service_1.bookingService.getStoreReviews(this.data.storeId, undefined, this.data.reviewPage + 1, reviewPageSize);
            this.setData({
                reviews: [...this.data.reviews, ...reviewPage.items],
                reviewPage: reviewPage.page,
                reviewHasMore: reviewPage.hasMore,
                reviewLoadingMore: false
            });
        }
        catch (error) {
            this.setData({ reviewLoadingMore: false });
        }
    },
    onAction(event) {
        const key = String(event.currentTarget.dataset.key || '');
        if (key === 'favorite') {
            const favorite = !this.data.favorite;
            this.setData({ favorite });
            wx.showToast({ title: favorite ? this.data.dictionaries.favoriteAddedToast : this.data.dictionaries.favoriteRemovedToast, icon: 'none' });
            return;
        }
        if (key === 'navigation') {
            (0, store_actions_1.navigateToStore)(this.data.store, this.data.feedback);
            return;
        }
        if (key === 'contact') {
            (0, store_actions_1.callStore)(this.data.store, this.data.feedback);
        }
    },
    back() {
        wx.navigateBack();
    }
});
