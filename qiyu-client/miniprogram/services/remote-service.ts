import {
  Booking,
  BookingDraft,
  BookingStatus,
  OrderAction,
  PaymentSummary,
  ReviewSubmitRequest,
  ServiceItem,
  Store,
  StoreReview,
  StoreBusinessStatusCode,
  Therapist,
  TimePeriodCode,
  TimeSlot,
  TimeSlotStatus
} from '../types/domain';
import {
  ActionFeedbackDictionaryPayload,
  BookingConfirmationPayload,
  BookingRebookPayload,
  BookingReschedulePayload,
  BookingService,
  BookingSuccessPayload,
  BookingPaymentPayload,
  CheckinDictionaryPayload,
  HomePayload,
  LoginCopyPayload,
  LoginCodePayload,
  LoginPayload,
  OrderDictionaryPayload,
  PageResult,
  PageStateDictionaryPayload,
  ProfilePayload,
  ReviewImageUploadPayload,
  ReviewDictionaryPayload,
  ServiceDictionaryPayload,
  StoreDetailDictionaryPayload,
  SuccessCopy,
  TherapistDictionaryPayload,
  TimeDictionaryPayload
} from './contracts';
import { request, upload } from './http';
import { AUTH_SESSION_STORAGE_KEY } from './config';

type RemoteRecord = Record<string, unknown>;
type ClientCatalog = {
  homeCopy?: unknown;
  loginCopy?: unknown;
  orderDictionaries?: unknown;
  reviewDictionaries?: unknown;
  serviceDictionaries?: unknown;
  storeDetailDictionaries?: unknown;
  timeDictionaries?: unknown;
  therapistDictionaries?: unknown;
  successCopy?: unknown;
  profile?: unknown;
  checkinDictionaries?: unknown;
  actionFeedbackDictionaries?: unknown;
  pageStateDictionaries?: unknown;
};

let clientCatalogCache: ClientCatalog | null = null;

/** Identifies backend payload violations without replacing them with stale local fixtures. */
class RemoteContractError extends Error {
  constructor(message: string) {
    super(`后端响应不完整：${message}`);
    this.name = 'RemoteContractError';
  }
}

const asRecord = (value: unknown): RemoteRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as RemoteRecord : {};
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const requireRecord = (value: unknown, path: string): RemoteRecord => {
  const record = asRecord(value);
  if (!Object.keys(record).length) throw new RemoteContractError(`${path} 必须是对象`);
  return record;
};
const asString = (record: RemoteRecord, key: string): string => {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) throw new RemoteContractError(`${key} 必须是非空字符串`);
  return value;
};
const asOptionalString = (record: RemoteRecord, key: string): string | undefined => {
  const value = record[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new RemoteContractError(`${key} 必须是字符串`);
  return value;
};
const asNumber = (record: RemoteRecord, key: string): number => {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new RemoteContractError(`${key} 必须是有效数字`);
  return value;
};
const asBoolean = (record: RemoteRecord, key: string): boolean => {
  const value = record[key];
  if (typeof value !== 'boolean') throw new RemoteContractError(`${key} 必须是布尔值`);
  return value;
};
const asOptionalBoolean = (record: RemoteRecord, key: string): boolean | undefined => {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') throw new RemoteContractError(`${key} 必须是布尔值`);
  return value;
};
const asStringArray = (record: RemoteRecord, key: string): string[] => {
  const value = record[key];
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new RemoteContractError(`${key} 必须是字符串数组`);
  }
  return value;
};
const asPaymentSignType = (value: string): 'RSA' | 'MD5' | 'HMAC-SHA256' => {
  if (value === 'RSA' || value === 'MD5' || value === 'HMAC-SHA256') return value;
  throw new RemoteContractError('payment.parameters.signType 不受支持');
};

const getClientCatalog = async (): Promise<ClientCatalog> => {
  if (clientCatalogCache) return clientCatalogCache;
  clientCatalogCache = await request<ClientCatalog>('/catalog/client');
  return clientCatalogCache;
};

const requireId = (id: string | undefined, field: string): string => {
  if (!id || !id.trim()) throw new Error(`缺少${field}，请返回上一步重新选择`);
  return id;
};

const distanceToKm = (distance: string): number => {
  const value = Number.parseFloat(distance.replace('km', ''));
  return Number.isFinite(value) ? value : 0;
};

const timePeriod = (time: string): TimePeriodCode => {
  const hour = Number.parseInt(time.split(':')[0] || '0', 10);
  if (hour < 12) return 'MORNING';
  if (hour < 18) return 'AFTERNOON';
  return 'EVENING';
};

const normalizeSlotStatus = (status: string): TimeSlotStatus => {
  if (status === 'FULL') return 'full';
  if (status === 'ALMOST_FULL') return 'limited';
  if (status === 'AVAILABLE') return 'available';
  throw new RemoteContractError('timeSlot.status 不受支持');
};

const normalizeAvailability = (status: string): Therapist['availability'] => {
  if (status === 'AVAILABLE') return 'available';
  if (status === 'BUSY' || status === 'OFF_DUTY' || status === 'DISABLED') return 'busy';
  throw new RemoteContractError('therapist.status 不受支持');
};

const normalizeBookingStatus = (status: string): BookingStatus => {
  const allowed: BookingStatus[] = ['PENDING_PAYMENT', 'BOOKED', 'CHECKED_IN', 'WAITING_SERVICE', 'IN_SERVICE', 'PENDING_SETTLEMENT', 'COMPLETED', 'CANCELLED'];
  if (allowed.includes(status as BookingStatus)) return status as BookingStatus;
  throw new RemoteContractError('booking.status 不受支持');
};

const normalizeStoreBusinessStatus = (status: string): StoreBusinessStatusCode => {
  if (status === 'OPEN' || status === 'CLOSED') return status;
  throw new RemoteContractError('store.businessStatusCode 不受支持');
};

const buildGalleryImages = (record: RemoteRecord): string[] => {
  const imageUrls = asStringArray(record, 'galleryImageUrls');
  if (imageUrls.length) return imageUrls;
  const singleImageUrl = asOptionalString(record, 'galleryImageUrl') || asOptionalString(record, 'coverImageUrl');
  if (!singleImageUrl) throw new RemoteContractError('store.galleryImageUrls 或 coverImageUrl 必须存在');
  return [singleImageUrl];
};

const formatScheduledAt = (date: string, startTime: string): string => `${date} ${startTime}`;

const mapStore = (value: unknown): Store => {
  const record = requireRecord(value, 'store');
  const rawName = asString(record, 'name');
  const highlights = asStringArray(record, 'highlights');
  return {
    id: asString(record, 'id'),
    name: rawName.startsWith('栖愈') ? rawName : `栖愈·${rawName}`,
    distanceKm: distanceToKm(asString(record, 'distance')),
    rating: asNumber(record, 'rating'),
    address: asString(record, 'address'),
    phone: asString(record, 'phone'),
    latitude: asNumber(record, 'latitude'),
    longitude: asNumber(record, 'longitude'),
    businessStatusCode: normalizeStoreBusinessStatus(asString(record, 'businessStatusCode')),
    businessStatus: asString(record, 'businessStatusLabel'),
    nextAvailableAt: asString(record, 'nextAvailableAt'),
    isFrequent: asBoolean(record, 'frequent'),
    facilities: asStringArray(record, 'facilities'),
    highlights,
    memberBenefitText: asString(record, 'memberBenefitText'),
    coverImageUrl: asOptionalString(record, 'coverImageUrl'),
    galleryImageUrl: asOptionalString(record, 'galleryImageUrl'),
    galleryImageUrls: buildGalleryImages(record)
  };
};

const mapService = (value: unknown): ServiceItem => {
  const record = requireRecord(value, 'service');
  return {
    id: asString(record, 'id'),
    name: asString(record, 'name'),
    category: asString(record, 'category'),
    durationMinutes: asNumber(record, 'durationMinutes'),
    price: asNumber(record, 'price'),
    memberPrice: asNumber(record, 'memberPrice'),
    salesCount: asNumber(record, 'salesCount'),
    tags: asStringArray(record, 'tags'),
    description: asString(record, 'description'),
    processSteps: asStringArray(record, 'processSteps'),
    suitableFor: asString(record, 'suitableFor'),
    coverImageUrl: asOptionalString(record, 'coverImageUrl'),
    bannerImageUrl: asOptionalString(record, 'bannerImageUrl')
  };
};

const mapTherapist = (value: unknown): Therapist => {
  const record = requireRecord(value, 'therapist');
  return {
    id: asString(record, 'id'),
    name: asString(record, 'name'),
    level: asString(record, 'level'),
    experienceYears: asNumber(record, 'experienceYears'),
    skills: asStringArray(record, 'skills'),
    rating: asNumber(record, 'rating'),
    serviceCount: asNumber(record, 'serviceCount'),
    specifyFee: asNumber(record, 'extraFee'),
    nextAvailableAt: asString(record, 'nextAvailable'),
    availability: normalizeAvailability(asString(record, 'status')),
    avatarUrl: asOptionalString(record, 'avatarUrl')
  };
};

const mapStoreReview = (value: unknown): StoreReview => {
  const record = requireRecord(value, 'review');
  return {
    id: asString(record, 'id'),
    storeId: asString(record, 'storeId'),
    serviceId: asString(record, 'serviceId'),
    userName: asString(record, 'userName'),
    rating: asNumber(record, 'rating'),
    content: asString(record, 'content'),
    tags: asStringArray(record, 'tags'),
    createdAt: asString(record, 'createdAt')
  };
};

const mapReviewPage = (value: unknown, page: number, pageSize: number): PageResult<StoreReview> => {
  if (Array.isArray(value)) {
    const items = value.map(mapStoreReview);
    return { items, page, pageSize, total: items.length, hasMore: false };
  }
  const record = requireRecord(value, 'reviewPage');
  const items = asArray(record.items).map(mapStoreReview);
  if (!Array.isArray(record.items)) throw new RemoteContractError('reviewPage.items 必须是数组');
  return {
    items, page: asNumber(record, 'page'), pageSize: asNumber(record, 'pageSize'),
    total: asNumber(record, 'total'), hasMore: asBoolean(record, 'hasMore')
  };
};

const mapPaymentPayload = (value: unknown): BookingPaymentPayload => {
  const record = requireRecord(value, 'payment');
  const parameters = requireRecord(record.parameters, 'payment.parameters');
  return {
    bookingId: asString(record, 'bookingId'),
    amount: asNumber(record, 'amount'),
    paymentNo: asString(record, 'paymentNo'),
    parameters: {
      timeStamp: asString(parameters, 'timeStamp'),
      nonceStr: asString(parameters, 'nonceStr'),
      package: asString(parameters, 'package'),
      signType: asPaymentSignType(asString(parameters, 'signType')),
      paySign: asString(parameters, 'paySign'),
      mockPayment: asOptionalBoolean(parameters, 'mockPayment')
    }
  };
};

const mapTimeSlot = (value: unknown): TimeSlot => {
  const record = requireRecord(value, 'timeSlot');
  const startAt = asString(record, 'time');
  return {
    id: startAt.replace(':', ''),
    startAt,
    period: timePeriod(startAt),
    status: normalizeSlotStatus(asString(record, 'status'))
  };
};

const mapPayment = (record: RemoteRecord): PaymentSummary => {
  const amount = asNumber(record, 'amount');
  return {
    itemAmount: amount,
    therapistFee: asNumber(record, 'therapistFee'),
    discountAmount: asNumber(record, 'discountAmount'),
    balanceDeduction: asNumber(record, 'balanceDeduction'),
    depositDue: asNumber(record, 'depositDue'),
    paidAmount: asNumber(record, 'paidAmount')
  };
};

const mapPaymentSummary = (value: unknown): PaymentSummary => {
  const record = requireRecord(value, 'confirmation.payment');
  return {
    itemAmount: asNumber(record, 'itemAmount'), therapistFee: asNumber(record, 'therapistFee'),
    discountAmount: asNumber(record, 'discountAmount'), balanceDeduction: asNumber(record, 'balanceDeduction'),
    depositDue: asNumber(record, 'depositDue'), paidAmount: asNumber(record, 'paidAmount')
  };
};

const mapPaymentLines = (value: unknown): BookingConfirmationPayload['paymentLines'] => {
  if (!Array.isArray(value)) throw new RemoteContractError('confirmation.paymentLines 必须是数组');
  return value.map((item) => {
    const record = requireRecord(item, 'confirmation.paymentLine');
    const tone = asOptionalString(record, 'tone');
    if (tone !== undefined && tone !== 'discount' && tone !== 'default') throw new RemoteContractError('confirmation.paymentLine.tone 不受支持');
    return {
      key: asString(record, 'key'),
      label: asString(record, 'label'),
      amountText: asString(record, 'amountText'),
      tone
    };
  });
};

const mapConfirmationEditActions = (value: unknown): BookingConfirmationPayload['editActions'] => {
  const record = requireRecord(value, 'confirmation.editActions');
  return {
    store: asString(record, 'store'), service: asString(record, 'service'),
    therapist: asString(record, 'therapist'), time: asString(record, 'time')
  };
};

const mapServiceCardMeta = (value: unknown): BookingConfirmationPayload['cardMeta'] => {
  const record = requireRecord(value, 'serviceCardMeta');
  return {
    durationUnit: asString(record, 'durationUnit'), servedPrefix: asString(record, 'servedPrefix'),
    servedSuffix: asString(record, 'servedSuffix')
  };
};

const mapConfirmationFormCopy = (value: unknown): BookingConfirmationPayload['formCopy'] => {
  const record = requireRecord(value, 'confirmation.formCopy');
  return {
    guestCountLabel: asString(record, 'guestCountLabel'), contactLabel: asString(record, 'contactLabel'),
    contactPlaceholder: asString(record, 'contactPlaceholder'), remarkLabel: asString(record, 'remarkLabel'),
    remarkPlaceholder: asString(record, 'remarkPlaceholder'), contactRequiredMessage: asString(record, 'contactRequiredMessage'),
    submitFallbackText: asString(record, 'submitFallbackText')
  };
};

const mapBookingConfirmation = (value: unknown): BookingConfirmationPayload => {
  const record = requireRecord(value, 'confirmation');
  return {
    pageTitle: asString(record, 'pageTitle'), editActions: mapConfirmationEditActions(record.editActions),
    cardMeta: mapServiceCardMeta(record.cardMeta),
    store: mapStore(record.store),
    service: mapService(record.service),
    therapist: record.therapist ? mapTherapist(record.therapist) : undefined,
    therapistDisplayName: asString(record, 'therapistDisplayName'), scheduledAt: asString(record, 'scheduledAt'),
    payment: mapPaymentSummary(record.payment), formCopy: mapConfirmationFormCopy(record.formCopy),
    benefitTitle: asString(record, 'benefitTitle'), benefitSelectionText: asString(record, 'benefitSelectionText'),
    paymentTitle: asString(record, 'paymentTitle'), paymentLines: mapPaymentLines(record.paymentLines),
    totalLabel: asString(record, 'totalLabel'), agreementText: asString(record, 'agreementText'),
    agreementRequiredMessage: asString(record, 'agreementRequiredMessage'), depositButtonText: asString(record, 'depositButtonText')
  };
};

const mapBooking = (value: unknown): Booking => {
  const record = requireRecord(value, 'booking');
  const status = normalizeBookingStatus(asString(record, 'status'));
  const availableActions = asStringArray(record, 'availableActions') as OrderAction[];
  return {
    id: asString(record, 'id'), code: asString(record, 'verificationCode'),
    qrImageUrl: asOptionalString(record, 'verificationQrImageUrl'),
    status,
    store: mapStore(record.store),
    service: mapService(record.service),
    therapist: mapTherapist(record.therapist),
    scheduledAt: formatScheduledAt(asString(record, 'appointmentDate'), asString(record, 'startTime')),
    contact: `${asString(record, 'customerName')} ${asString(record, 'mobile')}`.trim(),
    payment: mapPayment(record),
    availableActions
  };
};

const catalogPayload = async <T>(key: keyof ClientCatalog): Promise<T> => {
  const value = (await getClientCatalog())[key];
  requireRecord(value, `catalog.${key}`);
  return value as T;
};

const mapSuccessCopyValue = (value: unknown): SuccessCopy => {
  const record = requireRecord(value, 'success.copy');
  return {
    title: asString(record, 'title'), subtitle: asString(record, 'subtitle'),
    bookingCodePrefix: asString(record, 'bookingCodePrefix'), codeHint: asString(record, 'codeHint'),
    navigationActionText: asString(record, 'navigationActionText'), contactActionText: asString(record, 'contactActionText'),
    reminderText: asString(record, 'reminderText'), detailButtonText: asString(record, 'detailButtonText'),
    homeButtonText: asString(record, 'homeButtonText')
  };
};

const mapBookingSuccessPayload = (value: unknown): BookingSuccessPayload => {
  const record = requireRecord(value, 'bookingSuccess');
  return { booking: mapBooking(record.booking), copy: mapSuccessCopyValue(record.copy) };
};

const mapBookingDraft = (value: unknown): BookingDraft => {
  const record = requireRecord(value, 'bookingDraft');
  const therapistMode = asString(record, 'therapistMode');
  const flow = asString(record, 'flow');
  if (therapistMode !== 'specified' && therapistMode !== 'auto') throw new RemoteContractError('bookingDraft.therapistMode 不受支持');
  if (flow !== 'create' && flow !== 'reschedule') throw new RemoteContractError('bookingDraft.flow 不受支持');
  return {
    storeId: asString(record, 'storeId'), serviceId: asString(record, 'serviceId'), therapistMode,
    therapistId: asOptionalString(record, 'therapistId'), slotId: asOptionalString(record, 'slotId'),
    guestCount: asNumber(record, 'guestCount'), contact: asString(record, 'contact'),
    remark: asString(record, 'remark'), benefitSelection: asString(record, 'benefitSelection'),
    appointmentDate: asString(record, 'appointmentDate'), flow, sourceBookingId: asOptionalString(record, 'sourceBookingId')
  };
};

const mapBookingDraftPayload = (value: unknown): BookingRebookPayload => {
  const record = requireRecord(value, 'bookingDraftPayload');
  return { sourceBookingId: asString(record, 'sourceBookingId'), draft: mapBookingDraft(record.draft) };
};

const mapProfilePayload = (value: unknown): ProfilePayload => {
  const record = requireRecord(value, 'profile');
  const user = requireRecord(record.user, 'profile.user');
  const shortcuts = record.shortcuts;
  const menuItems = record.menuItems;
  if (!Array.isArray(shortcuts) || !Array.isArray(menuItems)) throw new RemoteContractError('profile.shortcuts 和 profile.menuItems 必须是数组');
  return {
    user: { name: asString(user, 'name'), phone: asString(user, 'phone'), avatarText: asString(user, 'avatarText'), level: asString(user, 'level'), balanceText: asString(user, 'balanceText'), couponCount: asNumber(user, 'couponCount'), packageCount: asNumber(user, 'packageCount') },
    title: asString(record, 'title'), settingsIcon: asString(record, 'settingsIcon'), memberTitle: asString(record, 'memberTitle'), memberSubtitle: asString(record, 'memberSubtitle'),
    memberStats: asStringArray(record, 'memberStats'), shortcuts: shortcuts.map((item) => { const entry = requireRecord(item, 'profile.shortcut'); return { key: asString(entry, 'key'), title: asString(entry, 'title'), subtitle: asString(entry, 'subtitle') }; }),
    recentBookingTitle: asString(record, 'recentBookingTitle'), recentBookingActionText: asString(record, 'recentBookingActionText'),
    menuItems: menuItems.map((item) => { const entry = requireRecord(item, 'profile.menuItem'); return { key: asString(entry, 'key'), label: asString(entry, 'label'), valueText: asString(entry, 'valueText') }; }),
    logoutText: asString(record, 'logoutText'), logoutModalTitle: asString(record, 'logoutModalTitle'), logoutModalContent: asString(record, 'logoutModalContent'), logoutConfirmText: asString(record, 'logoutConfirmText'), logoutCancelText: asString(record, 'logoutCancelText')
  };
};

const getSelectedStartTime = async (draft: BookingDraft): Promise<string> => {
  const data = await request<unknown[]>('/time-slots', {
    query: {
      storeId: requireId(draft.storeId, '门店'),
      serviceId: requireId(draft.serviceId, '服务项目'),
      therapistId: draft.therapistMode === 'specified' ? requireId(draft.therapistId, '技师') : undefined,
      date: draft.appointmentDate
    }
  });
  const slot = data.map(mapTimeSlot).find((item) => item.id === draft.slotId || item.startAt === draft.slotId);
  if (!slot) throw new Error('所选时间段已失效，请重新选择');
  return slot.startAt;
};

const currentMobile = (): string => {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return '';
  const session = wx.getStorageSync(AUTH_SESSION_STORAGE_KEY) as { principal?: { mobile?: string }; user?: { mobile?: string } };
  return session?.principal?.mobile || session?.user?.mobile || '';
};

export const remoteService: BookingService = {
  async getHome(): Promise<HomePayload> {
    const [stores, services, therapists, copy] = await Promise.all([this.getStores(), this.getServices(), this.getTherapists(''), catalogPayload<HomePayload['copy']>('homeCopy')]);
    return {
      frequentStores: stores.filter((store) => store.isFrequent),
      nearbyStores: stores.filter((store) => !store.isFrequent),
      featuredServices: services,
      featuredTherapists: therapists.slice(0, 2),
      copy
    };
  },
  async getStores(): Promise<Store[]> {
    const data = await request<unknown[]>('/stores');
    return data.map(mapStore);
  },
  async getServices(): Promise<ServiceItem[]> {
    const data = await request<unknown[]>('/services');
    return data.map(mapService);
  },
  async getStore(id: string): Promise<Store> {
    return mapStore(await request<unknown>(`/stores/${requireId(id, '门店')}`));
  },
  async getService(id: string): Promise<ServiceItem> {
    return mapService(await request<unknown>(`/services/${requireId(id, '服务项目')}`));
  },
  async getTherapists(serviceId: string): Promise<Therapist[]> {
    const data = await request<unknown[]>('/therapists', { query: { serviceId: serviceId || undefined } });
    return data.map(mapTherapist);
  },
  async getTimeSlots(draft?: BookingDraft): Promise<TimeSlot[]> {
    const data = await request<unknown[]>('/time-slots', {
      query: {
        storeId: requireId(draft?.storeId, '门店'),
        serviceId: requireId(draft?.serviceId, '服务项目'),
        therapistId: draft?.therapistMode === 'specified' ? requireId(draft.therapistId, '技师') : undefined,
        date: draft?.appointmentDate
      }
    });
    return data.map(mapTimeSlot);
  },
  async getBookingConfirmation(draft: BookingDraft): Promise<BookingConfirmationPayload> {
    const startTime = await getSelectedStartTime(draft);
    const confirmation = await request<unknown>('/bookings/confirmation', {
      method: 'POST',
      data: {
        storeId: requireId(draft.storeId, '门店'), serviceId: requireId(draft.serviceId, '服务项目'),
        therapistId: draft.therapistMode === 'auto' ? undefined : requireId(draft.therapistId, '技师'),
        date: draft.appointmentDate, startTime, guestCount: draft.guestCount,
        customerName: draft.contact, remark: draft.remark, couponId: draft.benefitSelection
      }
    });
    return mapBookingConfirmation(confirmation);
  },
  getOrderDictionaries: (): Promise<OrderDictionaryPayload> => catalogPayload<OrderDictionaryPayload>('orderDictionaries'),
  getReviewDictionaries: (): Promise<ReviewDictionaryPayload> => catalogPayload<ReviewDictionaryPayload>('reviewDictionaries'),
  getServiceDictionaries: (): Promise<ServiceDictionaryPayload> => catalogPayload<ServiceDictionaryPayload>('serviceDictionaries'),
  getStoreDetailDictionaries: (): Promise<StoreDetailDictionaryPayload> => catalogPayload<StoreDetailDictionaryPayload>('storeDetailDictionaries'),
  getTimeDictionaries: (): Promise<TimeDictionaryPayload> => catalogPayload<TimeDictionaryPayload>('timeDictionaries'),
  getTherapistDictionaries: (): Promise<TherapistDictionaryPayload> => catalogPayload<TherapistDictionaryPayload>('therapistDictionaries'),
  getSuccessCopy: async (): Promise<SuccessCopy> => mapSuccessCopyValue(await catalogPayload<unknown>('successCopy')),
  getLoginCopy: (): Promise<LoginCopyPayload> => catalogPayload<LoginCopyPayload>('loginCopy'),
  async sendLoginCode(mobile: string): Promise<LoginCodePayload> {
    return request<LoginCodePayload>('/auth/send-code', { method:'POST', data:{ clientType:'MINI_PROGRAM', mobile } });
  },
  async login(mobile: string, code: string): Promise<LoginPayload> {
    return request<LoginPayload>('/auth/login', { method:'POST', data:{ clientType:'MINI_PROGRAM', grantType:'SMS_CODE', identifier:mobile, credential:code } });
  },
  async getBookingSuccess(id: string): Promise<BookingSuccessPayload> {
    return mapBookingSuccessPayload(await request<unknown>(`/bookings/${requireId(id, '预约')}/success`));
  },
  async getBookingRebookDraft(id: string): Promise<BookingRebookPayload> {
    return mapBookingDraftPayload(await request<unknown>(`/bookings/${requireId(id, '预约')}/rebook-draft`));
  },
  async getBookingRescheduleDraft(id: string): Promise<BookingReschedulePayload> {
    return mapBookingDraftPayload(await request<unknown>(`/bookings/${requireId(id, '预约')}/reschedule-draft`));
  },
  getProfile: async (): Promise<ProfilePayload> => mapProfilePayload(await request<unknown>('/member/profile')),
  getCheckinDictionaries: (): Promise<CheckinDictionaryPayload> => catalogPayload<CheckinDictionaryPayload>('checkinDictionaries'),
  getActionFeedbackDictionaries: (): Promise<ActionFeedbackDictionaryPayload> => catalogPayload<ActionFeedbackDictionaryPayload>('actionFeedbackDictionaries'),
  getPageStateDictionaries: (): Promise<PageStateDictionaryPayload> => catalogPayload<PageStateDictionaryPayload>('pageStateDictionaries'),
  async createBooking(draft: BookingDraft, requestId: string): Promise<Booking> {
    const startTime = await getSelectedStartTime(draft);
    const mobile = currentMobile();
    if (!mobile) throw new Error('登录状态已失效，请重新登录');
    const booking = await request<unknown>('/bookings', {
      method: 'POST',
      data: {
        storeId: requireId(draft.storeId, '门店'),
        serviceId: requireId(draft.serviceId, '服务项目'),
        therapistId: draft.therapistMode === 'auto' ? undefined : requireId(draft.therapistId, '技师'),
        date: draft.appointmentDate,
        startTime,
        customerName: draft.contact,
        mobile,
        couponId: draft.benefitSelection,
        requestId
      }
    });
    return mapBooking(booking);
  },
  async rescheduleBooking(draft: BookingDraft, requestId: string): Promise<Booking> {
    const startTime = await getSelectedStartTime(draft);
    const bookingId = requireId(draft.sourceBookingId, '原预约');
    const booking = await request<unknown>(`/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      data: {
        date: draft.appointmentDate,
        startTime,
        therapistId: draft.therapistMode === 'auto' ? undefined : requireId(draft.therapistId, '技师'),
        requestId
      }
    });
    return mapBooking(booking);
  },
  async getBookings(): Promise<Booking[]> {
    const data = await request<unknown[]>('/bookings');
    return data.map(mapBooking);
  },
  async getBooking(id: string): Promise<Booking> {
    return mapBooking(await request<unknown>(`/bookings/${id}`));
  },
  async getStoreReviews(storeId: string, serviceId?: string, page = 1, pageSize = 2): Promise<PageResult<StoreReview>> {
    const remoteStoreId = requireId(storeId, '门店');
    const remoteServiceId = serviceId || '';
    const filterQuery = remoteServiceId ? `storeId=${remoteStoreId}&serviceId=${remoteServiceId}` : `storeId=${remoteStoreId}`;
    const data = await request<unknown>(`/reviews?${filterQuery}&page=${page}&pageSize=${pageSize}`);
    return mapReviewPage(data, page, pageSize);
  },
  async checkinBooking(id: string, requestId: string): Promise<Booking> {
    return mapBooking(await request<unknown>(`/bookings/${id}/checkin`, { method: 'POST', data: { requestId } }));
  },
  async refreshBookingCode(id: string, requestId: string): Promise<Booking> {
    return mapBooking(await request<unknown>(`/bookings/${id}/verification-code/refresh`, { method: 'POST', data: { requestId } }));
  },
  async cancelBooking(id: string, requestId: string): Promise<Booking> {
    return mapBooking(await request<unknown>(`/bookings/${id}/cancel`, { method: 'POST', data: { requestId } }));
  },
  async prepareBookingPayment(id: string, requestId: string): Promise<BookingPaymentPayload> {
    return mapPaymentPayload(await request<unknown>(`/bookings/${requireId(id, '预约')}/payment`, { method:'POST', data:{ requestId } }));
  },
  async payBooking(id: string, requestId: string): Promise<Booking> {
    return mapBooking(await request<unknown>(`/bookings/${id}/pay`, { method: 'POST', data: { requestId } }));
  },
  async uploadReviewImage(tempFilePath: string, requestId: string): Promise<ReviewImageUploadPayload> {
    const fileName = tempFilePath.split('/').pop() || `review-${Date.now()}.jpg`;
    const data = await upload<unknown>('/reviews/images', tempFilePath, { fileName, requestId });
    const record = requireRecord(data, 'reviewImageUpload');
    return { imageUrl: asString(record, 'imageUrl') };
  },
  async submitReview(review: ReviewSubmitRequest, requestId: string): Promise<Booking> {
    await request<unknown>('/reviews', {
      method: 'POST',
      data: {
        bookingId: review.bookingId,
        storeRating: review.environmentRating,
        therapistRating: review.therapistRating,
        serviceRating: review.serviceRating,
        tags: review.tags,
        content: review.content,
        anonymous: review.anonymous,
        imageUrls: review.imageUrls,
        requestId
      }
    });
    return this.getBooking(review.bookingId);
  }
};
