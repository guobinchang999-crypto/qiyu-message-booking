import { BookingDraft } from '../types/domain';
const defaultDraft: BookingDraft = { storeId:'jingan', serviceId:'neck', therapistMode:'specified', therapistId:'zhang', slotId:'1400', guestCount:1, contact:'林知夏', remark:'希望安静一些', benefitSelection:'新人体验券 ¥20' };
let currentDraft: BookingDraft = { ...defaultDraft };
const listeners: Array<(draft: BookingDraft) => void> = [];
const notify = () => listeners.forEach((listener) => listener({ ...currentDraft }));
export const bookingStore = {
  get: () => ({ ...currentDraft }),
  update: (patch: Partial<BookingDraft>) => {
    currentDraft = { ...currentDraft, ...patch };
    notify();
  },
  selectStore: (storeId: string) => {
    if (!storeId || storeId === currentDraft.storeId) return;
    currentDraft = { ...currentDraft, storeId, therapistMode:'auto', therapistId:undefined, slotId:undefined };
    notify();
  },
  selectService: (serviceId: string) => {
    if (!serviceId || serviceId === currentDraft.serviceId) return;
    currentDraft = { ...currentDraft, serviceId, therapistMode:'auto', therapistId:undefined, slotId:undefined };
    notify();
  },
  reset: () => {
    currentDraft = { ...defaultDraft };
    notify();
  },
  subscribe: (listener: (draft: BookingDraft) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  }
};
