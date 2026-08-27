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
import { mockService } from './mock-service';
import { request, upload } from './http';

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

const idAlias: Record<string, string> = {
  jingan: 'store-jingan',
  xujiahui: 'store-xujiahui',
  lujiazui: 'store-lujiazui',
  neck: 'service-neck',
  chinese: 'service-tui-na',
  spa: 'service-spa',
  zhang: 'therapist-anran',
  lin: 'therapist-ziwei',
  zhou: 'therapist-yuanyuan'
};

const toRemoteId = (id: string | undefined, fallback: string): string => {
  if (!id) return fallback;
  return idAlias[id] || id;
};

const asRecord = (value: unknown): RemoteRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as RemoteRecord : {};
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const asString = (record: RemoteRecord, key: string, fallback = ''): string => {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
};
const asNumber = (record: RemoteRecord, key: string, fallback = 0): number => {
  const value = record[key];
  return typeof value === 'number' ? value : fallback;
};
const asBoolean = (record: RemoteRecord, key: string, fallback = false): boolean => {
  const value = record[key];
  return typeof value === 'boolean' ? value : fallback;
};
const asStringArray = (record: RemoteRecord, key: string): string[] => {
  return asArray(record[key]).filter((item): item is string => typeof item === 'string');
};
const asPaymentSignType = (value: string): 'RSA' | 'MD5' | 'HMAC-SHA256' => {
  return value === 'MD5' || value === 'HMAC-SHA256' ? value : 'RSA';
};

const asStringRecord = (value: unknown): Record<string, string> => {
  const record = asRecord(value);
  const result: Record<string, string> = {};
  Object.keys(record).forEach((key) => {
    const item = record[key];
    if (typeof item === 'string') result[key] = item;
  });
  return result;
};

const getClientCatalog = async (): Promise<ClientCatalog> => {
  if (clientCatalogCache) return clientCatalogCache;
  clientCatalogCache = await request<ClientCatalog>('/catalog/client');
  return clientCatalogCache;
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
  return 'available';
};

const normalizeAvailability = (status: string): Therapist['availability'] => {
  return status === 'AVAILABLE' ? 'available' : 'busy';
};

const normalizeBookingStatus = (status: string): BookingStatus => {
  const allowed: BookingStatus[] = ['PENDING_PAYMENT', 'BOOKED', 'CHECKED_IN', 'WAITING_SERVICE', 'IN_SERVICE', 'PENDING_SETTLEMENT', 'COMPLETED', 'CANCELLED'];
  return allowed.includes(status as BookingStatus) ? status as BookingStatus : 'BOOKED';
};

const normalizeStoreBusinessStatus = (status: string): StoreBusinessStatusCode => {
  return status === 'CLOSED' ? 'CLOSED' : 'OPEN';
};

const buildGalleryImages = (record: RemoteRecord): string[] => {
  const imageUrls = asStringArray(record, 'galleryImageUrls');
  if (imageUrls.length) return imageUrls;
  const singleImageUrl = asString(record, 'galleryImageUrl', asString(record, 'coverImageUrl'));
  return singleImageUrl ? [singleImageUrl] : ['', '', ''];
};

const actionsByStatus = (status: BookingStatus): OrderAction[] => {
  const actions: Record<BookingStatus, OrderAction[]> = {
    PENDING_PAYMENT: ['pay', 'cancel', 'view_detail'],
    BOOKED: ['show_code', 'refresh_code', 'reschedule', 'contact', 'view_detail'],
    CHECKED_IN: ['refresh_code', 'contact', 'view_detail'],
    WAITING_SERVICE: ['contact', 'view_detail'],
    IN_SERVICE: ['contact', 'view_detail'],
    PENDING_SETTLEMENT: ['contact', 'view_detail'],
    COMPLETED: ['review', 'rebook', 'view_detail'],
    CANCELLED: ['rebook', 'view_detail']
  };
  return actions[status];
};

const formatScheduledAt = (date: string, startTime: string): string => `${date} ${startTime}`;

const mapStore = (value: unknown): Store => {
  const record = asRecord(value);
  const rawName = asString(record, 'name', '静安寺店');
  const highlights = asStringArray(record, 'highlights');
  return {
    id: asString(record, 'id', 'store-jingan'),
    name: rawName.startsWith('栖愈') ? rawName : `栖愈·${rawName}`,
    distanceKm: distanceToKm(asString(record, 'distance', '0km')),
    rating: asNumber(record, 'rating', 4.8),
    address: asString(record, 'address', ''),
    phone: asString(record, 'phone', ''),
    latitude: asNumber(record, 'latitude'),
    longitude: asNumber(record, 'longitude'),
    businessStatusCode: normalizeStoreBusinessStatus(asString(record, 'businessStatusCode', 'OPEN')),
    businessStatus: asString(record, 'businessStatusLabel', asString(record, 'businessStatus', '')),
    nextAvailableAt: asString(record, 'nextAvailableAt', '今日可约'),
    isFrequent: asBoolean(record, 'frequent'),
    facilities: asStringArray(record, 'facilities'),
    highlights: highlights.length ? highlights : asStringArray(record, 'facilities'),
    memberBenefitText: asString(record, 'memberBenefitText'),
    coverImageUrl: asString(record, 'coverImageUrl'),
    galleryImageUrl: asString(record, 'galleryImageUrl'),
    galleryImageUrls: buildGalleryImages(record)
  };
};

const mapService = (value: unknown): ServiceItem => {
  const record = asRecord(value);
  return {
    id: asString(record, 'id', 'service-neck'),
    name: asString(record, 'name', '肩颈舒缓'),
    category: asString(record, 'category'),
    durationMinutes: asNumber(record, 'durationMinutes', 60),
    price: asNumber(record, 'price', 198),
    memberPrice: asNumber(record, 'memberPrice', asNumber(record, 'price', 198)),
    salesCount: asNumber(record, 'salesCount'),
    tags: asStringArray(record, 'tags'),
    description: asString(record, 'description', ''),
    processSteps: asStringArray(record, 'processSteps'),
    suitableFor: asString(record, 'suitableFor'),
    coverImageUrl: asString(record, 'coverImageUrl', asString(record, 'imageUrl')),
    bannerImageUrl: asString(record, 'bannerImageUrl', asString(record, 'coverImageUrl', asString(record, 'imageUrl')))
  };
};

const mapTherapist = (value: unknown): Therapist => {
  const record = asRecord(value);
  return {
    id: asString(record, 'id', 'therapist-anran'),
    name: asString(record, 'name', '安然'),
    level: asString(record, 'level', '资深技师'),
    experienceYears: asNumber(record, 'experienceYears', 0),
    skills: asStringArray(record, 'skills'),
    rating: asNumber(record, 'rating', 4.8),
    serviceCount: 0,
    specifyFee: asNumber(record, 'extraFee', 0),
    nextAvailableAt: asString(record, 'nextAvailable', '今日可约'),
    availability: normalizeAvailability(asString(record, 'status', 'AVAILABLE')),
    avatarUrl: ''
  };
};

const mapStoreReview = (value: unknown): StoreReview => {
  const record = asRecord(value);
  return {
    id: asString(record, 'id'),
    storeId: asString(record, 'storeId'),
    serviceId: asString(record, 'serviceId'),
    userName: asString(record, 'userName'),
    rating: asNumber(record, 'rating', 5),
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
  const record = asRecord(value);
  const items = asArray(record.items).map(mapStoreReview);
  return {
    items,
    page: asNumber(record, 'page', page),
    pageSize: asNumber(record, 'pageSize', pageSize),
    total: asNumber(record, 'total', items.length),
    hasMore: asBoolean(record, 'hasMore')
  };
};

const mapPaymentPayload = (value: unknown, fallbackBookingId: string): BookingPaymentPayload => {
  const record = asRecord(value);
  const parameters = asRecord(record.parameters);
  return {
    bookingId: asString(record, 'bookingId', fallbackBookingId),
    amount: asNumber(record, 'amount'),
    paymentNo: asString(record, 'paymentNo', `PAY-${fallbackBookingId}`),
    parameters: {
      timeStamp: asString(parameters, 'timeStamp'),
      nonceStr: asString(parameters, 'nonceStr'),
      package: asString(parameters, 'package'),
      signType: asPaymentSignType(asString(parameters, 'signType', 'RSA')),
      paySign: asString(parameters, 'paySign'),
      mockPayment: asBoolean(parameters, 'mockPayment')
    }
  };
};

const mapTimeSlot = (value: unknown): TimeSlot => {
  const record = asRecord(value);
  const startAt = asString(record, 'time', '10:00');
  return {
    id: startAt.replace(':', ''),
    startAt,
    period: timePeriod(startAt),
    status: normalizeSlotStatus(asString(record, 'status', 'AVAILABLE'))
  };
};

const mapPayment = (record: RemoteRecord): PaymentSummary => {
  const amount = asNumber(record, 'amount', 0);
  return {
    itemAmount: amount,
    therapistFee: 0,
    discountAmount: 0,
    balanceDeduction: 0,
    depositDue: 50,
    paidAmount: 50
  };
};

const mapPaymentSummary = (value: unknown, fallbackAmount = 0): PaymentSummary => {
  const record = asRecord(value);
  return {
    itemAmount: asNumber(record, 'itemAmount', fallbackAmount),
    therapistFee: asNumber(record, 'therapistFee', 0),
    discountAmount: asNumber(record, 'discountAmount', 0),
    balanceDeduction: asNumber(record, 'balanceDeduction', 0),
    depositDue: asNumber(record, 'depositDue', 50),
    paidAmount: asNumber(record, 'paidAmount', 0)
  };
};

const mapPaymentLines = (value: unknown): BookingConfirmationPayload['paymentLines'] => {
  return asArray(value).map((item) => {
    const record = asRecord(item);
    return {
      key: asString(record, 'key'),
      label: asString(record, 'label'),
      amountText: asString(record, 'amountText'),
      tone: asString(record, 'tone') === 'discount' ? 'discount' as const : 'default' as const
    };
  }).filter((item) => item.key && item.label);
};

const mapConfirmationEditActions = (value: unknown, fallback: BookingConfirmationPayload['editActions']): BookingConfirmationPayload['editActions'] => {
  const record = asRecord(value);
  return {
    store: asString(record, 'store', fallback.store),
    service: asString(record, 'service', fallback.service),
    therapist: asString(record, 'therapist', fallback.therapist),
    time: asString(record, 'time', fallback.time)
  };
};

const mapServiceCardMeta = (value: unknown, fallback: BookingConfirmationPayload['cardMeta']): BookingConfirmationPayload['cardMeta'] => {
  const record = asRecord(value);
  return {
    durationUnit: asString(record, 'durationUnit', fallback.durationUnit),
    servedPrefix: asString(record, 'servedPrefix', fallback.servedPrefix),
    servedSuffix: asString(record, 'servedSuffix', fallback.servedSuffix)
  };
};

const mapStoreCardMeta = (value: unknown, fallback: { ratingUnit: string; nextAvailablePrefix: string }) => {
  const record = asRecord(value);
  return {
    ratingUnit: asString(record, 'ratingUnit', fallback.ratingUnit),
    nextAvailablePrefix: asString(record, 'nextAvailablePrefix', fallback.nextAvailablePrefix)
  };
};

const mapConfirmationFormCopy = (value: unknown, fallback: BookingConfirmationPayload['formCopy']): BookingConfirmationPayload['formCopy'] => {
  const record = asRecord(value);
  return {
    guestCountLabel: asString(record, 'guestCountLabel', fallback.guestCountLabel),
    contactLabel: asString(record, 'contactLabel', fallback.contactLabel),
    contactPlaceholder: asString(record, 'contactPlaceholder', fallback.contactPlaceholder),
    remarkLabel: asString(record, 'remarkLabel', fallback.remarkLabel),
    remarkPlaceholder: asString(record, 'remarkPlaceholder', fallback.remarkPlaceholder),
    contactRequiredMessage: asString(record, 'contactRequiredMessage', fallback.contactRequiredMessage),
    submitFallbackText: asString(record, 'submitFallbackText', fallback.submitFallbackText)
  };
};

const mapBookingConfirmation = async (value: unknown, fallback: BookingConfirmationPayload): Promise<BookingConfirmationPayload> => {
  const record = asRecord(value);
  const payment = mapPaymentSummary(record.payment, fallback.payment.itemAmount);
  const paymentLines = mapPaymentLines(record.paymentLines);
  return {
    pageTitle: asString(record, 'pageTitle', fallback.pageTitle),
    editActions: mapConfirmationEditActions(record.editActions, fallback.editActions),
    cardMeta: mapServiceCardMeta(record.cardMeta, fallback.cardMeta),
    store: mapStore(record.store),
    service: mapService(record.service),
    therapist: record.therapist ? mapTherapist(record.therapist) : undefined,
    therapistDisplayName: asString(record, 'therapistDisplayName', fallback.therapistDisplayName),
    scheduledAt: asString(record, 'scheduledAt', fallback.scheduledAt),
    payment,
    formCopy: mapConfirmationFormCopy(record.formCopy, fallback.formCopy),
    benefitTitle: asString(record, 'benefitTitle', fallback.benefitTitle),
    benefitSelectionText: asString(record, 'benefitSelectionText', fallback.benefitSelectionText),
    paymentTitle: asString(record, 'paymentTitle', fallback.paymentTitle),
    paymentLines: paymentLines.length ? paymentLines : fallback.paymentLines,
    totalLabel: asString(record, 'totalLabel', fallback.totalLabel),
    agreementText: asString(record, 'agreementText', fallback.agreementText),
    agreementRequiredMessage: asString(record, 'agreementRequiredMessage', fallback.agreementRequiredMessage),
    depositButtonText: asString(record, 'depositButtonText', fallback.depositButtonText)
  };
};

const mapBooking = (value: unknown): Booking => {
  const record = asRecord(value);
  const status = normalizeBookingStatus(asString(record, 'status', 'BOOKED'));
  return {
    id: asString(record, 'id', 'BK-202608-1000'),
    code: asString(record, 'verificationCode', asString(record, 'id', 'QY202608')),
    qrImageUrl: asString(record, 'verificationQrImageUrl'),
    status,
    store: mapStore(record.store),
    service: mapService(record.service),
    therapist: mapTherapist(record.therapist),
    scheduledAt: formatScheduledAt(asString(record, 'appointmentDate'), asString(record, 'startTime', '10:00')),
    contact: `${asString(record, 'customerName', '顾客')} ${asString(record, 'mobile', '')}`.trim(),
    payment: mapPayment(record),
    availableActions: actionsByStatus(status)
  };
};

const catalogRecord = async (key: keyof ClientCatalog): Promise<RemoteRecord> => {
  return asRecord((await getClientCatalog())[key]);
};

const mapHomeCopy = async (): Promise<HomePayload['copy']> => {
  return { ...(await mockService.getHome()).copy, ...await catalogRecord('homeCopy') };
};

const mapLoginCopy = async (): Promise<LoginCopyPayload> => {
  return { ...await mockService.getLoginCopy(), ...await catalogRecord('loginCopy') };
};

const mapOrderDictionaries = async (): Promise<OrderDictionaryPayload> => {
  const fallback = await mockService.getOrderDictionaries();
  const record = await catalogRecord('orderDictionaries');
  const detailFields = asRecord(record.detailFields);
  const paymentFields = asRecord(record.paymentFields);
  const cardMeta = asRecord(record.cardMeta);
  const serviceCardMeta = asRecord(record.serviceCardMeta);
  const storeCardMeta = asRecord(record.storeCardMeta);
  const tabs = asArray(record.tabs).map((item) => {
    const itemRecord = asRecord(item);
    const statuses = asStringArray(itemRecord, 'statuses') as BookingStatus[];
    return {
      key: asString(itemRecord, 'key'),
      label: asString(itemRecord, 'label'),
      statuses: statuses.length ? statuses : undefined
    };
  }).filter((item) => item.key && item.label);
  return {
    ...fallback,
    pageTitle: asString(record, 'pageTitle', fallback.pageTitle),
    detailTitle: asString(record, 'detailTitle', fallback.detailTitle),
    statusLabel: Object.keys(asStringRecord(record.statusLabel)).length ? asStringRecord(record.statusLabel) : fallback.statusLabel,
    actionLabel: Object.keys(asStringRecord(record.actionLabel)).length ? asStringRecord(record.actionLabel) : fallback.actionLabel,
    tabs: tabs.length ? tabs : fallback.tabs,
    detailSteps: asArray(record.detailSteps).filter((item): item is string => typeof item === 'string').length ? asArray(record.detailSteps).filter((item): item is string => typeof item === 'string') : fallback.detailSteps,
    codeTitle: asString(record, 'codeTitle', fallback.codeTitle),
    codeHint: asString(record, 'codeHint', fallback.codeHint),
    codeExtraHint: asString(record, 'codeExtraHint', fallback.codeExtraHint),
    detailFields: {
      service: asString(detailFields, 'service', fallback.detailFields.service),
      therapist: asString(detailFields, 'therapist', fallback.detailFields.therapist),
      scheduledAt: asString(detailFields, 'scheduledAt', fallback.detailFields.scheduledAt),
      contact: asString(detailFields, 'contact', fallback.detailFields.contact)
    },
    paymentTitle: asString(record, 'paymentTitle', fallback.paymentTitle),
    paymentFields: {
      item: asString(paymentFields, 'item', fallback.paymentFields.item),
      therapist: asString(paymentFields, 'therapist', fallback.paymentFields.therapist),
      discount: asString(paymentFields, 'discount', fallback.paymentFields.discount),
      paid: asString(paymentFields, 'paid', fallback.paymentFields.paid)
    },
    actionSectionTitle: asString(record, 'actionSectionTitle', fallback.actionSectionTitle),
    checkinButtonText: asString(record, 'checkinButtonText', fallback.checkinButtonText),
    cancelModalTitle: asString(record, 'cancelModalTitle', fallback.cancelModalTitle),
    cancelModalContent: asString(record, 'cancelModalContent', fallback.cancelModalContent),
    cancelModalConfirmText: asString(record, 'cancelModalConfirmText', fallback.cancelModalConfirmText),
    cancelSuccessToastText: asString(record, 'cancelSuccessToastText', fallback.cancelSuccessToastText),
    paySuccessToastText: asString(record, 'paySuccessToastText', fallback.paySuccessToastText),
    payFailureToastText: asString(record, 'payFailureToastText', fallback.payFailureToastText),
    cardMeta: {
      paidPrefix: asString(cardMeta, 'paidPrefix', fallback.cardMeta.paidPrefix)
    },
    serviceCardMeta: mapServiceCardMeta(serviceCardMeta, fallback.serviceCardMeta),
    storeCardMeta: mapStoreCardMeta(storeCardMeta, fallback.storeCardMeta)
  };
};

const mapServiceDictionaries = async (): Promise<ServiceDictionaryPayload> => {
  return { ...await mockService.getServiceDictionaries(), ...await catalogRecord('serviceDictionaries') };
};

const mapStoreDetailDictionaries = async (): Promise<StoreDetailDictionaryPayload> => {
  return { ...await mockService.getStoreDetailDictionaries(), ...await catalogRecord('storeDetailDictionaries') };
};

const mapTimeDictionaries = async (): Promise<TimeDictionaryPayload> => {
  return { ...await mockService.getTimeDictionaries(), ...await catalogRecord('timeDictionaries') };
};

const mapTherapistDictionaries = async (): Promise<TherapistDictionaryPayload> => {
  return { ...await mockService.getTherapistDictionaries(), ...await catalogRecord('therapistDictionaries') };
};

const mapSuccessCopy = async (): Promise<SuccessCopy> => {
  return { ...await mockService.getSuccessCopy(), ...await catalogRecord('successCopy') };
};

const mapSuccessCopyValue = async (value: unknown): Promise<SuccessCopy> => {
  return { ...await mockService.getSuccessCopy(), ...asRecord(value) };
};

const mapBookingSuccessPayload = async (value: unknown, fallback: BookingSuccessPayload): Promise<BookingSuccessPayload> => {
  const record = asRecord(value);
  return {
    booking: record.booking ? mapBooking(record.booking) : fallback.booking,
    copy: record.copy ? await mapSuccessCopyValue(record.copy) : fallback.copy
  };
};

const mapBookingDraft = (value: unknown, fallback: BookingDraft): BookingDraft => {
  const record = asRecord(value);
  const therapistMode = asString(record, 'therapistMode', fallback.therapistMode);
  return {
    storeId: asString(record, 'storeId', fallback.storeId),
    serviceId: asString(record, 'serviceId', fallback.serviceId),
    therapistMode: therapistMode === 'specified' ? 'specified' : 'auto',
    therapistId: asString(record, 'therapistId', fallback.therapistId || '') || undefined,
    slotId: asString(record, 'slotId', fallback.slotId || '') || undefined,
    guestCount: asNumber(record, 'guestCount', fallback.guestCount),
    contact: asString(record, 'contact', fallback.contact),
    remark: asString(record, 'remark', fallback.remark),
    benefitSelection: asString(record, 'benefitSelection', fallback.benefitSelection),
    appointmentDate: asString(record, 'appointmentDate', fallback.appointmentDate),
    flow: asString(record, 'flow', fallback.flow || 'create') === 'reschedule' ? 'reschedule' : 'create',
    sourceBookingId: asString(record, 'sourceBookingId', fallback.sourceBookingId || '') || undefined
  };
};

const mapBookingRebookPayload = (value: unknown, fallback: BookingRebookPayload): BookingRebookPayload => {
  const record = asRecord(value);
  return {
    sourceBookingId: asString(record, 'sourceBookingId', fallback.sourceBookingId),
    draft: mapBookingDraft(record.draft, fallback.draft)
  };
};

const mapBookingReschedulePayload = (value: unknown, fallback: BookingReschedulePayload): BookingReschedulePayload => {
  const record = asRecord(value);
  return {
    sourceBookingId: asString(record, 'sourceBookingId', fallback.sourceBookingId),
    draft: mapBookingDraft(record.draft, fallback.draft)
  };
};

const mapProfile = async (): Promise<ProfilePayload> => {
  return { ...await mockService.getProfile(), ...await catalogRecord('profile') };
};

const mapProfilePayload = async (value: unknown): Promise<ProfilePayload> => {
  return { ...await mockService.getProfile(), ...asRecord(value) };
};

const mapCheckinDictionaries = async (): Promise<CheckinDictionaryPayload> => {
  return { ...await mockService.getCheckinDictionaries(), ...await catalogRecord('checkinDictionaries') };
};
const mapReviewDictionaries = async (): Promise<ReviewDictionaryPayload> => {
  return { ...await mockService.getReviewDictionaries(), ...await catalogRecord('reviewDictionaries') };
};
const mapActionFeedbackDictionaries = async (): Promise<ActionFeedbackDictionaryPayload> => {
  return { ...await mockService.getActionFeedbackDictionaries(), ...await catalogRecord('actionFeedbackDictionaries') };
};
const mapPageStateDictionaries = async (): Promise<PageStateDictionaryPayload> => {
  return { ...await mockService.getPageStateDictionaries(), ...await catalogRecord('pageStateDictionaries') };
};

const withMockFallback = async <T>(remoteLoader: () => Promise<T>, fallbackLoader: () => Promise<T>): Promise<T> => {
  try {
    return await remoteLoader();
  } catch (error) {
    return fallbackLoader();
  }
};

const getSelectedStartTime = async (draft: BookingDraft): Promise<string> => {
  const slots = await mockService.getTimeSlots(draft);
  return slots.find((slot) => slot.id === draft.slotId)?.startAt || draft.slotId || '14:00';
};

export const remoteService: BookingService = {
  async getHome(): Promise<HomePayload> {
    const [stores, services, therapists, copy] = await Promise.all([this.getStores(), this.getServices(), this.getTherapists(''), withMockFallback(mapHomeCopy, async () => (await mockService.getHome()).copy)]);
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
    return mapStore(await request<unknown>(`/stores/${toRemoteId(id, 'store-jingan')}`));
  },
  async getService(id: string): Promise<ServiceItem> {
    return mapService(await request<unknown>(`/services/${toRemoteId(id, 'service-neck')}`));
  },
  async getTherapists(serviceId: string): Promise<Therapist[]> {
    const data = await request<unknown[]>('/therapists', { query: { serviceId: serviceId ? toRemoteId(serviceId, 'service-neck') : undefined } });
    return data.map(mapTherapist);
  },
  async getTimeSlots(draft?: BookingDraft): Promise<TimeSlot[]> {
    const data = await request<unknown[]>('/time-slots', {
      query: {
        storeId: toRemoteId(draft?.storeId, 'store-jingan'),
        serviceId: toRemoteId(draft?.serviceId, 'service-neck'),
        therapistId: toRemoteId(draft?.therapistId, 'therapist-anran'),
        date: draft?.appointmentDate
      }
    });
    return data.map(mapTimeSlot);
  },
  async getBookingConfirmation(draft: BookingDraft): Promise<BookingConfirmationPayload> {
    const fallback = await mockService.getBookingConfirmation(draft);
    return withMockFallback(async () => {
      const startTime = await getSelectedStartTime(draft);
      const confirmation = await request<unknown>('/bookings/confirmation', {
        method: 'POST',
        data: {
          storeId: toRemoteId(draft.storeId, 'store-jingan'),
          serviceId: toRemoteId(draft.serviceId, 'service-neck'),
          therapistId: draft.therapistMode === 'auto' ? undefined : toRemoteId(draft.therapistId, 'therapist-anran'),
          date: draft.appointmentDate,
          startTime,
          guestCount: draft.guestCount,
          customerName: draft.contact,
          remark: draft.remark,
          couponId: draft.benefitSelection
        }
      });
      return mapBookingConfirmation(confirmation, fallback);
    }, () => Promise.resolve(fallback));
  },
  getOrderDictionaries: (): Promise<OrderDictionaryPayload> => withMockFallback(mapOrderDictionaries, () => mockService.getOrderDictionaries()),
  getReviewDictionaries: (): Promise<ReviewDictionaryPayload> => withMockFallback(mapReviewDictionaries, () => mockService.getReviewDictionaries()),
  getServiceDictionaries: (): Promise<ServiceDictionaryPayload> => withMockFallback(mapServiceDictionaries, () => mockService.getServiceDictionaries()),
  getStoreDetailDictionaries: (): Promise<StoreDetailDictionaryPayload> => withMockFallback(mapStoreDetailDictionaries, () => mockService.getStoreDetailDictionaries()),
  getTimeDictionaries: (): Promise<TimeDictionaryPayload> => withMockFallback(mapTimeDictionaries, () => mockService.getTimeDictionaries()),
  getTherapistDictionaries: (): Promise<TherapistDictionaryPayload> => withMockFallback(mapTherapistDictionaries, () => mockService.getTherapistDictionaries()),
  getSuccessCopy: (): Promise<SuccessCopy> => withMockFallback(mapSuccessCopy, () => mockService.getSuccessCopy()),
  getLoginCopy: (): Promise<LoginCopyPayload> => withMockFallback(mapLoginCopy, () => mockService.getLoginCopy()),
  async sendLoginCode(mobile: string): Promise<LoginCodePayload> {
    return request<LoginCodePayload>('/auth/send-code', { method:'POST', data:{ clientType:'MINI_PROGRAM', mobile } });
  },
  async login(mobile: string, code: string): Promise<LoginPayload> {
    return request<LoginPayload>('/auth/login', { method:'POST', data:{ clientType:'MINI_PROGRAM', grantType:'SMS_CODE', identifier:mobile, credential:code } });
  },
  async getBookingSuccess(id: string): Promise<BookingSuccessPayload> {
    const fallback = await mockService.getBookingSuccess(id);
    return withMockFallback(async () => mapBookingSuccessPayload(await request<unknown>(`/bookings/${id}/success`), fallback), () => Promise.resolve(fallback));
  },
  async getBookingRebookDraft(id: string): Promise<BookingRebookPayload> {
    const fallback = await mockService.getBookingRebookDraft(id);
    return withMockFallback(async () => mapBookingRebookPayload(await request<unknown>(`/bookings/${id}/rebook-draft`), fallback), () => Promise.resolve(fallback));
  },
  async getBookingRescheduleDraft(id: string): Promise<BookingReschedulePayload> {
    const fallback = await mockService.getBookingRescheduleDraft(id);
    return withMockFallback(async () => mapBookingReschedulePayload(await request<unknown>(`/bookings/${id}/reschedule-draft`), fallback), () => Promise.resolve(fallback));
  },
  getProfile: (): Promise<ProfilePayload> => withMockFallback(async () => mapProfilePayload(await request<unknown>('/member/profile')), mapProfile),
  getCheckinDictionaries: (): Promise<CheckinDictionaryPayload> => withMockFallback(mapCheckinDictionaries, () => mockService.getCheckinDictionaries()),
  getActionFeedbackDictionaries: (): Promise<ActionFeedbackDictionaryPayload> => withMockFallback(mapActionFeedbackDictionaries, () => mockService.getActionFeedbackDictionaries()),
  getPageStateDictionaries: (): Promise<PageStateDictionaryPayload> => withMockFallback(mapPageStateDictionaries, () => mockService.getPageStateDictionaries()),
  async createBooking(draft: BookingDraft, requestId: string): Promise<Booking> {
    const startTime = await getSelectedStartTime(draft);
    const booking = await request<unknown>('/bookings', {
      method: 'POST',
      data: {
        storeId: toRemoteId(draft.storeId, 'store-jingan'),
        serviceId: toRemoteId(draft.serviceId, 'service-neck'),
        therapistId: toRemoteId(draft.therapistId, 'therapist-anran'),
        date: draft.appointmentDate,
        startTime,
        customerName: draft.contact,
        mobile: '13800001288',
        couponId: draft.benefitSelection,
        requestId
      }
    });
    return mapBooking(booking);
  },
  async rescheduleBooking(draft: BookingDraft, requestId: string): Promise<Booking> {
    const startTime = await getSelectedStartTime(draft);
    const bookingId = draft.sourceBookingId || '';
    const booking = await request<unknown>(`/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      data: {
        date: draft.appointmentDate,
        startTime,
        therapistId: draft.therapistMode === 'auto' ? undefined : toRemoteId(draft.therapistId, 'therapist-anran'),
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
    const remoteStoreId = toRemoteId(storeId, 'store-jingan');
    const remoteServiceId = serviceId ? toRemoteId(serviceId, 'service-neck') : '';
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
    return mapPaymentPayload(await request<unknown>(`/bookings/${id}/payment`, { method:'POST', data:{ requestId } }), id);
  },
  async payBooking(id: string, requestId: string): Promise<Booking> {
    return mapBooking(await request<unknown>(`/bookings/${id}/pay`, { method: 'POST', data: { requestId } }));
  },
  async uploadReviewImage(tempFilePath: string, requestId: string): Promise<ReviewImageUploadPayload> {
    const fileName = tempFilePath.split('/').pop() || `review-${Date.now()}.jpg`;
    const data = await upload<unknown>('/reviews/images', tempFilePath, { fileName, requestId });
    const record = asRecord(data);
    return { imageUrl: asString(record, 'imageUrl', tempFilePath) };
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
