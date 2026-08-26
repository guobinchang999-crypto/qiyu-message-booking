"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingStore = void 0;
const defaultDraft = { storeId: 'jingan', serviceId: 'neck', therapistMode: 'specified', therapistId: 'zhang', slotId: '1400', guestCount: 1, contact: '林知夏', remark: '希望安静一些', benefitSelection: '新人体验券 ¥20' };
let currentDraft = { ...defaultDraft };
const listeners = [];
const notify = () => listeners.forEach((listener) => listener({ ...currentDraft }));
exports.bookingStore = {
    get: () => ({ ...currentDraft }),
    update: (patch) => {
        currentDraft = { ...currentDraft, ...patch };
        notify();
    },
    selectStore: (storeId) => {
        if (!storeId || storeId === currentDraft.storeId)
            return;
        currentDraft = { ...currentDraft, storeId, therapistMode: 'auto', therapistId: undefined, slotId: undefined };
        notify();
    },
    selectService: (serviceId) => {
        if (!serviceId || serviceId === currentDraft.serviceId)
            return;
        currentDraft = { ...currentDraft, serviceId, therapistMode: 'auto', therapistId: undefined, slotId: undefined };
        notify();
    },
    reset: () => {
        currentDraft = { ...defaultDraft };
        notify();
    },
    subscribe: (listener) => {
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index >= 0)
                listeners.splice(index, 1);
        };
    }
};
