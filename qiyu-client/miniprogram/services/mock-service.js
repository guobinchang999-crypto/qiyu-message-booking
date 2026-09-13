"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockService = void 0;
const fixtures_1 = require("../mock/fixtures");
const delay = (data) => new Promise((resolve) => setTimeout(() => resolve(data), 280));
const nextBookingCode = () => `QY${Date.now().toString().slice(-9)}`;
const buildQrImageUrl = (code) => `https://mock-cdn.qiyu.local/checkin/${code}.png`;
const buildPaymentNo = (bookingId) => `PAY-${bookingId}-${Date.now()}`;
let bookings = [{ ...fixtures_1.pendingPaymentBooking }, { ...fixtures_1.initialBooking }, { ...fixtures_1.completedBooking }, { ...fixtures_1.cancelledBooking }];
const favoriteKeys = new Set();
const favoritePayload = (resourceType, resourceId) => ({
    resourceType, resourceId, favorite: favoriteKeys.has(`${resourceType}:${resourceId}`)
});
let storeReviews = [
    { id: 'review-jingan-1', storeId: 'jingan', serviceId: 'neck', userName: '林女士', rating: 5, content: '环境安静，技师会提前确认肩颈重点，结束后放松感很明显。', tags: ['环境安静', '手法专业'], createdAt: '2026-08-01' },
    { id: 'review-jingan-2', storeId: 'jingan', serviceId: 'neck', userName: '周先生', rating: 5, content: '到店接待很准时，房间私密性好，适合下班后短暂恢复。', tags: ['准时接待', '独立房间'], createdAt: '2026-07-29' },
    { id: 'review-jingan-3', storeId: 'jingan', serviceId: 'neck', userName: '许女士', rating: 5, content: '肩颈热敷时间足，按完之后头颈轻松很多。', tags: ['热敷舒适', '肩颈舒缓'], createdAt: '2026-07-26' },
    { id: 'review-jingan-4', storeId: 'jingan', serviceId: 'spa', userName: '沈女士', rating: 5, content: '香氛不刺鼻，服务节奏很放松。', tags: ['芳香疗愈', '环境安静'], createdAt: '2026-07-24' },
    { id: 'review-jingan-5', storeId: 'jingan', serviceId: 'neck', userName: '陆先生', rating: 4.8, content: '技师会说明发力点，整体专业稳定。', tags: ['手法专业', '沟通清楚'], createdAt: '2026-07-21' },
    { id: 'review-xujiahui-1', storeId: 'xujiahui', serviceId: 'chinese', userName: '陈女士', rating: 5, content: '茶歇区舒服，整体节奏不催促，体验稳定。', tags: ['茶歇区', '服务细致'], createdAt: '2026-07-25' },
    { id: 'review-lujiazui-1', storeId: 'lujiazui', serviceId: 'neck', userName: '顾先生', rating: 5, content: '位置方便，午休时间过来做肩颈很合适。', tags: ['位置方便', '肩颈舒缓'], createdAt: '2026-07-22' }
];
const resolveDraft = (draft) => {
    const store = fixtures_1.stores.find((item) => item.id === draft.storeId) || fixtures_1.stores[0];
    const service = fixtures_1.services.find((item) => item.id === draft.serviceId) || fixtures_1.services[0];
    const therapist = draft.therapistMode === 'auto' ? undefined : fixtures_1.therapists.find((item) => item.id === draft.therapistId) || fixtures_1.therapists[0];
    const slot = fixtures_1.timeSlots.find((item) => item.id === draft.slotId) || fixtures_1.timeSlots[2];
    return { store, service, therapist, slot };
};
const buildPayment = (draft) => {
    const { service, therapist } = resolveDraft(draft);
    const guestCount = Math.max(1, draft.guestCount || 1);
    const therapistFee = therapist ? therapist.specifyFee : 0;
    const discountAmount = draft.benefitSelection ? 20 : 0;
    const totalAmount = service.memberPrice * guestCount + therapistFee * guestCount - discountAmount;
    const depositDue = Math.min(Math.max(totalAmount, 0), 50 * guestCount);
    return { itemAmount: service.memberPrice * guestCount, therapistFee: therapistFee * guestCount, discountAmount, balanceDeduction: 0, depositDue, paidAmount: depositDue };
};
const buildConfirmation = (draft) => {
    const { store, service, therapist, slot } = resolveDraft(draft);
    const payment = buildPayment(draft);
    return {
        pageTitle: '确认预约',
        editActions: {
            store: '修改门店',
            service: '修改项目',
            therapist: '修改技师',
            time: '修改时间'
        },
        cardMeta: {
            durationUnit: '分钟',
            servedPrefix: '已服务',
            servedSuffix: '次'
        },
        store,
        service,
        therapist,
        therapistDisplayName: therapist?.name || '系统自动分配技师',
        scheduledAt: `${draft.appointmentDate} ${slot.startAt}`,
        payment,
        formCopy: {
            guestCountLabel: '服务人数',
            contactLabel: '预约人',
            contactPlaceholder: '请输入姓名',
            remarkLabel: '备注',
            remarkPlaceholder: '选填',
            contactRequiredMessage: '请填写预约人姓名',
            submitFallbackText: '确认预约'
        },
        benefitTitle: '会员权益 · 全门店通用',
        benefitSelectionText: `${draft.benefitSelection} ›`,
        paymentTitle: '费用明细',
        paymentLines: [
            { key: 'item', label: '服务项目', amountText: `¥${payment.itemAmount}` },
            { key: 'therapist', label: '指定技师', amountText: `¥${payment.therapistFee}` },
            { key: 'discount', label: '优惠', amountText: `-¥${payment.discountAmount}`, tone: 'discount' }
        ],
        totalLabel: '应付订金',
        agreementText: '我已阅读并同意取消预约规则',
        agreementRequiredMessage: '请先阅读并同意取消预约规则',
        depositButtonText: `确认并支付订金 ¥${payment.depositDue}`
    };
};
const buildRebookDraft = (booking) => ({
    sourceBookingId: booking.id,
    draft: {
        storeId: booking.store.id,
        serviceId: booking.service.id,
        appointmentDate: booking.scheduledAt.slice(0, 10),
        therapistMode: 'auto',
        therapistId: undefined,
        slotId: undefined,
        guestCount: 1,
        contact: booking.contact.split(' ')[0] || '',
        remark: '',
        benefitSelection: '',
        flow: 'create',
        sourceBookingId: undefined
    }
});
const paginate = (items, page = 1, pageSize = 2) => {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const start = (safePage - 1) * safePageSize;
    const pageItems = items.slice(start, start + safePageSize);
    return { items: pageItems, page: safePage, pageSize: safePageSize, total: items.length, hasMore: start + pageItems.length < items.length };
};
const buildRescheduleDraft = (booking) => ({
    sourceBookingId: booking.id,
    draft: {
        storeId: booking.store.id,
        serviceId: booking.service.id,
        appointmentDate: booking.scheduledAt.slice(0, 10),
        therapistMode: booking.therapist.specifyFee > 0 ? 'specified' : 'auto',
        therapistId: booking.therapist.specifyFee > 0 ? booking.therapist.id : undefined,
        slotId: undefined,
        guestCount: 1,
        contact: booking.contact.split(' ')[0] || '',
        remark: '',
        benefitSelection: '',
        flow: 'reschedule',
        sourceBookingId: booking.id
    }
});
const homeCopy = {
    locationText: '上海 · 静安',
    heroTitle: '今天，想怎样被好好照顾？',
    searchPlaceholder: '⌕ 搜索服务项目、门店或技师',
    quickActions: [
        { key: 'booking', title: '预约', subtitle: '快速预约' },
        { key: 'orders', title: '订单', subtitle: '查看预约' },
        { key: 'benefits', title: '券', subtitle: '优惠权益' },
        { key: 'support', title: '◉', subtitle: '联系客服' }
    ],
    frequentTitle: '我的常去门店',
    frequentMoreText: '查看全部 ›',
    nearbyTitle: '附近门店',
    nearbySortText: '按距离排序',
    featuredServiceTitle: '精选服务',
    featuredServiceMoreText: '查看全部 ›',
    memberTitle: '会员权益 · 全门店通用',
    memberSummary: '余额 ¥680 · 2 张优惠券',
    memberActionText: '查看权益 ›',
    storeCardMeta: {
        ratingUnit: '分',
        nextAvailablePrefix: '最近可约'
    },
    serviceCardMeta: {
        durationUnit: '分钟',
        servedPrefix: '已服务',
        servedSuffix: '次'
    }
};
const orderDictionaries = {
    pageTitle: '我的订单',
    detailTitle: '预约详情',
    statusLabel: {
        PENDING_PAYMENT: '待支付',
        BOOKED: '已预约',
        CHECKED_IN: '已签到',
        WAITING_SERVICE: '待服务',
        IN_SERVICE: '服务中',
        PENDING_SETTLEMENT: '待结算',
        COMPLETED: '已完成',
        CANCELLED: '已取消'
    },
    actionLabel: {
        pay: '支付订金',
        cancel: '取消',
        reschedule: '改期',
        contact: '联系门店',
        show_code: '签到码',
        refresh_code: '刷新码',
        rebook: '再次预约',
        review: '去评价',
        view_detail: '查看详情'
    },
    tabs: [
        { key: 'all', label: '全部' },
        { key: 'pending_payment', label: '待支付', statuses: ['PENDING_PAYMENT'] },
        { key: 'arriving', label: '待到店', statuses: ['BOOKED', 'CHECKED_IN'] },
        { key: 'in_service', label: '服务中', statuses: ['WAITING_SERVICE', 'IN_SERVICE', 'PENDING_SETTLEMENT'] },
        { key: 'completed', label: '已完成', statuses: ['COMPLETED'] },
        { key: 'cancelled', label: '已取消', statuses: ['CANCELLED'] }
    ],
    detailSteps: ['已预约', '待到店', '服务中', '已完成'],
    codeTitle: '栖愈\n预约码',
    codeHint: '请向前台出示二维码或数字码',
    codeExtraHint: '请在到店当日出示，过期后可刷新预约详情。',
    detailFields: {
        service: '服务项目',
        therapist: '技师',
        scheduledAt: '预约时间',
        contact: '预约人'
    },
    paymentTitle: '支付信息',
    paymentFields: {
        item: '项目金额',
        therapist: '指定技师',
        discount: '优惠抵扣',
        paid: '已支付'
    },
    actionSectionTitle: '可用操作',
    checkinButtonText: '到店签到',
    cancelModalTitle: '取消预约',
    cancelModalContent: '确认取消该预约？取消后将释放当前时间。',
    cancelModalConfirmText: '取消预约',
    cancelSuccessToastText: '预约已取消',
    paySuccessToastText: '订金支付成功',
    payFailureToastText: '支付失败，请稍后重试',
    cardMeta: {
        paidPrefix: '实付'
    },
    serviceCardMeta: {
        durationUnit: '分钟',
        servedPrefix: '已服务',
        servedSuffix: '次'
    },
    storeCardMeta: {
        ratingUnit: '分',
        nextAvailablePrefix: '最近可约'
    }
};
const reviewDictionaries = {
    tags: ['手法专业', '环境安静', '准时接待', '放松有效'],
    pageTitle: '服务评价',
    ratingFields: {
        therapist: '技师手法',
        environment: '门店环境',
        service: '服务体验'
    },
    contentPlaceholder: '写下这次服务体验，可帮助我们持续改进',
    imageSectionTitle: '服务照片',
    imageHintText: '最多上传 3 张，支持预览、删除和失败重试',
    addImageText: '添加照片',
    uploadingImageText: '上传中',
    uploadFailedText: '上传失败',
    retryUploadText: '重试',
    anonymousText: '匿名评价',
    agreementText: '我确认评价内容真实',
    submitButtonText: '提交评价',
    submittedButtonText: '已提交',
    submittingToastText: '正在提交',
    submittedToastText: '评价已提交',
    maxTagValidationText: '满意标签最多选择 3 个',
    maxTagToastText: '最多选择 3 个标签',
    agreementRequiredMessage: '请先确认评价规则',
    contentMinLengthMessage: '评价内容至少 5 个字'
};
const serviceDictionaries = {
    pageTitle: '服务项目',
    allCategory: '全部',
    categories: ['全部', ...Array.from(new Set(fixtures_1.services.map((service) => service.category)))],
    storeSwitchLabel: '静安寺店 ›',
    searchPlaceholder: '搜索肩颈、推拿、SPA',
    clearSearchText: '清除',
    sortOptions: [
        { key: 'recommended', label: '推荐优先' },
        { key: 'sales', label: '销量优先' },
        { key: 'price', label: '会员价优先' }
    ],
    cardMeta: {
        durationUnit: '分钟',
        servedPrefix: '已服务',
        servedSuffix: '次'
    },
    storeCardMeta: {
        ratingUnit: '分',
        nextAvailablePrefix: '最近可约'
    },
    bannerText: '会员权益 · 全门店通用 · 精选项目今日可约',
    detailTitle: '服务详情',
    loadingTitle: '正在加载服务详情',
    loadingDescription: '请稍候',
    errorTitle: '服务详情加载失败',
    errorMessage: '服务详情加载失败，请稍后重试',
    retryText: '重试',
    loadMoreText: '加载更多评价',
    favoriteText: '收藏',
    favoritedText: '已收藏',
    shareText: '分享',
    memberPriceLabel: '会员价',
    introTitle: '服务介绍',
    processTitle: '服务流程',
    suitableTitle: '适合人群',
    noticeTitle: '注意事项',
    noticeText: '请提前 10 分钟到店；如需改期，请尽量在预约前联系门店。',
    recommendedTherapistTitle: '推荐技师',
    nextAvailablePrefix: '最近可约',
    reviewTitle: '用户评价',
    reviewSummarySuffix: '次服务后持续收集反馈，以下为近期真实体验摘要。',
    primaryButtonText: '选择技师',
    favoriteAddedToast: '已加入收藏',
    favoriteRemovedToast: '已取消收藏'
};
const storeDetailDictionaries = {
    actions: [
        { key: 'navigation', label: '导航' },
        { key: 'contact', label: '联系门店' },
        { key: 'favorite', label: '收藏' }
    ],
    recommendedServiceTitle: '推荐服务',
    allServiceText: '全部 ›',
    primaryButtonText: '立即预约',
    loadingTitle: '正在加载门店详情',
    loadingDescription: '请稍候',
    errorTitle: '门店详情加载失败',
    errorMessage: '门店详情加载失败，请稍后重试',
    retryText: '重试',
    loadMoreText: '加载更多评价',
    favoriteActiveText: '已收藏',
    favoriteAddedToast: '已收藏门店',
    favoriteRemovedToast: '已取消收藏',
    panels: {
        facilities: '设施服务',
        businessHours: '营业时间',
        notice: '预约须知'
    },
    expandText: '展开',
    collapseText: '收起',
    businessHoursText: '每日 10:00-22:00，最晚可预约 20:00 场次。',
    noticeText: '请提前 10 分钟到店；如需取消或改期，请尽量提前联系门店。',
    tabs: [
        { key: 'services', label: '项目' },
        { key: 'therapists', label: '技师' },
        { key: 'reviews', label: '评价' }
    ],
    reviewTitle: '门店评价',
    reviewSummarySuffix: '分 · 以下为近期到店体验摘要。',
    storeCardMeta: {
        ratingUnit: '分',
        nextAvailablePrefix: '最近可约'
    },
    serviceCardMeta: {
        durationUnit: '分钟',
        servedPrefix: '已服务',
        servedSuffix: '次'
    }
};
const buildDateLabels = () => Array.from({ length: 4 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    const prefix = index === 0 ? '明天' : weekday;
    return `${prefix}\n${date.getMonth() + 1}月${date.getDate()}日`;
});
const buildDateValues = () => Array.from({ length: 4 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
});
const timeDictionaries = {
    dates: buildDateLabels(),
    dateValues: buildDateValues(),
    periods: [{ key: 'MORNING', label: '上午' }, { key: 'AFTERNOON', label: '下午' }, { key: 'EVENING', label: '晚上' }],
    defaultPeriod: 'AFTERNOON',
    statusLabel: {
        available: '可预约',
        limited: '即将约满',
        full: '已约满'
    },
    legend: [
        { status: 'available', label: '可预约' },
        { status: 'limited', label: '即将约满' },
        { status: 'full', label: '已约满' }
    ]
};
const therapistDictionaries = {
    pageTitle: '选择技师',
    modes: [
        { key: 'specified', label: '指定技师' },
        { key: 'auto', label: '系统自动分配' }
    ],
    autoHint: '系统将为你匹配当前最合适的可约技师',
    nextAvailablePrefix: '最近可约',
    specifyFeePrefix: '指定费',
    availableText: '可指定',
    unavailableText: '当前不可约',
    metaCopy: {
        experiencePrefix: '从业',
        experienceSuffix: '年',
        ratingUnit: '分',
        serviceCountPrefix: '服务',
        serviceCountSuffix: '次'
    }
};
const successCopy = {
    title: '预约成功',
    subtitle: '已为你保留安静的放松时光',
    bookingCodePrefix: '预约编号',
    codeHint: '到店后可在预约详情或签到页出示预约码。',
    navigationActionText: '导航',
    contactActionText: '联系门店',
    reminderText: '到店前 30 分钟将再次提醒你，请提前 10 分钟到店。',
    detailButtonText: '查看预约详情',
    homeButtonText: '返回首页'
};
const loginCopy = {
    brandMark: '栖',
    brandName: '栖愈',
    brandSubtitle: '推拿 · SPA',
    welcomeText: '给身体一段安静的时间',
    panelTitle: '欢迎回来',
    phoneLabel: '手机号',
    phonePlaceholder: '请输入手机号',
    codeLabel: '验证码',
    codePlaceholder: '演示验证码 123456',
    sendCodeText: '获取验证码',
    loginButtonText: '登录 / 注册',
    loggingInText: '登录中',
    agreementText: '我已阅读并同意《服务协议》和《隐私政策》',
    wechatEntryText: '微信快捷登录（演示）',
    codeSentToastText: '验证码已发送',
    agreementRequiredToastText: '请先阅读并同意服务协议',
    phoneInvalidMessage: '请输入正确的手机号',
    codeInvalidMessage: '请输入 6 位验证码',
    demoCode: '123456'
};
const profilePayload = {
    user: { name: '林知夏', phone: '138****1288', avatarText: '林', level: '栖愈银卡会员', balanceText: '680.00', couponCount: 2, packageCount: 4 },
    title: '我的',
    settingsIcon: '⚙',
    memberTitle: '会员权益 · 全门店通用',
    memberSubtitle: '每一次停下来，都值得被温柔照顾',
    memberStats: ['余额 ¥680.00', '套餐 4 次', '优惠券 2 张'],
    shortcuts: [
        { key: 'orders', title: '预约', subtitle: '我的预约' },
        { key: 'coupons', title: '券', subtitle: '优惠券' },
        { key: 'packages', title: '卡', subtitle: '套餐卡' },
        { key: 'favorites', title: '♡', subtitle: '收藏' }
    ],
    recentBookingTitle: '最近预约',
    recentBookingActionText: '查看详情 ›',
    menuItems: [
        { key: 'orders', label: '最近预约', valueText: '查看全部 ›' },
        { key: 'contacts', label: '常用联系人', valueText: '›' },
        { key: 'support', label: '联系客服', valueText: '›' },
        { key: 'settings', label: '设置', valueText: '›' }
    ],
    logoutText: '退出登录',
    logoutModalTitle: '退出登录',
    logoutModalContent: '退出后将回到登录页，当前预约记录不会被删除。',
    logoutConfirmText: '退出',
    logoutCancelText: '取消'
};
const checkinDictionaries = {
    title: '到店签到',
    qrTitle: '栖愈\n预约二维码',
    refreshText: '二维码每 5 分钟自动刷新',
    steps: ['预约成功', '到店签到', '等待服务'],
    pendingButtonText: '我已到店',
    checkingButtonText: '签到中',
    checkedButtonText: '已完成签到',
    successToastText: '签到成功，前台将为你安排房间',
    failureToastText: '签到失败，请稍后重试',
    bottomActions: [
        { key: 'navigation', label: '导航到店' },
        { key: 'contact', label: '联系门店' }
    ]
};
const actionFeedbackDictionaries = {
    supportUnavailable: '客服入口将在接入企微后开放',
    genericUnavailable: '该入口暂不可用',
    distanceSorted: '已按距离展示附近门店',
    mapUnavailable: '地图暂不可用，请稍后重试',
    navigationUnavailable: '导航能力将在接入定位后开放',
    contactPlaceholder: '已为你呼出门店联系电话占位',
    shareUnavailable: '分享能力将在小程序环境中接入',
    therapistUnavailable: '该技师当前不可约',
    slotFull: '该时间已约满',
    checkinRepeated: '当前预约无需重复签到',
    codeRefreshed: '签到码已刷新',
    codeRefreshHint: '二维码已刷新，请向前台出示最新页面',
    codeRefreshFailed: '刷新失败，请稍后重试',
    minGuestCount: '至少 1 人',
    maxGuestCount: '最多 4 人',
    cancelUnavailable: '取消失败，请稍后重试'
};
const pageStateDictionaries = {
    home: {
        loadingTitle: '正在加载首页',
        loadingDescription: '为你整理常去门店和附近门店',
        errorTitle: '首页加载失败',
        errorMessage: '首页数据加载失败，请稍后重试',
        retryText: '重试'
    },
    stores: {
        pageTitle: '选择门店',
        searchPlaceholder: '搜索门店或地址',
        businessOnlyText: '营业中',
        sortOptions: [
            { key: 'frequent', label: '常去优先' },
            { key: 'distance', label: '距离优先' },
            { key: 'rating', label: '评分优先' }
        ],
        cardMeta: {
            ratingUnit: '分',
            nextAvailablePrefix: '最近可约'
        },
        mapEntryText: '打开地图选择位置',
        locationReadyText: '定位正常',
        locateActionText: '重新定位',
        locationDeniedWarning: '定位权限未开启，当前按默认城市门店距离展示。',
        locationFailedWarning: '定位暂时失败，可以稍后重试或直接选择门店。',
        loadingTitle: '正在加载门店',
        loadingDescription: '为你整理常去门店和附近门店',
        errorTitle: '门店加载失败',
        errorMessage: '门店加载失败，请稍后重试',
        retryText: '重试',
        emptyTitle: '没有找到匹配门店',
        emptyDescription: '可以更换关键词，或取消营业中筛选后再试'
    },
    services: {
        loadingTitle: '正在加载服务项目',
        loadingDescription: '为你整理全门店通用的可约项目',
        errorTitle: '服务项目加载失败',
        errorMessage: '服务项目加载失败，请稍后重试',
        retryText: '重试',
        emptyTitle: '没有找到匹配项目',
        emptyDescription: '可以更换关键词或切换分类'
    },
    orders: {
        loadingTitle: '正在加载订单',
        loadingDescription: '请稍候',
        errorTitle: '订单加载失败',
        errorMessage: '订单加载失败，请稍后重试',
        retryText: '重试',
        emptyTitle: '暂无对应订单',
        emptyDescription: '切换其他状态，或返回首页预约新的服务'
    },
    confirm: {
        loadingTitle: '正在加载预约信息',
        loadingDescription: '请稍候',
        errorTitle: '预约信息加载失败',
        errorMessage: '预约信息加载失败，请稍后重试',
        retryText: '重试',
        submitErrorTitle: '无法提交预约',
        submitErrorMessage: '预约提交失败，请稍后重试',
        paymentRefreshErrorMessage: '人数变更后费用刷新失败，请重试'
    },
    bookingDetail: {
        loadingTitle: '正在加载预约详情',
        loadingDescription: '请稍候',
        errorTitle: '预约详情加载失败',
        errorMessage: '预约详情加载失败，请稍后重试',
        retryText: '重试'
    },
    therapist: {
        loadingTitle: '正在加载技师',
        loadingDescription: '为你查询当前可约技师',
        errorTitle: '技师加载失败',
        errorMessage: '技师加载失败，请稍后重试',
        retryText: '重试',
        emptyTitle: '暂无可指定技师',
        emptyDescription: '可以切换为系统自动分配',
        unavailableFilterText: '显示全部技师',
        availableOnlyFilterText: '仅看可约技师',
        emptySummaryText: '请选择可指定技师',
        selectedSummaryTitle: '已选技师',
        autoSummaryTitle: '系统自动分配',
        nextButtonText: '下一步'
    },
    time: {
        pageTitle: '选择时间',
        loadingTitle: '正在加载可约时间',
        loadingDescription: '为你查询当前门店排班',
        errorTitle: '时间加载失败',
        errorMessage: '可约时间加载失败，请稍后重试',
        retryText: '重试',
        emptyTitle: '暂无可约时间',
        emptyDescription: '请更换日期或技师后再试',
        noticeText: '温馨提示：请提前 10 分钟到店，迟到可能影响服务时长。',
        emptyActionDateText: '换个日期',
        emptyActionTherapistText: '更换技师',
        selectedSummaryTitle: '已选时间',
        nextButtonText: '下一步',
        emptySlotText: '请选择可预约时间'
    },
    checkin: {
        loadingTitle: '正在加载签到信息',
        loadingDescription: '请稍候',
        errorTitle: '签到信息加载失败',
        errorMessage: '签到信息加载失败，请稍后重试',
        retryText: '重试',
        submitErrorTitle: '签到失败',
        submitErrorMessage: '签到失败，请联系前台或稍后重试',
        refreshCodeText: '刷新签到码'
    },
    review: {
        loadingTitle: '正在加载评价信息',
        loadingDescription: '请稍候',
        errorTitle: '评价信息加载失败',
        errorMessage: '评价信息加载失败，请稍后重试',
        retryText: '重试',
        submitErrorTitle: '评价提交失败',
        submitErrorMessage: '评价提交失败，请稍后重试'
    },
    success: {
        loadingTitle: '正在加载预约结果',
        loadingDescription: '请稍候',
        errorTitle: '预约结果加载失败',
        errorMessage: '预约结果加载失败，请稍后重试',
        retryText: '重试'
    },
    profile: {
        loadingTitle: '正在加载我的页面',
        loadingDescription: '请稍候',
        errorTitle: '我的页面加载失败',
        errorMessage: '我的页面加载失败，请稍后重试',
        retryText: '重试'
    }
};
exports.mockService = {
    getHome: () => delay({ frequentStores: fixtures_1.stores.filter((store) => store.isFrequent), nearbyStores: fixtures_1.stores.filter((store) => !store.isFrequent), featuredServices: fixtures_1.services, featuredTherapists: fixtures_1.therapists.slice(0, 2), copy: homeCopy }),
    getStores: () => delay(fixtures_1.stores),
    getServices: () => delay(fixtures_1.services),
    getStore: (id) => delay(fixtures_1.stores.find((store) => store.id === id) || fixtures_1.stores[0]),
    getService: (id) => delay(fixtures_1.services.find((service) => service.id === id) || fixtures_1.services[0]),
    getTherapists: () => delay(fixtures_1.therapists),
    getTimeSlots: () => delay(fixtures_1.timeSlots),
    getBookingConfirmation: (draft) => delay(buildConfirmation(draft)),
    getOrderDictionaries: () => delay(orderDictionaries),
    getReviewDictionaries: () => delay(reviewDictionaries),
    getServiceDictionaries: () => delay(serviceDictionaries),
    getStoreDetailDictionaries: () => delay(storeDetailDictionaries),
    getTimeDictionaries: () => delay({ ...timeDictionaries, dates: buildDateLabels(), dateValues: buildDateValues() }),
    getTherapistDictionaries: () => delay(therapistDictionaries),
    getSuccessCopy: () => delay(successCopy),
    getLoginCopy: () => delay(loginCopy),
    sendLoginCode: (mobile) => delay({ mobile, requestId: `LOGIN-${Date.now()}`, expiresIn: 60, verificationCode: loginCopy.demoCode }),
    login: (mobile, code) => code === loginCopy.demoCode ? delay({ accessToken: `mock-token-${Date.now()}`, tokenType: 'Bearer', expiresIn: 7200, principal: { userId: 'mock-customer-1', userType: 'CUSTOMER', displayName: '林知夏', avatarText: '林', roles: ['CUSTOMER'], permissions: ['booking:read', 'booking:create', 'booking:update', 'review:create'], storeScopes: [{ scopeType: 'SELF', storeIds: [] }] } }) : Promise.reject(new Error('验证码不正确')),
    getBookingSuccess: (id) => delay({ booking: bookings.find((booking) => booking.id === id) || bookings[0], copy: successCopy }),
    getBookingRebookDraft: (id) => delay(buildRebookDraft(bookings.find((booking) => booking.id === id) || bookings[0])),
    getBookingRescheduleDraft: (id) => delay(buildRescheduleDraft(bookings.find((booking) => booking.id === id) || bookings[0])),
    getProfile: () => delay(profilePayload),
    getCheckinDictionaries: () => delay(checkinDictionaries),
    getActionFeedbackDictionaries: () => delay(actionFeedbackDictionaries),
    getPageStateDictionaries: () => delay(pageStateDictionaries),
    createBooking: (draft) => { const confirmation = buildConfirmation(draft); const code = nextBookingCode(); const booking = { ...fixtures_1.initialBooking, id: `booking-${Date.now()}`, code, qrImageUrl: buildQrImageUrl(code), store: confirmation.store, service: confirmation.service, therapist: confirmation.therapist || fixtures_1.therapists[0], scheduledAt: confirmation.scheduledAt, contact: `${draft.contact} 138****1288`, payment: confirmation.payment }; bookings = [booking, ...bookings]; return delay(booking); },
    rescheduleBooking: (draft) => { const confirmation = buildConfirmation(draft); bookings = bookings.map((booking) => booking.id === draft.sourceBookingId ? { ...booking, store: confirmation.store, service: confirmation.service, therapist: confirmation.therapist || booking.therapist, scheduledAt: confirmation.scheduledAt } : booking); return delay(bookings.find((booking) => booking.id === draft.sourceBookingId) || bookings[0]); },
    getBookings: () => delay(bookings),
    getBooking: (id) => delay(bookings.find((booking) => booking.id === id) || bookings[0]),
    getStoreReviews: (storeId, serviceId, page, pageSize) => delay(paginate(storeReviews.filter((review) => review.storeId === storeId && (!serviceId || review.serviceId === serviceId)), page, pageSize)),
    checkinBooking: (id) => { bookings = bookings.map((booking) => booking.id === id ? { ...booking, status: 'CHECKED_IN', availableActions: ['contact', 'view_detail'] } : booking); return delay(bookings.find((booking) => booking.id === id) || bookings[0]); },
    refreshBookingCode: (id) => { bookings = bookings.map((booking) => { if (booking.id !== id)
        return booking; const code = nextBookingCode(); return { ...booking, code, qrImageUrl: buildQrImageUrl(code) }; }); return delay(bookings.find((booking) => booking.id === id) || bookings[0]); },
    cancelBooking: (id) => { bookings = bookings.map((booking) => booking.id === id ? { ...booking, status: 'CANCELLED', availableActions: ['rebook', 'view_detail'] } : booking); return delay(bookings.find((booking) => booking.id === id) || bookings[0]); },
    prepareBookingPayment: (id) => { const booking = bookings.find((item) => item.id === id) || bookings[0]; return delay({ bookingId: id, amount: booking.payment.depositDue, paymentNo: buildPaymentNo(id), parameters: { timeStamp: String(Math.floor(Date.now() / 1000)), nonceStr: `mock-${Date.now()}`, package: `prepay_id=mock-${id}`, signType: 'RSA', paySign: 'mock-signature' } }); },
    payBooking: (id) => { bookings = bookings.map((booking) => booking.id === id ? { ...booking, status: 'BOOKED', payment: { ...booking.payment, paidAmount: booking.payment.depositDue }, availableActions: ['show_code', 'refresh_code', 'reschedule', 'contact', 'view_detail'] } : booking); return delay(bookings.find((booking) => booking.id === id) || bookings[0]); },
    getFavorite: (resourceType, resourceId) => delay(favoritePayload(resourceType, resourceId)),
    setFavorite: (resourceType, resourceId, favorite) => {
        const key = `${resourceType}:${resourceId}`;
        if (favorite)
            favoriteKeys.add(key);
        else
            favoriteKeys.delete(key);
        return delay(favoritePayload(resourceType, resourceId));
    },
    uploadReviewImage: (tempFilePath) => tempFilePath.includes('fail-upload') ? Promise.reject(new Error('review image upload failed')) : delay({ imageUrl: tempFilePath }),
    submitReview: (request) => {
        const booking = bookings.find((item) => item.id === request.bookingId) || bookings[0];
        storeReviews = [{
                id: `review-${Date.now()}`,
                storeId: booking.store.id,
                serviceId: booking.service.id,
                userName: request.anonymous ? '匿名用户' : booking.contact.split(' ')[0] || '用户',
                rating: request.serviceRating,
                content: request.content,
                tags: request.tags,
                createdAt: new Date().toISOString().slice(0, 10)
            }, ...storeReviews];
        bookings = bookings.map((item) => item.id === request.bookingId ? { ...item, availableActions: item.availableActions.filter((action) => action !== 'review') } : item);
        return delay(bookings.find((item) => item.id === request.bookingId) || bookings[0]);
    }
};
