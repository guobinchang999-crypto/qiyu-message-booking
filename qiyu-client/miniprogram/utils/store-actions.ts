import { ActionFeedbackDictionaryPayload } from '../services/contracts';
import { Store } from '../types/domain';

export const navigateToStore = (store: Store | null, feedback: ActionFeedbackDictionaryPayload) => {
  if (!store || !store.latitude || !store.longitude) {
    wx.showToast({ title: feedback.navigationUnavailable, icon: 'none' });
    return;
  }
  wx.openLocation({
    latitude: store.latitude,
    longitude: store.longitude,
    name: store.name,
    address: store.address,
    fail: () => wx.showToast({ title: feedback.navigationUnavailable, icon: 'none' })
  });
};

export const callStore = (store: Store | null, feedback: ActionFeedbackDictionaryPayload) => {
  if (!store?.phone) {
    wx.showToast({ title: feedback.contactPlaceholder, icon: 'none' });
    return;
  }
  wx.makePhoneCall({
    phoneNumber: store.phone,
    fail: () => wx.showToast({ title: feedback.contactPlaceholder, icon: 'none' })
  });
};
