"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const ui_1 = require("../../constants/ui");
const emptyFeedback = {};
const reviewPageSize = 2;
const emptyDictionaries = {
    pageTitle: '',
    categories: [],
    allCategory: '',
    storeSwitchLabel: '',
    searchPlaceholder: '',
    clearSearchText: '',
    sortOptions: [],
    cardMeta: { durationUnit: '', servedPrefix: '', servedSuffix: '' },
    storeCardMeta: { ratingUnit: '', nextAvailablePrefix: '' },
    bannerText: '',
    detailTitle: '',
    loadingTitle: '',
    loadingDescription: '',
    errorTitle: '',
    errorMessage: '',
    retryText: '',
    loadMoreText: '',
    favoriteText: '',
    favoritedText: '',
    shareText: '',
    memberPriceLabel: '',
    introTitle: '',
    processTitle: '',
    suitableTitle: '',
    noticeTitle: '',
    noticeText: '',
    recommendedTherapistTitle: '',
    nextAvailablePrefix: '',
    reviewTitle: '',
    reviewSummarySuffix: '',
    primaryButtonText: '',
    favoriteAddedToast: '',
    favoriteRemovedToast: ''
};
Page({
    data: {
        service: null,
        store: null,
        therapists: [],
        reviews: [],
        reviewPage: 1,
        reviewHasMore: false,
        reviewLoadingMore: false,
        serviceId: 'neck',
        serviceMetaText: '',
        feedback: emptyFeedback,
        dictionaries: emptyDictionaries,
        favorite: false,
        placeholderLabel: ui_1.imagePlaceholderLabels.brand,
        loading: true,
        error: ''
    },
    async onLoad(query) {
        const serviceId = query.id || 'neck';
        booking_1.bookingStore.selectService(serviceId);
        this.setData({ serviceId });
        await this.loadService();
    },
    async loadService() {
        this.setData({ loading: true, error: '' });
        try {
            const [feedback, dictionaries] = await Promise.all([
                booking_service_1.bookingService.getActionFeedbackDictionaries(),
                booking_service_1.bookingService.getServiceDictionaries()
            ]);
            this.setData({ feedback, dictionaries });
            const draft = booking_1.bookingStore.get();
            const [service, store, therapists, reviewPage] = await Promise.all([
                booking_service_1.bookingService.getService(this.data.serviceId),
                booking_service_1.bookingService.getStore(draft.storeId),
                booking_service_1.bookingService.getTherapists(this.data.serviceId),
                booking_service_1.bookingService.getStoreReviews(draft.storeId, this.data.serviceId, 1, reviewPageSize)
            ]);
            const metaItems = [`${service.durationMinutes}${dictionaries.cardMeta.durationUnit}`, service.tags[0], `${dictionaries.cardMeta.servedPrefix}${service.salesCount}${dictionaries.cardMeta.servedSuffix}`].filter(Boolean);
            this.setData({
                service,
                store,
                therapists: therapists.slice(0, 2),
                reviews: reviewPage.items,
                reviewPage: reviewPage.page,
                reviewHasMore: reviewPage.hasMore,
                serviceMetaText: metaItems.join(' · '),
                loading: false
            });
        }
        catch (error) {
            this.setData({ loading: false, error: this.data.dictionaries.errorMessage });
        }
    },
    goTherapist() {
        if (!this.data.service || this.data.loading)
            return;
        wx.navigateTo({ url: navigation_1.pageRoutes.therapist });
    },
    toggleFavorite() {
        if (!this.data.service)
            return;
        const favorite = !this.data.favorite;
        this.setData({ favorite });
        wx.showToast({ title: favorite ? this.data.dictionaries.favoriteAddedToast : this.data.dictionaries.favoriteRemovedToast, icon: 'none' });
    },
    onShareAppMessage() {
        const service = this.data.service;
        return {
            title: service ? service.name : this.data.dictionaries.detailTitle,
            path: navigation_1.pageUrls.serviceDetail(this.data.serviceId)
        };
    },
    async loadMoreReviews() {
        if (this.data.reviewLoadingMore || !this.data.reviewHasMore)
            return;
        const storeId = this.data.store?.id || booking_1.bookingStore.get().storeId;
        this.setData({ reviewLoadingMore: true });
        try {
            const reviewPage = await booking_service_1.bookingService.getStoreReviews(storeId, this.data.serviceId, this.data.reviewPage + 1, reviewPageSize);
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
    back() {
        wx.navigateBack();
    }
});
