"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remoteService = void 0;
const mock_service_1 = require("./mock-service");
const http_1 = require("./http");
let clientCatalogCache = null;
const idAlias = {
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
const toRemoteId = (id, fallback) => {
    if (!id)
        return fallback;
    return idAlias[id] || id;
};
const asRecord = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const asArray = (value) => Array.isArray(value) ? value : [];
const asString = (record, key, fallback = '') => {
    const value = record[key];
    return typeof value === 'string' ? value : fallback;
};
const asNumber = (record, key, fallback = 0) => {
    const value = record[key];
    return typeof value === 'number' ? value : fallback;
};
const asBoolean = (record, key, fallback = false) => {
    const value = record[key];
    return typeof value === 'boolean' ? value : fallback;
};
const asStringArray = (record, key) => {
    return asArray(record[key]).filter((item) => typeof item === 'string');
};
const asPaymentSignType = (value) => {
    return value === 'MD5' || value === 'HMAC-SHA256' ? value : 'RSA';
};
const asStringRecord = (value) => {
    const record = asRecord(value);
    const result = {};
    Object.keys(record).forEach((key) => {
        const item = record[key];
        if (typeof item === 'string')
            result[key] = item;
    });
    return result;
};
const getClientCatalog = async () => {
    if (clientCatalogCache)
        return clientCatalogCache;
    clientCatalogCache = await (0, http_1.request)('/catalog/client');
    return clientCatalogCache;
};
const distanceToKm = (distance) => {
    const value = Number.parseFloat(distance.replace('km', ''));
    return Number.isFinite(value) ? value : 0;
};
const timePeriod = (time) => {
    const hour = Number.parseInt(time.split(':')[0] || '0', 10);
    if (hour < 12)
        return 'MORNING';
    if (hour < 18)
        return 'AFTERNOON';
    return 'EVENING';
};
const normalizeSlotStatus = (status) => {
    if (status === 'FULL')
        return 'full';
    if (status === 'ALMOST_FULL')
        return 'limited';
    return 'available';
};
const normalizeAvailability = (status) => {
    return status === 'AVAILABLE' ? 'available' : 'busy';
};
const normalizeBookingStatus = (status) => {
    const allowed = ['PENDING_PAYMENT', 'BOOKED', 'CHECKED_IN', 'WAITING_SERVICE', 'IN_SERVICE', 'PENDING_SETTLEMENT', 'COMPLETED', 'CANCELLED'];
    return allowed.includes(status) ? status : 'BOOKED';
};
const normalizeStoreBusinessStatus = (status) => {
    return status === 'CLOSED' ? 'CLOSED' : 'OPEN';
};
const buildGalleryImages = (record) => {
    const imageUrls = asStringArray(record, 'galleryImageUrls');
    if (imageUrls.length)
        return imageUrls;
    const singleImageUrl = asString(record, 'galleryImageUrl', asString(record, 'coverImageUrl'));
    return singleImageUrl ? [singleImageUrl] : ['', '', ''];
};
const actionsByStatus = (status) => {
    const actions = {
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
const formatScheduledAt = (date, startTime) => `${date} ${startTime}`;
const mapStore = (value) => {
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
const mapService = (value) => {
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
const mapTherapist = (value) => {
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
const mapStoreReview = (value) => {
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
const mapReviewPage = (value, page, pageSize) => {
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
const mapPaymentPayload = (value, fallbackBookingId) => {
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
const mapTimeSlot = (value) => {
    const record = asRecord(value);
    const startAt = asString(record, 'time', '10:00');
    return {
        id: startAt.replace(':', ''),
        startAt,
        period: timePeriod(startAt),
        status: normalizeSlotStatus(asString(record, 'status', 'AVAILABLE'))
    };
};
const mapPayment = (record) => {
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
const mapPaymentSummary = (value, fallbackAmount = 0) => {
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
const mapPaymentLines = (value) => {
    return asArray(value).map((item) => {
        const record = asRecord(item);
        return {
            key: asString(record, 'key'),
            label: asString(record, 'label'),
            amountText: asString(record, 'amountText'),
            tone: asString(record, 'tone') === 'discount' ? 'discount' : 'default'
        };
    }).filter((item) => item.key && item.label);
};
const mapConfirmationEditActions = (value, fallback) => {
    const record = asRecord(value);
    return {
        store: asString(record, 'store', fallback.store),
        service: asString(record, 'service', fallback.service),
        therapist: asString(record, 'therapist', fallback.therapist),
        time: asString(record, 'time', fallback.time)
    };
};
const mapServiceCardMeta = (value, fallback) => {
    const record = asRecord(value);
    return {
        durationUnit: asString(record, 'durationUnit', fallback.durationUnit),
        servedPrefix: asString(record, 'servedPrefix', fallback.servedPrefix),
        servedSuffix: asString(record, 'servedSuffix', fallback.servedSuffix)
    };
};
const mapStoreCardMeta = (value, fallback) => {
    const record = asRecord(value);
    return {
        ratingUnit: asString(record, 'ratingUnit', fallback.ratingUnit),
        nextAvailablePrefix: asString(record, 'nextAvailablePrefix', fallback.nextAvailablePrefix)
    };
};
const mapConfirmationFormCopy = (value, fallback) => {
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
const mapBookingConfirmation = async (value, fallback) => {
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
const mapBooking = (value) => {
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
const catalogRecord = async (key) => {
    return asRecord((await getClientCatalog())[key]);
};
const mapHomeCopy = async () => {
    return { ...(await mock_service_1.mockService.getHome()).copy, ...await catalogRecord('homeCopy') };
};
const mapLoginCopy = async () => {
    return { ...await mock_service_1.mockService.getLoginCopy(), ...await catalogRecord('loginCopy') };
};
const mapOrderDictionaries = async () => {
    const fallback = await mock_service_1.mockService.getOrderDictionaries();
    const record = await catalogRecord('orderDictionaries');
    const detailFields = asRecord(record.detailFields);
    const paymentFields = asRecord(record.paymentFields);
    const cardMeta = asRecord(record.cardMeta);
    const serviceCardMeta = asRecord(record.serviceCardMeta);
    const storeCardMeta = asRecord(record.storeCardMeta);
    const tabs = asArray(record.tabs).map((item) => {
        const itemRecord = asRecord(item);
        const statuses = asStringArray(itemRecord, 'statuses');
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
        detailSteps: asArray(record.detailSteps).filter((item) => typeof item === 'string').length ? asArray(record.detailSteps).filter((item) => typeof item === 'string') : fallback.detailSteps,
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
const mapServiceDictionaries = async () => {
    return { ...await mock_service_1.mockService.getServiceDictionaries(), ...await catalogRecord('serviceDictionaries') };
};
const mapStoreDetailDictionaries = async () => {
    return { ...await mock_service_1.mockService.getStoreDetailDictionaries(), ...await catalogRecord('storeDetailDictionaries') };
};
const mapTimeDictionaries = async () => {
    return { ...await mock_service_1.mockService.getTimeDictionaries(), ...await catalogRecord('timeDictionaries') };
};
const mapTherapistDictionaries = async () => {
    return { ...await mock_service_1.mockService.getTherapistDictionaries(), ...await catalogRecord('therapistDictionaries') };
};
const mapSuccessCopy = async () => {
    return { ...await mock_service_1.mockService.getSuccessCopy(), ...await catalogRecord('successCopy') };
};
const mapSuccessCopyValue = async (value) => {
    return { ...await mock_service_1.mockService.getSuccessCopy(), ...asRecord(value) };
};
const mapBookingSuccessPayload = async (value, fallback) => {
    const record = asRecord(value);
    return {
        booking: record.booking ? mapBooking(record.booking) : fallback.booking,
        copy: record.copy ? await mapSuccessCopyValue(record.copy) : fallback.copy
    };
};
const mapBookingDraft = (value, fallback) => {
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
const mapBookingRebookPayload = (value, fallback) => {
    const record = asRecord(value);
    return {
        sourceBookingId: asString(record, 'sourceBookingId', fallback.sourceBookingId),
        draft: mapBookingDraft(record.draft, fallback.draft)
    };
};
const mapBookingReschedulePayload = (value, fallback) => {
    const record = asRecord(value);
    return {
        sourceBookingId: asString(record, 'sourceBookingId', fallback.sourceBookingId),
        draft: mapBookingDraft(record.draft, fallback.draft)
    };
};
const mapProfile = async () => {
    return { ...await mock_service_1.mockService.getProfile(), ...await catalogRecord('profile') };
};
const mapProfilePayload = async (value) => {
    return { ...await mock_service_1.mockService.getProfile(), ...asRecord(value) };
};
const mapCheckinDictionaries = async () => {
    return { ...await mock_service_1.mockService.getCheckinDictionaries(), ...await catalogRecord('checkinDictionaries') };
};
const mapReviewDictionaries = async () => {
    return { ...await mock_service_1.mockService.getReviewDictionaries(), ...await catalogRecord('reviewDictionaries') };
};
const mapActionFeedbackDictionaries = async () => {
    return { ...await mock_service_1.mockService.getActionFeedbackDictionaries(), ...await catalogRecord('actionFeedbackDictionaries') };
};
const mapPageStateDictionaries = async () => {
    return { ...await mock_service_1.mockService.getPageStateDictionaries(), ...await catalogRecord('pageStateDictionaries') };
};
const withMockFallback = async (remoteLoader, fallbackLoader) => {
    try {
        return await remoteLoader();
    }
    catch (error) {
        return fallbackLoader();
    }
};
const getSelectedStartTime = async (draft) => {
    const slots = await mock_service_1.mockService.getTimeSlots(draft);
    return slots.find((slot) => slot.id === draft.slotId)?.startAt || draft.slotId || '14:00';
};
exports.remoteService = {
    async getHome() {
        const [stores, services, therapists, copy] = await Promise.all([this.getStores(), this.getServices(), this.getTherapists(''), withMockFallback(mapHomeCopy, async () => (await mock_service_1.mockService.getHome()).copy)]);
        return {
            frequentStores: stores.filter((store) => store.isFrequent),
            nearbyStores: stores.filter((store) => !store.isFrequent),
            featuredServices: services,
            featuredTherapists: therapists.slice(0, 2),
            copy
        };
    },
    async getStores() {
        const data = await (0, http_1.request)('/stores');
        return data.map(mapStore);
    },
    async getServices() {
        const data = await (0, http_1.request)('/services');
        return data.map(mapService);
    },
    async getStore(id) {
        return mapStore(await (0, http_1.request)(`/stores/${toRemoteId(id, 'store-jingan')}`));
    },
    async getService(id) {
        return mapService(await (0, http_1.request)(`/services/${toRemoteId(id, 'service-neck')}`));
    },
    async getTherapists(serviceId) {
        const data = await (0, http_1.request)('/therapists', { query: { serviceId: serviceId ? toRemoteId(serviceId, 'service-neck') : undefined } });
        return data.map(mapTherapist);
    },
    async getTimeSlots(draft) {
        const data = await (0, http_1.request)('/time-slots', {
            query: {
                storeId: toRemoteId(draft?.storeId, 'store-jingan'),
                serviceId: toRemoteId(draft?.serviceId, 'service-neck'),
                therapistId: toRemoteId(draft?.therapistId, 'therapist-anran'),
                date: draft?.appointmentDate
            }
        });
        return data.map(mapTimeSlot);
    },
    async getBookingConfirmation(draft) {
        const fallback = await mock_service_1.mockService.getBookingConfirmation(draft);
        return withMockFallback(async () => {
            const startTime = await getSelectedStartTime(draft);
            const confirmation = await (0, http_1.request)('/bookings/confirmation', {
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
    getOrderDictionaries: () => withMockFallback(mapOrderDictionaries, () => mock_service_1.mockService.getOrderDictionaries()),
    getReviewDictionaries: () => withMockFallback(mapReviewDictionaries, () => mock_service_1.mockService.getReviewDictionaries()),
    getServiceDictionaries: () => withMockFallback(mapServiceDictionaries, () => mock_service_1.mockService.getServiceDictionaries()),
    getStoreDetailDictionaries: () => withMockFallback(mapStoreDetailDictionaries, () => mock_service_1.mockService.getStoreDetailDictionaries()),
    getTimeDictionaries: () => withMockFallback(mapTimeDictionaries, () => mock_service_1.mockService.getTimeDictionaries()),
    getTherapistDictionaries: () => withMockFallback(mapTherapistDictionaries, () => mock_service_1.mockService.getTherapistDictionaries()),
    getSuccessCopy: () => withMockFallback(mapSuccessCopy, () => mock_service_1.mockService.getSuccessCopy()),
    getLoginCopy: () => withMockFallback(mapLoginCopy, () => mock_service_1.mockService.getLoginCopy()),
    async sendLoginCode(mobile) {
        return (0, http_1.request)('/auth/send-code', { method: 'POST', data: { clientType: 'MINI_PROGRAM', mobile } });
    },
    async login(mobile, code) {
        return (0, http_1.request)('/auth/login', { method: 'POST', data: { clientType: 'MINI_PROGRAM', grantType: 'SMS_CODE', identifier: mobile, credential: code } });
    },
    async getBookingSuccess(id) {
        const fallback = await mock_service_1.mockService.getBookingSuccess(id);
        return withMockFallback(async () => mapBookingSuccessPayload(await (0, http_1.request)(`/bookings/${id}/success`), fallback), () => Promise.resolve(fallback));
    },
    async getBookingRebookDraft(id) {
        const fallback = await mock_service_1.mockService.getBookingRebookDraft(id);
        return withMockFallback(async () => mapBookingRebookPayload(await (0, http_1.request)(`/bookings/${id}/rebook-draft`), fallback), () => Promise.resolve(fallback));
    },
    async getBookingRescheduleDraft(id) {
        const fallback = await mock_service_1.mockService.getBookingRescheduleDraft(id);
        return withMockFallback(async () => mapBookingReschedulePayload(await (0, http_1.request)(`/bookings/${id}/reschedule-draft`), fallback), () => Promise.resolve(fallback));
    },
    getProfile: () => withMockFallback(async () => mapProfilePayload(await (0, http_1.request)('/member/profile')), mapProfile),
    getCheckinDictionaries: () => withMockFallback(mapCheckinDictionaries, () => mock_service_1.mockService.getCheckinDictionaries()),
    getActionFeedbackDictionaries: () => withMockFallback(mapActionFeedbackDictionaries, () => mock_service_1.mockService.getActionFeedbackDictionaries()),
    getPageStateDictionaries: () => withMockFallback(mapPageStateDictionaries, () => mock_service_1.mockService.getPageStateDictionaries()),
    async createBooking(draft, requestId) {
        const startTime = await getSelectedStartTime(draft);
        const booking = await (0, http_1.request)('/bookings', {
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
    async rescheduleBooking(draft, requestId) {
        const startTime = await getSelectedStartTime(draft);
        const bookingId = draft.sourceBookingId || '';
        const booking = await (0, http_1.request)(`/bookings/${bookingId}/reschedule`, {
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
    async getBookings() {
        const data = await (0, http_1.request)('/bookings');
        return data.map(mapBooking);
    },
    async getBooking(id) {
        return mapBooking(await (0, http_1.request)(`/bookings/${id}`));
    },
    async getStoreReviews(storeId, serviceId, page = 1, pageSize = 2) {
        const remoteStoreId = toRemoteId(storeId, 'store-jingan');
        const remoteServiceId = serviceId ? toRemoteId(serviceId, 'service-neck') : '';
        const filterQuery = remoteServiceId ? `storeId=${remoteStoreId}&serviceId=${remoteServiceId}` : `storeId=${remoteStoreId}`;
        const data = await (0, http_1.request)(`/reviews?${filterQuery}&page=${page}&pageSize=${pageSize}`);
        return mapReviewPage(data, page, pageSize);
    },
    async checkinBooking(id, requestId) {
        return mapBooking(await (0, http_1.request)(`/bookings/${id}/checkin`, { method: 'POST', data: { requestId } }));
    },
    async refreshBookingCode(id, requestId) {
        return mapBooking(await (0, http_1.request)(`/bookings/${id}/verification-code/refresh`, { method: 'POST', data: { requestId } }));
    },
    async cancelBooking(id, requestId) {
        return mapBooking(await (0, http_1.request)(`/bookings/${id}/cancel`, { method: 'POST', data: { requestId } }));
    },
    async prepareBookingPayment(id, requestId) {
        return mapPaymentPayload(await (0, http_1.request)(`/bookings/${id}/payment`, { method: 'POST', data: { requestId } }), id);
    },
    async payBooking(id, requestId) {
        return mapBooking(await (0, http_1.request)(`/bookings/${id}/pay`, { method: 'POST', data: { requestId } }));
    },
    async uploadReviewImage(tempFilePath, requestId) {
        const fileName = tempFilePath.split('/').pop() || `review-${Date.now()}.jpg`;
        const data = await (0, http_1.upload)('/reviews/images', tempFilePath, { fileName, requestId });
        const record = asRecord(data);
        return { imageUrl: asString(record, 'imageUrl', tempFilePath) };
    },
    async submitReview(review, requestId) {
        await (0, http_1.request)('/reviews', {
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
