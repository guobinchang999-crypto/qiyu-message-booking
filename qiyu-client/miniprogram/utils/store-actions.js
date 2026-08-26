"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callStore = exports.navigateToStore = void 0;
const navigateToStore = (store, feedback) => {
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
exports.navigateToStore = navigateToStore;
const callStore = (store, feedback) => {
    if (!store?.phone) {
        wx.showToast({ title: feedback.contactPlaceholder, icon: 'none' });
        return;
    }
    wx.makePhoneCall({
        phoneNumber: store.phone,
        fail: () => wx.showToast({ title: feedback.contactPlaceholder, icon: 'none' })
    });
};
exports.callStore = callStore;
