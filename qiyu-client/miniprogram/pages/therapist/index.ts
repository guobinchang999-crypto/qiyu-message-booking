import { bookingService } from '../../services/booking-service';
import { pageRoutes } from '../../constants/navigation';
import { ActionFeedbackDictionaryPayload, TherapistDictionaryPayload, TherapistStateCopy } from '../../services/contracts';
import { bookingStore } from '../../store/booking';
import { Therapist } from '../../types/domain';
import { defaultPageStateCopy, imagePlaceholderLabels, resolvePageError } from '../../constants/ui';

type TherapistView = Therapist & { metaText:string; skillText:string; nextText:string; availabilityText:string };
const emptyDictionaries: TherapistDictionaryPayload = { pageTitle:'', modes:[], autoHint:'', nextAvailablePrefix:'', specifyFeePrefix:'', availableText:'', unavailableText:'', metaCopy:{ experiencePrefix:'', experienceSuffix:'', ratingUnit:'', serviceCountPrefix:'', serviceCountSuffix:'' } };
const emptyFeedback = {} as ActionFeedbackDictionaryPayload;
const emptyState: TherapistStateCopy = { ...defaultPageStateCopy, unavailableFilterText:'', availableOnlyFilterText:'', emptySummaryText:'', selectedSummaryTitle:'', autoSummaryTitle:'', nextButtonText:'' };

Page({
  data:{ therapists:[] as TherapistView[], visibleTherapists:[] as TherapistView[], dictionaries:emptyDictionaries, feedback:emptyFeedback, stateCopy:emptyState, mode:'specified', selectedId:'', showUnavailable:true, selectedSummary:'', placeholderLabel:imagePlaceholderLabels.therapist, loading:true, error:'' },
  async onLoad(){ await this.loadTherapists(); },
  async loadTherapists(){
    this.setData({ loading:true, error:'' });
    try {
      const draft = bookingStore.get();
      const [therapists, dictionaries, feedback, pageStates] = await Promise.all([
        bookingService.getTherapists(draft.serviceId),
        bookingService.getTherapistDictionaries(),
        bookingService.getActionFeedbackDictionaries(),
        bookingService.getPageStateDictionaries()
      ]);
      const stateCopy = pageStates.therapist;
      const therapistViews = therapists.map((therapist) => ({
        ...therapist,
        metaText:`${dictionaries.metaCopy.experiencePrefix}${therapist.experienceYears}${dictionaries.metaCopy.experienceSuffix} · ${therapist.rating}${dictionaries.metaCopy.ratingUnit} · ${dictionaries.metaCopy.serviceCountPrefix}${therapist.serviceCount}${dictionaries.metaCopy.serviceCountSuffix}`,
        skillText:therapist.skills.slice(0, 2).join(' · '),
        nextText:`${dictionaries.nextAvailablePrefix} ${therapist.nextAvailableAt}${therapist.specifyFee ? ` · ${dictionaries.specifyFeePrefix} ¥${therapist.specifyFee}` : ''}`,
        availabilityText:therapist.availability === 'available' ? dictionaries.availableText : dictionaries.unavailableText
      }));
      const mode = draft.therapistMode;
      const draftTherapist = therapistViews.find((therapist) => therapist.id === draft.therapistId && therapist.availability === 'available');
      const selectedId = draftTherapist?.id || therapistViews.find((therapist) => therapist.availability === 'available')?.id || '';
      this.setData({
        therapists:therapistViews,
        visibleTherapists:this.filterVisible(therapistViews, this.data.showUnavailable),
        dictionaries,
        feedback,
        stateCopy,
        mode,
        selectedId,
        selectedSummary:mode === 'auto' ? dictionaries.autoHint : this.buildSummary(selectedId, therapistViews, stateCopy),
        loading:false
      });
    } catch (error) {
      this.setData({ loading:false, error:resolvePageError(error, this.data.stateCopy.errorMessage) });
    }
  },
  filterVisible(therapists: TherapistView[], showUnavailable: boolean) {
    return showUnavailable ? therapists : therapists.filter((therapist) => therapist.availability === 'available');
  },
  buildSummary(selectedId: string, therapists: TherapistView[], stateCopy?: TherapistStateCopy) {
    const copy = stateCopy || this.data.stateCopy;
    const therapist = therapists.find((item) => item.id === selectedId);
    if (!therapist) return copy.emptySummaryText;
    return `${therapist.name} · ${therapist.nextText}`;
  },
  chooseMode(event:WechatMiniprogram.TouchEvent){
    const mode = event.currentTarget.dataset.mode as 'specified' | 'auto';
    this.setData({ mode, selectedSummary: mode === 'auto' ? this.data.dictionaries.autoHint : this.buildSummary(this.data.selectedId, this.data.therapists) });
  },
  toggleUnavailable(){
    const showUnavailable = !this.data.showUnavailable;
    const visibleTherapists = this.filterVisible(this.data.therapists, showUnavailable);
    const selectedVisible = visibleTherapists.some((therapist) => therapist.id === this.data.selectedId);
    const selectedId = selectedVisible ? this.data.selectedId : visibleTherapists.find((therapist) => therapist.availability === 'available')?.id || '';
    this.setData({ showUnavailable, visibleTherapists, selectedId, selectedSummary:this.buildSummary(selectedId, this.data.therapists) });
  },
  selectTherapist(event:WechatMiniprogram.TouchEvent){
    const id = String(event.currentTarget.dataset.id || '');
    const therapist = this.data.therapists.find((item) => item.id === id);
    if (!therapist || therapist.availability !== 'available') {
      wx.showToast({ title:this.data.feedback.therapistUnavailable, icon:'none' });
      return;
    }
    this.setData({ selectedId:id, mode:'specified', selectedSummary:this.buildSummary(id, this.data.therapists) });
  },
  next(){
    if (this.data.mode === 'specified' && !this.data.selectedId) return;
    bookingStore.update({ therapistMode:this.data.mode as 'auto'|'specified', therapistId:this.data.mode === 'auto' ? undefined : this.data.selectedId });
    wx.navigateTo({ url:pageRoutes.time });
  }
});
