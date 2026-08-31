"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingStore = void 0;
const toDateText = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const defaultAppointmentDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return toDateText(date);
};
const createDefaultDraft = () => ({
    storeId: '',
    serviceId: '',
    appointmentDate: defaultAppointmentDate(),
    therapistMode: 'auto',
    therapistId: undefined,
    slotId: undefined,
    guestCount: 1,
    contact: '',
    remark: '',
    benefitSelection: '',
});
const defaultDraft = createDefaultDraft();
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
        currentDraft = createDefaultDraft();
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
