"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remoteService = void 0;
const config_1 = require("./config");
const http_1 = require("./http");
let clientCatalogCache = null;
/** Identifies a backend payload violation without replacing it with local data. */
class RemoteContractError extends Error {
    constructor(message) {
        super(`后端响应不完整：${message}`);
        this.name = 'RemoteContractError';
    }
}
const asRecord = (value) => value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
const requireRecord = (value, path) => {
    const record = asRecord(value);
    if (Object.keys(record).length === 0)
        throw new RemoteContractError(`${path} 必须是对象`);
    return record;
};
const requireArray = (value, path) => {
    if (!Array.isArray(value))
        throw new RemoteContractError(`${path} 必须是数组`);
    return value;
};
const asString = (record, key) => {
    const value = record[key];
    if (typeof value !== 'string' || !value.trim())
        throw new RemoteContractError(`${key} 必须是非空字符串`);
    return value;
};
const asOptionalString = (record, key) => {
    const value = record[key];
    if (value === undefined || value === null || value === '')
        return undefined;
    if (typeof value !== 'string')
        throw new RemoteContractError(`${key} 必须是字符串`);
    return value;
};
const asNumber = (record, key) => {
    const value = record[key];
    if (typeof value !== 'number' || !Number.isFinite(value))
        throw new RemoteContractError(`${key} 必须是有效数字`);
    return value;
};
const asBoolean = (record, key) => {
    const value = record[key];
    if (typeof value !== 'boolean')
        throw new RemoteContractError(`${key} 必须是布尔值`);
    return value;
};
const asOptionalBoolean = (record, key) => {
    const value = record[key];
    if (value === undefined || value === null)
        return undefined;
    if (typeof value !== 'boolean')
        throw new RemoteContractError(`${key} 必须是布尔值`);
    return value;
};
const asStringArray = (record, key) => {
    const value = requireArray(record[key], key);
    if (!value.every((item) => typeof item === 'string'))
        throw new RemoteContractError(`${key} 必须是字符串数组`);
    return value;
};
const requireId = (id, field) => {
    if (!id || !id.trim())
        throw new Error(`缺少${field}，请返回上一步重新选择`);
    return id;
};
const asPaymentSignType = (value) => {
    if (value === 'RSA' || value === 'MD5' || value === 'HMAC-SHA256')
        return value;
    throw new RemoteContractError('payment.parameters.signType 不受支持');
};
const getClientCatalog = async () => {
    if (clientCatalogCache)
        return clientCatalogCache;
    clientCatalogCache = requireRecord(await (0, http_1.request)('/catalog/client'), 'catalog.client');
    return clientCatalogCache;
};
/** Returns a server-owned page dictionary and rejects missing sections. */
const getCatalogSection = async (key) => {
    return requireRecord((await getClientCatalog())[key], `catalog.${key}`);
};
const distanceToKm = (distance) => {
    const value = Number.parseFloat(distance.replace('km', ''));
    if (!Number.isFinite(value))
        throw new RemoteContractError('store.distance 必须包含有效公里数');
    return value;
};
const timePeriod = (time) => {
    const hour = Number.parseInt(time.split(':')[0] || '', 10);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23)
        throw new RemoteContractError('timeSlot.time 格式不正确');
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
    if (status === 'AVAILABLE')
        return 'available';
    throw new RemoteContractError('timeSlot.status 不受支持');
};
const normalizeAvailability = (status) => {
    if (status === 'AVAILABLE')
        return 'available';
    if (status === 'BUSY' || status === 'OFF_DUTY' || status === 'DISABLED' || status === 'ON_LEAVE')
        return 'busy';
    throw new RemoteContractError('therapist.status 不受支持');
};
const normalizeBookingStatus = (status) => {
    const allowed = ['PENDING_PAYMENT', 'BOOKED', 'CHECKED_IN', 'WAITING_SERVICE', 'IN_SERVICE', 'PENDING_SETTLEMENT', 'COMPLETED', 'CANCELLED'];
    if (allowed.includes(status))
        return status;
    throw new RemoteContractError('booking.status 不受支持');
};
const normalizeStoreBusinessStatus = (status) => {
    if (status === 'OPEN' || status === 'CLOSED')
        return status;
    throw new RemoteContractError('store.businessStatusCode 不受支持');
};
const mapStore = (value) => {
    const record = requireRecord(value, 'store');
    const rawName = asString(record, 'name');
    const galleryImageUrls = asStringArray(record, 'galleryImageUrls');
    if (galleryImageUrls.length === 0)
        throw new RemoteContractError('store.galleryImageUrls 不能为空');
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
const mapService = (value) => {
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
const mapTherapist = (value) => {
    const record = requireRecord(value, 'therapist');
    return {
        id: asString(record, 'id'), name: asString(record, 'name'), storeId: asOptionalString(record, 'storeId'), level: asString(record, 'level'),
        experienceYears: asNumber(record, 'experienceYears'), skills: asStringArray(record, 'skills'),
        rating: asNumber(record, 'rating'), serviceCount: asNumber(record, 'serviceCount'),
        specifyFee: asNumber(record, 'extraFee'), nextAvailableAt: asString(record, 'nextAvailable'),
        availability: normalizeAvailability(asString(record, 'status')), avatarUrl: asOptionalString(record, 'avatarUrl')
    };
};
const mapStoreReview = (value) => {
    const record = requireRecord(value, 'review');
    return {
        id: asString(record, 'id'), storeId: asString(record, 'storeId'), serviceId: asString(record, 'serviceId'),
        userName: asString(record, 'userName'), rating: asNumber(record, 'rating'), content: asString(record, 'content'),
        tags: asStringArray(record, 'tags'), createdAt: asString(record, 'createdAt')
    };
};
const mapReviewPage = (value, requestedPage, requestedPageSize) => {
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
const mapPaymentSummary = (value, path) => {
    const record = requireRecord(value, path);
    return {
        itemAmount: asNumber(record, 'itemAmount'), therapistFee: asNumber(record, 'therapistFee'),
        discountAmount: asNumber(record, 'discountAmount'), balanceDeduction: asNumber(record, 'balanceDeduction'),
        depositDue: asNumber(record, 'depositDue'), paidAmount: asNumber(record, 'paidAmount')
    };
};
const mapPaymentPayload = (value) => {
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
const mapTimeSlot = (value) => {
    const record = requireRecord(value, 'timeSlot');
    const startAt = asString(record, 'time');
    return {
        // The scheduler exposes the start time as its stable slot identifier.
        id: startAt.replace(':', ''), startAt, period: timePeriod(startAt), status: normalizeSlotStatus(asString(record, 'status'))
    };
};
const mapOrderActions = (value) => {
    const allowed = ['pay', 'cancel', 'reschedule', 'contact', 'show_code', 'refresh_code', 'rebook', 'review', 'view_detail'];
    const actions = requireArray(value, 'booking.availableActions');
    if (!actions.every((action) => typeof action === 'string' && allowed.includes(action))) {
        throw new RemoteContractError('booking.availableActions 包含不支持的操作');
    }
    return actions;
};
const mapBooking = (value) => {
    const record = requireRecord(value, 'booking');
    return {
        id: asString(record, 'id'), code: asString(record, 'verificationCode'), qrImageUrl: asOptionalString(record, 'verificationQrImageUrl'),
        status: normalizeBookingStatus(asString(record, 'status')), store: mapStore(record.store), service: mapService(record.service),
        therapist: mapTherapist(record.therapist), scheduledAt: asString(record, 'scheduledAt'), contact: asString(record, 'contact'),
        payment: mapPaymentSummary(record.payment, 'booking.payment'), availableActions: mapOrderActions(record.availableActions)
    };
};
const mapPaymentLines = (value) => requireArray(value, 'confirmation.paymentLines').map((line) => {
    const record = requireRecord(line, 'confirmation.paymentLine');
    const tone = asOptionalString(record, 'tone');
    if (tone !== undefined && tone !== 'discount' && tone !== 'default')
        throw new RemoteContractError('confirmation.paymentLine.tone 不受支持');
    return { key: asString(record, 'key'), label: asString(record, 'label'), amountText: asString(record, 'amountText'), tone };
});
const mapBookingConfirmation = (value) => {
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
const mapBookingDraft = (value) => {
    const record = requireRecord(value, 'bookingDraft');
    const therapistMode = asString(record, 'therapistMode');
    if (therapistMode !== 'auto' && therapistMode !== 'specified')
        throw new RemoteContractError('bookingDraft.therapistMode 不受支持');
    const flow = asOptionalString(record, 'flow');
    if (flow !== undefined && flow !== 'create' && flow !== 'reschedule')
        throw new RemoteContractError('bookingDraft.flow 不受支持');
    return {
        storeId: asString(record, 'storeId'), serviceId: asString(record, 'serviceId'), appointmentDate: asString(record, 'appointmentDate'),
        therapistMode, therapistId: asOptionalString(record, 'therapistId'), slotId: asOptionalString(record, 'slotId'),
        guestCount: asNumber(record, 'guestCount'), contact: asString(record, 'contact'), remark: asString(record, 'remark'),
        benefitSelection: asString(record, 'benefitSelection'), flow, sourceBookingId: asOptionalString(record, 'sourceBookingId')
    };
};
const mapBookingSuccess = (value) => {
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
const mapProfile = (value) => {
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
const mapBookingDraftPayload = (value) => {
    const record = requireRecord(value, 'bookingDraftPayload');
    return { sourceBookingId: asString(record, 'sourceBookingId'), draft: mapBookingDraft(record.draft) };
};
const buildTherapistRequest = (draft) => {
    if (draft.therapistMode === 'auto')
        return {};
    return { therapistId: requireId(draft.therapistId, '技师') };
};
/** Builds scheduler input without silently substituting an unrelated technician. */
const buildTimeSlotQuery = (draft) => ({
    storeId: requireId(draft.storeId, '门店'), serviceId: requireId(draft.serviceId, '服务项目'),
    date: requireId(draft.appointmentDate, '预约日期'), ...buildTherapistRequest(draft)
});
const getSelectedStartTime = async (draft) => {
    const slots = await exports.remoteService.getTimeSlots(draft);
    const slot = slots.find((item) => item.id === draft.slotId || item.startAt === draft.slotId);
    if (!slot || slot.status === 'full')
        throw new Error('所选时间段已失效，请重新选择');
    return slot.startAt;
};
const currentMobile = () => {
    if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function')
        return '';
    const session = wx.getStorageSync(config_1.AUTH_SESSION_STORAGE_KEY);
    return session?.principal?.mobile || session?.user?.mobile || '';
};
exports.remoteService = {
    async getHome() {
        const [stores, services, therapists, copy] = await Promise.all([this.getStores(), this.getServices(), this.getTherapists(''), getCatalogSection('homeCopy')]);
        return { frequentStores: stores.filter((store) => store.isFrequent), nearbyStores: stores.filter((store) => !store.isFrequent), featuredServices: services, featuredTherapists: therapists.slice(0, 2), copy };
    },
    async getStores() { return requireArray(await (0, http_1.request)('/stores'), 'stores').map(mapStore); },
    async getServices() { return requireArray(await (0, http_1.request)('/services'), 'services').map(mapService); },
    async getStore(id) { return mapStore(await (0, http_1.request)(`/stores/${requireId(id, '门店')}`)); },
    async getService(id) { return mapService(await (0, http_1.request)(`/services/${requireId(id, '服务项目')}`)); },
    async getTherapists(serviceId) {
        return requireArray(await (0, http_1.request)('/therapists', { query: serviceId ? { serviceId } : undefined }), 'therapists').map(mapTherapist);
    },
    async getTimeSlots(draft) {
        if (!draft)
            throw new Error('缺少预约信息，无法查询可约时间');
        return requireArray(await (0, http_1.request)('/time-slots', { query: buildTimeSlotQuery(draft) }), 'timeSlots').map(mapTimeSlot);
    },
    async getBookingConfirmation(draft) {
        const startTime = await getSelectedStartTime(draft);
        return mapBookingConfirmation(await (0, http_1.request)('/bookings/confirmation', {
            method: 'POST', data: {
                storeId: requireId(draft.storeId, '门店'), serviceId: requireId(draft.serviceId, '服务项目'), ...buildTherapistRequest(draft),
                date: requireId(draft.appointmentDate, '预约日期'), startTime, guestCount: draft.guestCount,
                customerName: draft.contact, remark: draft.remark, couponId: draft.benefitSelection
            }
        }));
    },
    getOrderDictionaries: () => getCatalogSection('orderDictionaries'),
    getReviewDictionaries: () => getCatalogSection('reviewDictionaries'),
    getServiceDictionaries: () => getCatalogSection('serviceDictionaries'),
    getStoreDetailDictionaries: () => getCatalogSection('storeDetailDictionaries'),
    getTimeDictionaries: () => getCatalogSection('timeDictionaries'),
    getTherapistDictionaries: () => getCatalogSection('therapistDictionaries'),
    getSuccessCopy: () => getCatalogSection('successCopy'),
    getLoginCopy: () => getCatalogSection('loginCopy'),
    sendLoginCode: (mobile) => (0, http_1.request)('/auth/send-code', { method: 'POST', data: { clientType: 'MINI_PROGRAM', mobile } }),
    login: (mobile, code) => (0, http_1.request)('/auth/login', { method: 'POST', data: { clientType: 'MINI_PROGRAM', grantType: 'SMS_CODE', identifier: mobile, credential: code } }),
    async getBookingSuccess(id) { return mapBookingSuccess(await (0, http_1.request)(`/bookings/${requireId(id, '预约')}/success`)); },
    async getBookingRebookDraft(id) { return mapBookingDraftPayload(await (0, http_1.request)(`/bookings/${requireId(id, '预约')}/rebook-draft`)); },
    async getBookingRescheduleDraft(id) { return mapBookingDraftPayload(await (0, http_1.request)(`/bookings/${requireId(id, '预约')}/reschedule-draft`)); },
    async getProfile() { return mapProfile(await (0, http_1.request)('/member/profile')); },
    getCheckinDictionaries: () => getCatalogSection('checkinDictionaries'),
    getActionFeedbackDictionaries: () => getCatalogSection('actionFeedbackDictionaries'),
    getPageStateDictionaries: () => getCatalogSection('pageStateDictionaries'),
    async createBooking(draft, requestId) {
        const mobile = currentMobile();
        if (!mobile)
            throw new Error('登录状态已失效，请重新登录');
        const startTime = await getSelectedStartTime(draft);
        return mapBooking(await (0, http_1.request)('/bookings', {
            method: 'POST', data: {
                storeId: requireId(draft.storeId, '门店'), serviceId: requireId(draft.serviceId, '服务项目'), ...buildTherapistRequest(draft),
                date: requireId(draft.appointmentDate, '预约日期'), startTime, customerName: draft.contact, mobile,
                couponId: draft.benefitSelection, requestId
            }
        }));
    },
    async rescheduleBooking(draft, requestId) {
        const startTime = await getSelectedStartTime(draft);
        return mapBooking(await (0, http_1.request)(`/bookings/${requireId(draft.sourceBookingId, '原预约')}/reschedule`, {
            method: 'POST', data: { date: requireId(draft.appointmentDate, '预约日期'), startTime, ...buildTherapistRequest(draft), requestId }
        }));
    },
    async getBookings() { return requireArray(await (0, http_1.request)('/bookings'), 'bookings').map(mapBooking); },
    async getBooking(id) { return mapBooking(await (0, http_1.request)(`/bookings/${requireId(id, '预约')}`)); },
    async getStoreReviews(storeId, serviceId, page = 1, pageSize = 2) {
        return mapReviewPage(await (0, http_1.request)('/reviews', { query: { storeId: requireId(storeId, '门店'), serviceId, page: String(page), pageSize: String(pageSize) } }), page, pageSize);
    },
    async checkinBooking(id, requestId) { return mapBooking(await (0, http_1.request)(`/bookings/${requireId(id, '预约')}/checkin`, { method: 'POST', data: { requestId } })); },
    async refreshBookingCode(id, requestId) { return mapBooking(await (0, http_1.request)(`/bookings/${requireId(id, '预约')}/verification-code/refresh`, { method: 'POST', data: { requestId } })); },
    async cancelBooking(id, requestId) { return mapBooking(await (0, http_1.request)(`/bookings/${requireId(id, '预约')}/cancel`, { method: 'POST', data: { requestId } })); },
    async prepareBookingPayment(id, requestId) { return mapPaymentPayload(await (0, http_1.request)(`/bookings/${requireId(id, '预约')}/payment`, { method: 'POST', data: { requestId } })); },
    async payBooking(id, requestId) { return mapBooking(await (0, http_1.request)(`/bookings/${requireId(id, '预约')}/pay`, { method: 'POST', data: { requestId } })); },
    async getFavorite(resourceType, resourceId) {
        return (0, http_1.request)(`/member/favorites/${resourceType}/${requireId(resourceId, '收藏资源')}`);
    },
    async setFavorite(resourceType, resourceId, favorite) {
        return (0, http_1.request)(`/member/favorites/${resourceType}/${requireId(resourceId, '收藏资源')}`, {
            method: favorite ? 'PUT' : 'DELETE'
        });
    },
    async uploadReviewImage(tempFilePath, requestId) {
        const fileName = requireId(tempFilePath.split('/').pop(), '图片文件名');
        return { imageUrl: asString(requireRecord(await (0, http_1.upload)('/reviews/images', tempFilePath, { fileName, requestId }), 'reviewImage'), 'imageUrl') };
    },
    async submitReview(review, requestId) {
        await (0, http_1.request)('/reviews', {
            method: 'POST', data: {
                bookingId: review.bookingId, storeRating: review.environmentRating, therapistRating: review.therapistRating,
                serviceRating: review.serviceRating, tags: review.tags, content: review.content, anonymous: review.anonymous,
                imageUrls: review.imageUrls, requestId
            }
        });
        return this.getBooking(review.bookingId);
    }
};
