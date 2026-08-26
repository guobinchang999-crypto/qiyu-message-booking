"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const MAX_TAG_COUNT = 3;
const MIN_CONTENT_LENGTH = 5;
const MAX_IMAGE_COUNT = 3;
const emptyState = { loadingTitle: '', loadingDescription: '', errorTitle: '', errorMessage: '', retryText: '', submitErrorTitle: '', submitErrorMessage: '' };
const emptyDictionaries = { tags: [], pageTitle: '', ratingFields: { therapist: '', environment: '', service: '' }, contentPlaceholder: '', imageSectionTitle: '', imageHintText: '', addImageText: '', uploadingImageText: '', uploadFailedText: '', retryUploadText: '', anonymousText: '', agreementText: '', submitButtonText: '', submittedButtonText: '', submittingToastText: '', submittedToastText: '', maxTagValidationText: '', maxTagToastText: '', agreementRequiredMessage: '', contentMinLengthMessage: '' };
Page({
    data: {
        booking: null,
        stateCopy: emptyState,
        dictionaries: emptyDictionaries,
        loading: true,
        error: '',
        therapistRating: 5,
        environmentRating: 5,
        serviceRating: 5,
        tags: [],
        selectedTags: [],
        content: '',
        images: [],
        anonymous: true,
        agreed: true,
        submitting: false,
        submitted: false,
        validationError: ''
    },
    async onLoad(query) {
        await this.loadReviewData(query.id || 'booking-1000');
    },
    async loadReviewData(id) {
        this.setData({ loading: true, error: '' });
        try {
            const [booking, dictionaries, pageStates] = await Promise.all([
                booking_service_1.bookingService.getBooking(id || this.data.booking?.id || 'booking-1000'),
                booking_service_1.bookingService.getReviewDictionaries(),
                booking_service_1.bookingService.getPageStateDictionaries()
            ]);
            this.setData({ booking, tags: dictionaries.tags, dictionaries, stateCopy: pageStates.review, loading: false });
        }
        catch (error) {
            this.setData({ loading: false, error: this.data.stateCopy.errorMessage });
        }
    },
    setRating(event) {
        if (this.data.submitting || this.data.submitted)
            return;
        const key = String(event.currentTarget.dataset.key);
        this.setData({ [key]: Number(event.detail.value || 5), validationError: '' });
    },
    toggleTag(event) {
        if (this.data.submitting || this.data.submitted)
            return;
        const tag = String(event.currentTarget.dataset.tag);
        if (this.data.selectedTags.includes(tag)) {
            this.setData({ selectedTags: this.data.selectedTags.filter((item) => item !== tag), validationError: '' });
            return;
        }
        if (this.data.selectedTags.length >= MAX_TAG_COUNT) {
            this.setData({ validationError: this.data.dictionaries.maxTagValidationText });
            wx.showToast({ title: this.data.dictionaries.maxTagToastText, icon: 'none' });
            return;
        }
        this.setData({ selectedTags: [...this.data.selectedTags, tag], validationError: '' });
    },
    onContent(event) {
        this.setData({ content: String(event.detail.value || '').slice(0, 300), validationError: '' });
    },
    chooseImages() {
        if (this.data.submitting || this.data.submitted)
            return;
        const count = MAX_IMAGE_COUNT - this.data.images.length;
        if (count <= 0)
            return;
        wx.chooseMedia({
            count,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (result) => {
                const selectedImages = result.tempFiles.map((file, index) => ({
                    id: `review-image-${Date.now()}-${index}`,
                    tempFilePath: file.tempFilePath,
                    uploadUrl: '',
                    status: 'uploading'
                }));
                this.setData({ images: [...this.data.images, ...selectedImages] });
                selectedImages.forEach((image) => this.uploadImage(image.id, image.tempFilePath));
            }
        });
    },
    previewImage(event) {
        const current = String(event.currentTarget.dataset.src || '');
        const urls = this.data.images.map((image) => image.tempFilePath);
        if (!current || urls.length === 0)
            return;
        wx.previewImage({ current, urls });
    },
    removeImage(event) {
        if (this.data.submitting || this.data.submitted)
            return;
        const id = String(event.currentTarget.dataset.id || '');
        this.setData({ images: this.data.images.filter((image) => image.id !== id) });
    },
    retryImageUpload(event) {
        if (this.data.submitting || this.data.submitted)
            return;
        const id = String(event.currentTarget.dataset.id || '');
        const image = this.data.images.find((item) => item.id === id);
        if (!image)
            return;
        this.updateImage(id, { status: 'uploading', uploadUrl: '' });
        this.uploadImage(id, image.tempFilePath);
    },
    async uploadImage(id, tempFilePath) {
        try {
            const payload = await booking_service_1.bookingService.uploadReviewImage(tempFilePath, `review-image-${Date.now()}`);
            const stillExists = this.data.images.some((image) => image.id === id);
            if (!stillExists)
                return;
            this.updateImage(id, { status: 'success', uploadUrl: payload.imageUrl });
        }
        catch (error) {
            const stillExists = this.data.images.some((image) => image.id === id);
            if (!stillExists)
                return;
            this.updateImage(id, { status: 'failed', uploadUrl: '' });
        }
    },
    updateImage(id, patch) {
        this.setData({ images: this.data.images.map((image) => image.id === id ? { ...image, ...patch } : image) });
    },
    toggleAnonymous() {
        if (this.data.submitting || this.data.submitted)
            return;
        this.setData({ anonymous: !this.data.anonymous });
    },
    toggleAgreed() {
        if (this.data.submitting || this.data.submitted)
            return;
        this.setData({ agreed: !this.data.agreed, validationError: '' });
    },
    async submit() {
        if (this.data.submitted)
            return;
        if (this.data.submitting || !this.data.booking) {
            wx.showToast({ title: this.data.dictionaries.submittingToastText, icon: 'none' });
            return;
        }
        const validationError = this.validateReview();
        if (validationError) {
            this.setData({ validationError });
            wx.showToast({ title: validationError, icon: 'none' });
            return;
        }
        if (this.hasUploadingImages()) {
            this.setData({ validationError: this.data.dictionaries.uploadingImageText });
            wx.showToast({ title: this.data.dictionaries.uploadingImageText, icon: 'none' });
            return;
        }
        this.setData({ submitting: true, error: '', validationError: '' });
        try {
            await booking_service_1.bookingService.submitReview({
                bookingId: this.data.booking.id,
                therapistRating: this.data.therapistRating,
                environmentRating: this.data.environmentRating,
                serviceRating: this.data.serviceRating,
                tags: this.data.selectedTags,
                content: this.data.content,
                anonymous: this.data.anonymous,
                imageUrls: this.data.images.filter((image) => image.status === 'success').map((image) => image.uploadUrl)
            }, `review-${Date.now()}`);
            this.setData({ submitting: false, submitted: true });
            wx.showToast({ title: this.data.dictionaries.submittedToastText, icon: 'success' });
            setTimeout(() => wx.switchTab({ url: navigation_1.pageRoutes.orders }), 500);
        }
        catch (error) {
            this.setData({ submitting: false, error: this.data.stateCopy.submitErrorMessage });
            wx.showToast({ title: this.data.stateCopy.submitErrorMessage, icon: 'none' });
        }
    },
    validateReview() {
        if (!this.data.agreed)
            return this.data.dictionaries.agreementRequiredMessage;
        if (this.data.content.trim().length < MIN_CONTENT_LENGTH)
            return this.data.dictionaries.contentMinLengthMessage;
        return '';
    },
    hasUploadingImages() {
        return this.data.images.some((image) => image.status === 'uploading');
    }
});
