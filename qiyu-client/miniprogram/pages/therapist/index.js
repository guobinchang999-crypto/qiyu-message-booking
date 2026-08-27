"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const booking_service_1 = require("../../services/booking-service");
const navigation_1 = require("../../constants/navigation");
const booking_1 = require("../../store/booking");
const ui_1 = require("../../constants/ui");
const emptyDictionaries = { pageTitle: '', modes: [], autoHint: '', nextAvailablePrefix: '', specifyFeePrefix: '', availableText: '', unavailableText: '', metaCopy: { experiencePrefix: '', experienceSuffix: '', ratingUnit: '', serviceCountPrefix: '', serviceCountSuffix: '' } };
const emptyFeedback = {};
const emptyState = { ...ui_1.defaultPageStateCopy, unavailableFilterText: '', availableOnlyFilterText: '', emptySummaryText: '', selectedSummaryTitle: '', autoSummaryTitle: '', nextButtonText: '' };
Page({
    data: { therapists: [], visibleTherapists: [], dictionaries: emptyDictionaries, feedback: emptyFeedback, stateCopy: emptyState, mode: 'specified', selectedId: '', showUnavailable: true, selectedSummary: '', placeholderLabel: ui_1.imagePlaceholderLabels.therapist, loading: true, error: '' },
    async onLoad() { await this.loadTherapists(); },
    async loadTherapists() {
        this.setData({ loading: true, error: '' });
        try {
            const draft = booking_1.bookingStore.get();
            const [therapists, dictionaries, feedback, pageStates] = await Promise.all([
                booking_service_1.bookingService.getTherapists(draft.serviceId),
                booking_service_1.bookingService.getTherapistDictionaries(),
                booking_service_1.bookingService.getActionFeedbackDictionaries(),
                booking_service_1.bookingService.getPageStateDictionaries()
            ]);
            const stateCopy = pageStates.therapist;
            const therapistViews = therapists.map((therapist) => ({
                ...therapist,
                metaText: `${dictionaries.metaCopy.experiencePrefix}${therapist.experienceYears}${dictionaries.metaCopy.experienceSuffix} · ${therapist.rating}${dictionaries.metaCopy.ratingUnit} · ${dictionaries.metaCopy.serviceCountPrefix}${therapist.serviceCount}${dictionaries.metaCopy.serviceCountSuffix}`,
                skillText: therapist.skills.slice(0, 2).join(' · '),
                nextText: `${dictionaries.nextAvailablePrefix} ${therapist.nextAvailableAt}${therapist.specifyFee ? ` · ${dictionaries.specifyFeePrefix} ¥${therapist.specifyFee}` : ''}`,
                availabilityText: therapist.availability === 'available' ? dictionaries.availableText : dictionaries.unavailableText
            }));
            const mode = draft.therapistMode;
            const draftTherapist = therapistViews.find((therapist) => therapist.id === draft.therapistId && therapist.availability === 'available');
            const selectedId = draftTherapist?.id || therapistViews.find((therapist) => therapist.availability === 'available')?.id || '';
            this.setData({
                therapists: therapistViews,
                visibleTherapists: this.filterVisible(therapistViews, this.data.showUnavailable),
                dictionaries,
                feedback,
                stateCopy,
                mode,
                selectedId,
                selectedSummary: mode === 'auto' ? dictionaries.autoHint : this.buildSummary(selectedId, therapistViews, stateCopy),
                loading: false
            });
        }
        catch (error) {
            this.setData({ loading: false, error: (0, ui_1.resolvePageError)(error, this.data.stateCopy.errorMessage) });
        }
    },
    filterVisible(therapists, showUnavailable) {
        return showUnavailable ? therapists : therapists.filter((therapist) => therapist.availability === 'available');
    },
    buildSummary(selectedId, therapists, stateCopy) {
        const copy = stateCopy || this.data.stateCopy;
        const therapist = therapists.find((item) => item.id === selectedId);
        if (!therapist)
            return copy.emptySummaryText;
        return `${therapist.name} · ${therapist.nextText}`;
    },
    chooseMode(event) {
        const mode = event.currentTarget.dataset.mode;
        this.setData({ mode, selectedSummary: mode === 'auto' ? this.data.dictionaries.autoHint : this.buildSummary(this.data.selectedId, this.data.therapists) });
    },
    toggleUnavailable() {
        const showUnavailable = !this.data.showUnavailable;
        const visibleTherapists = this.filterVisible(this.data.therapists, showUnavailable);
        const selectedVisible = visibleTherapists.some((therapist) => therapist.id === this.data.selectedId);
        const selectedId = selectedVisible ? this.data.selectedId : visibleTherapists.find((therapist) => therapist.availability === 'available')?.id || '';
        this.setData({ showUnavailable, visibleTherapists, selectedId, selectedSummary: this.buildSummary(selectedId, this.data.therapists) });
    },
    selectTherapist(event) {
        const id = String(event.currentTarget.dataset.id || '');
        const therapist = this.data.therapists.find((item) => item.id === id);
        if (!therapist || therapist.availability !== 'available') {
            wx.showToast({ title: this.data.feedback.therapistUnavailable, icon: 'none' });
            return;
        }
        this.setData({ selectedId: id, mode: 'specified', selectedSummary: this.buildSummary(id, this.data.therapists) });
    },
    next() {
        if (this.data.mode === 'specified' && !this.data.selectedId)
            return;
        booking_1.bookingStore.update({ therapistMode: this.data.mode, therapistId: this.data.mode === 'auto' ? undefined : this.data.selectedId });
        wx.navigateTo({ url: navigation_1.pageRoutes.time });
    }
});
