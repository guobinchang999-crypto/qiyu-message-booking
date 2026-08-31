import {
  Booking,
  BookingDraft,
  BookingStatus,
  OrderAction,
  PaymentSummary,
  ReviewSubmitRequest,
  ServiceItem,
  Store,
  StoreBusinessStatusCode,
  StoreReview,
  Therapist,
  TimePeriodCode,
  TimeSlot,
  TimeSlotStatus
} from '../types/domain';
import {
  ActionFeedbackDictionaryPayload,
  BookingConfirmationPayload,
  BookingPaymentPayload,
  BookingRebookPayload,
  BookingReschedulePayload,
  BookingService,
  BookingSuccessPayload,
  CheckinDictionaryPayload,
  FavoritePayload,
  FavoriteResourceType,
  HomePayload,
  LoginCodePayload,
  LoginCopyPayload,
  LoginPayload,
  OrderDictionaryPayload,
  PageResult,
  PageStateDictionaryPayload,
  ProfilePayload,
  ReviewDictionaryPayload,
  ReviewImageUploadPayload,
  ServiceDictionaryPayload,
  StoreDetailDictionaryPayload,
  SuccessCopy,
  TherapistDictionaryPayload,
  TimeDictionaryPayload
} from './contracts';
import { AUTH_SESSION_STORAGE_KEY } from './config';
import { request, upload } from './http';

type RemoteRecord = Record<string, unknown>;
type ClientCatalogKey =
  | 'homeCopy'
  | 'loginCopy'
  | 'orderDictionaries'
  | 'reviewDictionaries'
  | 'serviceDictionaries'
  | 'storeDetailDictionaries'
  | 'timeDictionaries'
  | 'therapistDictionaries'
  | 'successCopy'
  | 'profile'
  | 'checkinDictionaries'
  | 'actionFeedbackDictionaries'
  | 'pageStateDictionaries';
type ClientCatalog = Partial<Record<ClientCatalogKey, unknown>>;

let clientCatalogCache: ClientCatalog | null = null;

/** Identifies a backend payload violation without replacing it with local data. */
class RemoteContractError extends Error {
  constructor(message: string) {
    super(`后端响应不完整：${message}`);
    this.name = 'RemoteContractError';
  }
}

const asRecord = (value: unknown): RemoteRecord => value && typeof value === 'object' && !Array.isArray(value)
  ? value as RemoteRecord
  : {};

const requireRecord = (value: unknown, path: string): RemoteRecord => {
  const record = asRecord(value);
  if (Object.keys(record).length === 0) throw new RemoteContractError(`${path} 必须是对象`);
  return record;
};

const requireArray = (value: unknown, path: string): unknown[] => {
  if (!Array.isArray(value)) throw new RemoteContractError(`${path} 必须是数组`);
  return value;
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
  const value = requireArray(record[key], key);
  if (!value.every((item) => typeof item === 'string')) throw new RemoteContractError(`${key} 必须是字符串数组`);
  return value as string[];
};

const requireId = (id: string | undefined, field: string): string => {
  if (!id || !id.trim()) throw new Error(`缺少${field}，请返回上一步重新选择`);
  return id;
};

const asPaymentSignType = (value: string): 'RSA' | 'MD5' | 'HMAC-SHA256' => {
  if (value === 'RSA' || value === 'MD5' || value === 'HMAC-SHA256') return value;
  throw new RemoteContractError('payment.parameters.signType 不受支持');
};

const getClientCatalog = async (): Promise<ClientCatalog> => {
  if (clientCatalogCache) return clientCatalogCache;
  clientCatalogCache = requireRecord(await request<unknown>('/catalog/client'), 'catalog.client') as ClientCatalog;
  return clientCatalogCache;
};

/** Returns a server-owned page dictionary and rejects missing sections. */
const getCatalogSection = async <T>(key: ClientCatalogKey): Promise<T> => {
  return requireRecord((await getClientCatalog())[key], `catalog.${key}`) as T;
};

const distanceToKm = (distance: string): number => {
  const value = Number.parseFloat(distance.replace('km', ''));
  if (!Number.isFinite(value)) throw new RemoteContractError('store.distance 必须包含有效公里数');
  return value;
};

const timePeriod = (time: string): TimePeriodCode => {
  const hour = Number.parseInt(time.split(':')[0] || '', 10);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new RemoteContractError('timeSlot.time 格式不正确');
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
  if (status === 'BUSY' || status === 'OFF_DUTY' || status === 'DISABLED' || status === 'ON_LEAVE') return 'busy';
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

const mapStore = (value: unknown): Store => {
  const record = requireRecord(value, 'store');
  const rawName = asString(record, 'name');
  const galleryImageUrls = asStringArray(record, 'galleryImageUrls');
  if (galleryImageUrls.length === 0) throw new RemoteContractError('store.galleryImageUrls 不能为空');
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
    highlights: asStringArray(record, 'highlights'),
    memberBenefitText: asString(record, 'memberBenefitText'),
    coverImageUrl: asOptionalString(record, 'coverImageUrl'),
    galleryImageUrl: asOptionalString(record, 'galleryImageUrl'),
    galleryImageUrls
  };
};

const mapService = (value: unknown): ServiceItem => {
  const record = requireRecord(value, 'service');
  return {
    id: asString(record, 'id'), name: asString(record, 'name'), category: asString(record, 'category'),
    durationMinutes: asNumber(record, 'durationMinutes'), price: asNumber(record, 'price'),
    memberPrice: asNumber(record, 'memberPrice'), salesCount: asNumber(record, 'salesCount'),
    tags: asStringArray(record, 'tags'), description: asString(record, 'description'),
    processSteps: asStringArray(record, 'processSteps'), suitableFor: asString(record, 'suitableFor'),
    coverImageUrl: asOptionalString(record, 'coverImageUrl'), bannerImageUrl: asOptionalString(record, 'bannerImageUrl')
  };
};

const mapTherapist = (value: unknown): Therapist => {
  const record = requireRecord(value, 'therapist');
  return {
    id: asString(record, 'id'), name: asString(record, 'name'), storeId: asOptionalString(record, 'storeId'), level: asString(record, 'level'),
    experienceYears: asNumber(record, 'experienceYears'), skills: asStringArray(record, 'skills'),
    rating: asNumber(record, 'rating'), serviceCount: asNumber(record, 'serviceCount'),
    specifyFee: asNumber(record, 'extraFee'), nextAvailableAt: asString(record, 'nextAvailable'),
    availability: normalizeAvailability(asString(record, 'status')), avatarUrl: asOptionalString(record, 'avatarUrl')
  };
};

const mapStoreReview = (value: unknown): StoreReview => {
  const record = requireRecord(value, 'review');
  return {
    id: asString(record, 'id'), storeId: asString(record, 'storeId'), serviceId: asString(record, 'serviceId'),
    userName: asString(record, 'userName'), rating: asNumber(record, 'rating'), content: asString(record, 'content'),
    tags: asStringArray(record, 'tags'), createdAt: asString(record, 'createdAt')
  };
};

const mapReviewPage = (value: unknown, requestedPage: number, requestedPageSize: number): PageResult<StoreReview> => {
  if (Array.isArray(value)) {
    const items = value.map(mapStoreReview);
    return { items, page: requestedPage, pageSize: requestedPageSize, total: items.length, hasMore: false };
  }
  const record = requireRecord(value, 'reviewPage');
  return {
    items: requireArray(record.items, 'reviewPage.items').map(mapStoreReview),
    page: asNumber(record, 'page'), pageSize: asNumber(record, 'pageSize'),
    total: asNumber(record, 'total'), hasMore: asBoolean(record, 'hasMore')
  };
};

const mapPaymentSummary = (value: unknown, path: string): PaymentSummary => {
  const record = requireRecord(value, path);
  return {
    itemAmount: asNumber(record, 'itemAmount'), therapistFee: asNumber(record, 'therapistFee'),
    discountAmount: asNumber(record, 'discountAmount'), balanceDeduction: asNumber(record, 'balanceDeduction'),
    depositDue: asNumber(record, 'depositDue'), paidAmount: asNumber(record, 'paidAmount')
  };
};

const mapPaymentPayload = (value: unknown): BookingPaymentPayload => {
  const record = requireRecord(value, 'payment');
  const parameters = requireRecord(record.parameters, 'payment.parameters');
  return {
    bookingId: asString(record, 'bookingId'), amount: asNumber(record, 'amount'), paymentNo: asString(record, 'paymentNo'),
    parameters: {
      timeStamp: asString(parameters, 'timeStamp'), nonceStr: asString(parameters, 'nonceStr'),
      package: asString(parameters, 'package'), signType: asPaymentSignType(asString(parameters, 'signType')),
      paySign: asString(parameters, 'paySign')
    }
  };
};

const mapTimeSlot = (value: unknown): TimeSlot => {
  const record = requireRecord(value, 'timeSlot');
  const startAt = asString(record, 'time');
  return {
    // The scheduler exposes the start time as its stable slot identifier.
    id: startAt.replace(':', ''), startAt, period: timePeriod(startAt), status: normalizeSlotStatus(asString(record, 'status'))
  };
};

const mapOrderActions = (value: unknown): OrderAction[] => {
  const allowed: OrderAction[] = ['pay', 'cancel', 'reschedule', 'contact', 'show_code', 'refresh_code', 'rebook', 'review', 'view_detail'];
  const actions = requireArray(value, 'booking.availableActions');
  if (!actions.every((action) => typeof action === 'string' && allowed.includes(action as OrderAction))) {
    throw new RemoteContractError('booking.availableActions 包含不支持的操作');
  }
  return actions as OrderAction[];
};

const mapBooking = (value: unknown): Booking => {
  const record = requireRecord(value, 'booking');
  return {
    id: asString(record, 'id'), code: asString(record, 'verificationCode'), qrImageUrl: asOptionalString(record, 'verificationQrImageUrl'),
    status: normalizeBookingStatus(asString(record, 'status')), store: mapStore(record.store), service: mapService(record.service),
    therapist: mapTherapist(record.therapist), scheduledAt: asString(record, 'scheduledAt'), contact: asString(record, 'contact'),
    payment: mapPaymentSummary(record.payment, 'booking.payment'), availableActions: mapOrderActions(record.availableActions)
  };
};

const mapPaymentLines = (value: unknown): BookingConfirmationPayload['paymentLines'] => requireArray(value, 'confirmation.paymentLines').map((line) => {
  const record = requireRecord(line, 'confirmation.paymentLine');
  const tone = asOptionalString(record, 'tone');
  if (tone !== undefined && tone !== 'discount' && tone !== 'default') throw new RemoteContractError('confirmation.paymentLine.tone 不受支持');
  return { key: asString(record, 'key'), label: asString(record, 'label'), amountText: asString(record, 'amountText'), tone };
});

const mapBookingConfirmation = (value: unknown): BookingConfirmationPayload => {
  const record = requireRecord(value, 'confirmation');
  const editActions = requireRecord(record.editActions, 'confirmation.editActions');
  const cardMeta = requireRecord(record.cardMeta, 'confirmation.cardMeta');
  const formCopy = requireRecord(record.formCopy, 'confirmation.formCopy');
  return {
    pageTitle: asString(record, 'pageTitle'),
    editActions: { store: asString(editActions, 'store'), service: asString(editActions, 'service'), therapist: asString(editActions, 'therapist'), time: asString(editActions, 'time') },
    cardMeta: { durationUnit: asString(cardMeta, 'durationUnit'), servedPrefix: asString(cardMeta, 'servedPrefix'), servedSuffix: asString(cardMeta, 'servedSuffix') },
    store: mapStore(record.store), service: mapService(record.service),
    therapist: record.therapist === null || record.therapist === undefined ? undefined : mapTherapist(record.therapist),
    therapistDisplayName: asString(record, 'therapistDisplayName'), scheduledAt: asString(record, 'scheduledAt'),
    payment: mapPaymentSummary(record.payment, 'confirmation.payment'),
    formCopy: {
      guestCountLabel: asString(formCopy, 'guestCountLabel'), contactLabel: asString(formCopy, 'contactLabel'),
      contactPlaceholder: asString(formCopy, 'contactPlaceholder'), remarkLabel: asString(formCopy, 'remarkLabel'),
      remarkPlaceholder: asString(formCopy, 'remarkPlaceholder'), contactRequiredMessage: asString(formCopy, 'contactRequiredMessage'),
      submitFallbackText: asString(formCopy, 'submitFallbackText')
    },
    benefitTitle: asString(record, 'benefitTitle'), benefitSelectionText: asString(record, 'benefitSelectionText'),
    paymentTitle: asString(record, 'paymentTitle'), paymentLines: mapPaymentLines(record.paymentLines), totalLabel: asString(record, 'totalLabel'),
    agreementText: asString(record, 'agreementText'), agreementRequiredMessage: asString(record, 'agreementRequiredMessage'),
    depositButtonText: asString(record, 'depositButtonText')
  };
};

const mapBookingDraft = (value: unknown): BookingDraft => {
  const record = requireRecord(value, 'bookingDraft');
  const therapistMode = asString(record, 'therapistMode');
  if (therapistMode !== 'auto' && therapistMode !== 'specified') throw new RemoteContractError('bookingDraft.therapistMode 不受支持');
  const flow = asOptionalString(record, 'flow');
  if (flow !== undefined && flow !== 'create' && flow !== 'reschedule') throw new RemoteContractError('bookingDraft.flow 不受支持');
  return {
    storeId: asString(record, 'storeId'), serviceId: asString(record, 'serviceId'), appointmentDate: asString(record, 'appointmentDate'),
    therapistMode, therapistId: asOptionalString(record, 'therapistId'), slotId: asOptionalString(record, 'slotId'),
    guestCount: asNumber(record, 'guestCount'), contact: asString(record, 'contact'), remark: asString(record, 'remark'),
    benefitSelection: asString(record, 'benefitSelection'), flow, sourceBookingId: asOptionalString(record, 'sourceBookingId')
  };
};

const mapBookingSuccess = (value: unknown): BookingSuccessPayload => {
  const record = requireRecord(value, 'bookingSuccess');
  const copy = requireRecord(record.copy, 'bookingSuccess.copy');
  return {
    booking: mapBooking(record.booking),
    copy: {
      title: asString(copy, 'title'), subtitle: asString(copy, 'subtitle'),
      bookingCodePrefix: asString(copy, 'bookingCodePrefix'), codeHint: asString(copy, 'codeHint'),
      navigationActionText: asString(copy, 'navigationActionText'), contactActionText: asString(copy, 'contactActionText'),
      reminderText: asString(copy, 'reminderText'), detailButtonText: asString(copy, 'detailButtonText'),
      homeButtonText: asString(copy, 'homeButtonText')
    }
  };
};

const mapProfile = (value: unknown): ProfilePayload => {
  const record = requireRecord(value, 'member.profile');
  const user = requireRecord(record.user, 'member.profile.user');
  return {
    user: {
      name: asString(user, 'name'), phone: asString(user, 'phone'), avatarText: asString(user, 'avatarText'),
      level: asString(user, 'level'), balanceText: asString(user, 'balanceText'),
      couponCount: asNumber(user, 'couponCount'), packageCount: asNumber(user, 'packageCount')
    },
    title: asString(record, 'title'), settingsIcon: asString(record, 'settingsIcon'),
    memberTitle: asString(record, 'memberTitle'), memberSubtitle: asString(record, 'memberSubtitle'),
    memberStats: asStringArray(record, 'memberStats'),
    shortcuts: requireArray(record.shortcuts, 'member.profile.shortcuts').map((value) => {
      const item = requireRecord(value, 'member.profile.shortcut');
      return { key: asString(item, 'key'), title: asString(item, 'title'), subtitle: asString(item, 'subtitle') };
    }),
    recentBookingTitle: asString(record, 'recentBookingTitle'),
    recentBookingActionText: asString(record, 'recentBookingActionText'),
    menuItems: requireArray(record.menuItems, 'member.profile.menuItems').map((value) => {
      const item = requireRecord(value, 'member.profile.menuItem');
      return { key: asString(item, 'key'), label: asString(item, 'label'), valueText: asString(item, 'valueText') };
    }),
    logoutText: asString(record, 'logoutText'), logoutModalTitle: asString(record, 'logoutModalTitle'),
    logoutModalContent: asString(record, 'logoutModalContent'), logoutConfirmText: asString(record, 'logoutConfirmText'),
    logoutCancelText: asString(record, 'logoutCancelText')
  };
};

const mapBookingDraftPayload = <T extends BookingRebookPayload | BookingReschedulePayload>(value: unknown): T => {
  const record = requireRecord(value, 'bookingDraftPayload');
  return { sourceBookingId: asString(record, 'sourceBookingId'), draft: mapBookingDraft(record.draft) } as T;
};

const buildTherapistRequest = (draft: BookingDraft): Record<string, string> => {
  if (draft.therapistMode === 'auto') return {};
  return { therapistId: requireId(draft.therapistId, '技师') };
};

/** Builds scheduler input without silently substituting an unrelated technician. */
const buildTimeSlotQuery = (draft: BookingDraft): Record<string, string> => ({
  storeId: requireId(draft.storeId, '门店'), serviceId: requireId(draft.serviceId, '服务项目'),
  date: requireId(draft.appointmentDate, '预约日期'), ...buildTherapistRequest(draft)
});

const getSelectedStartTime = async (draft: BookingDraft): Promise<string> => {
  const slots = await remoteService.getTimeSlots(draft);
  const slot = slots.find((item) => item.id === draft.slotId || item.startAt === draft.slotId);
  if (!slot || slot.status === 'full') throw new Error('所选时间段已失效，请重新选择');
  return slot.startAt;
};

const currentMobile = (): string => {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return '';
  const session = wx.getStorageSync(AUTH_SESSION_STORAGE_KEY) as { principal?: { mobile?: string }; user?: { mobile?: string } };
  return session?.principal?.mobile || session?.user?.mobile || '';
};

export const remoteService: BookingService = {
  async getHome(): Promise<HomePayload> {
    const [stores, services, therapists, copy] = await Promise.all([this.getStores(), this.getServices(), this.getTherapists(''), getCatalogSection<HomePayload['copy']>('homeCopy')]);
    return { frequentStores: stores.filter((store) => store.isFrequent), nearbyStores: stores.filter((store) => !store.isFrequent), featuredServices: services, featuredTherapists: therapists.slice(0, 2), copy };
  },
  async getStores(): Promise<Store[]> { return requireArray(await request<unknown>('/stores'), 'stores').map(mapStore); },
  async getServices(): Promise<ServiceItem[]> { return requireArray(await request<unknown>('/services'), 'services').map(mapService); },
  async getStore(id: string): Promise<Store> { return mapStore(await request<unknown>(`/stores/${requireId(id, '门店')}`)); },
  async getService(id: string): Promise<ServiceItem> { return mapService(await request<unknown>(`/services/${requireId(id, '服务项目')}`)); },
  async getTherapists(serviceId: string): Promise<Therapist[]> {
    return requireArray(await request<unknown>('/therapists', { query: serviceId ? { serviceId } : undefined }), 'therapists').map(mapTherapist);
  },
  async getTimeSlots(draft?: BookingDraft): Promise<TimeSlot[]> {
    if (!draft) throw new Error('缺少预约信息，无法查询可约时间');
    return requireArray(await request<unknown>('/time-slots', { query: buildTimeSlotQuery(draft) }), 'timeSlots').map(mapTimeSlot);
  },
  async getBookingConfirmation(draft: BookingDraft): Promise<BookingConfirmationPayload> {
    const startTime = await getSelectedStartTime(draft);
    return mapBookingConfirmation(await request<unknown>('/bookings/confirmation', {
      method: 'POST', data: {
        storeId: requireId(draft.storeId, '门店'), serviceId: requireId(draft.serviceId, '服务项目'), ...buildTherapistRequest(draft),
        date: requireId(draft.appointmentDate, '预约日期'), startTime, guestCount: draft.guestCount,
        customerName: draft.contact, remark: draft.remark, couponId: draft.benefitSelection
      }
    }));
  },
  getOrderDictionaries: (): Promise<OrderDictionaryPayload> => getCatalogSection<OrderDictionaryPayload>('orderDictionaries'),
  getReviewDictionaries: (): Promise<ReviewDictionaryPayload> => getCatalogSection<ReviewDictionaryPayload>('reviewDictionaries'),
  getServiceDictionaries: (): Promise<ServiceDictionaryPayload> => getCatalogSection<ServiceDictionaryPayload>('serviceDictionaries'),
  getStoreDetailDictionaries: (): Promise<StoreDetailDictionaryPayload> => getCatalogSection<StoreDetailDictionaryPayload>('storeDetailDictionaries'),
  getTimeDictionaries: (): Promise<TimeDictionaryPayload> => getCatalogSection<TimeDictionaryPayload>('timeDictionaries'),
  getTherapistDictionaries: (): Promise<TherapistDictionaryPayload> => getCatalogSection<TherapistDictionaryPayload>('therapistDictionaries'),
  getSuccessCopy: (): Promise<SuccessCopy> => getCatalogSection<SuccessCopy>('successCopy'),
  getLoginCopy: (): Promise<LoginCopyPayload> => getCatalogSection<LoginCopyPayload>('loginCopy'),
  sendLoginCode: (mobile: string): Promise<LoginCodePayload> => request<LoginCodePayload>('/auth/send-code', { method: 'POST', data: { clientType: 'MINI_PROGRAM', mobile } }),
  login: (mobile: string, code: string): Promise<LoginPayload> => request<LoginPayload>('/auth/login', { method: 'POST', data: { clientType: 'MINI_PROGRAM', grantType: 'SMS_CODE', identifier: mobile, credential: code } }),
  async getBookingSuccess(id: string): Promise<BookingSuccessPayload> { return mapBookingSuccess(await request<unknown>(`/bookings/${requireId(id, '预约')}/success`)); },
  async getBookingRebookDraft(id: string): Promise<BookingRebookPayload> { return mapBookingDraftPayload<BookingRebookPayload>(await request<unknown>(`/bookings/${requireId(id, '预约')}/rebook-draft`)); },
  async getBookingRescheduleDraft(id: string): Promise<BookingReschedulePayload> { return mapBookingDraftPayload<BookingReschedulePayload>(await request<unknown>(`/bookings/${requireId(id, '预约')}/reschedule-draft`)); },
  async getProfile(): Promise<ProfilePayload> { return mapProfile(await request<unknown>('/member/profile')); },
  getCheckinDictionaries: (): Promise<CheckinDictionaryPayload> => getCatalogSection<CheckinDictionaryPayload>('checkinDictionaries'),
  getActionFeedbackDictionaries: (): Promise<ActionFeedbackDictionaryPayload> => getCatalogSection<ActionFeedbackDictionaryPayload>('actionFeedbackDictionaries'),
  getPageStateDictionaries: (): Promise<PageStateDictionaryPayload> => getCatalogSection<PageStateDictionaryPayload>('pageStateDictionaries'),
  async createBooking(draft: BookingDraft, requestId: string): Promise<Booking> {
    const mobile = currentMobile();
    if (!mobile) throw new Error('登录状态已失效，请重新登录');
    const startTime = await getSelectedStartTime(draft);
    return mapBooking(await request<unknown>('/bookings', {
      method: 'POST', data: {
        storeId: requireId(draft.storeId, '门店'), serviceId: requireId(draft.serviceId, '服务项目'), ...buildTherapistRequest(draft),
        date: requireId(draft.appointmentDate, '预约日期'), startTime, customerName: draft.contact, mobile,
        couponId: draft.benefitSelection, requestId
      }
    }));
  },
  async rescheduleBooking(draft: BookingDraft, requestId: string): Promise<Booking> {
    const startTime = await getSelectedStartTime(draft);
    return mapBooking(await request<unknown>(`/bookings/${requireId(draft.sourceBookingId, '原预约')}/reschedule`, {
      method: 'POST', data: { date: requireId(draft.appointmentDate, '预约日期'), startTime, ...buildTherapistRequest(draft), requestId }
    }));
  },
  async getBookings(): Promise<Booking[]> { return requireArray(await request<unknown>('/bookings'), 'bookings').map(mapBooking); },
  async getBooking(id: string): Promise<Booking> { return mapBooking(await request<unknown>(`/bookings/${requireId(id, '预约')}`)); },
  async getStoreReviews(storeId: string, serviceId?: string, page = 1, pageSize = 2): Promise<PageResult<StoreReview>> {
    return mapReviewPage(await request<unknown>('/reviews', { query: { storeId: requireId(storeId, '门店'), serviceId, page: String(page), pageSize: String(pageSize) } }), page, pageSize);
  },
  async checkinBooking(id: string, requestId: string): Promise<Booking> { return mapBooking(await request<unknown>(`/bookings/${requireId(id, '预约')}/checkin`, { method: 'POST', data: { requestId } })); },
  async refreshBookingCode(id: string, requestId: string): Promise<Booking> { return mapBooking(await request<unknown>(`/bookings/${requireId(id, '预约')}/verification-code/refresh`, { method: 'POST', data: { requestId } })); },
  async cancelBooking(id: string, requestId: string): Promise<Booking> { return mapBooking(await request<unknown>(`/bookings/${requireId(id, '预约')}/cancel`, { method: 'POST', data: { requestId } })); },
  async prepareBookingPayment(id: string, requestId: string): Promise<BookingPaymentPayload> { return mapPaymentPayload(await request<unknown>(`/bookings/${requireId(id, '预约')}/payment`, { method: 'POST', data: { requestId } })); },
  async payBooking(id: string, requestId: string): Promise<Booking> { return mapBooking(await request<unknown>(`/bookings/${requireId(id, '预约')}/pay`, { method: 'POST', data: { requestId } })); },
  async getFavorite(resourceType: FavoriteResourceType, resourceId: string): Promise<FavoritePayload> {
    return request<FavoritePayload>(`/member/favorites/${resourceType}/${requireId(resourceId, '收藏资源')}`);
  },
  async setFavorite(resourceType: FavoriteResourceType, resourceId: string, favorite: boolean): Promise<FavoritePayload> {
    return request<FavoritePayload>(`/member/favorites/${resourceType}/${requireId(resourceId, '收藏资源')}`, {
      method: favorite ? 'PUT' : 'DELETE'
    });
  },
  async uploadReviewImage(tempFilePath: string, requestId: string): Promise<ReviewImageUploadPayload> {
    const fileName = requireId(tempFilePath.split('/').pop(), '图片文件名');
    return { imageUrl: asString(requireRecord(await upload<unknown>('/reviews/images', tempFilePath, { fileName, requestId }), 'reviewImage'), 'imageUrl') };
  },
  async submitReview(review: ReviewSubmitRequest, requestId: string): Promise<Booking> {
    await request<unknown>('/reviews', {
      method: 'POST', data: {
        bookingId: review.bookingId, storeRating: review.environmentRating, therapistRating: review.therapistRating,
        serviceRating: review.serviceRating, tags: review.tags, content: review.content, anonymous: review.anonymous,
        imageUrls: review.imageUrls, requestId
      }
    });
    return this.getBooking(review.bookingId);
  }
};
