import { BookingDraft } from '../types/domain';
const toDateText = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const defaultAppointmentDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateText(date);
};
const createDefaultDraft = (): BookingDraft => ({
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
const defaultDraft: BookingDraft = createDefaultDraft();
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
    currentDraft = createDefaultDraft();
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
