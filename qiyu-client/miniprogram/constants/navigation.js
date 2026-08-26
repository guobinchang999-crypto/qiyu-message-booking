"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabBarItems = exports.pageUrls = exports.pageRoutes = void 0;
exports.pageRoutes = {
    login: '/pages/login/index',
    home: '/pages/home/index',
    stores: '/pages/stores/index',
    storeDetail: '/pages/store-detail/index',
    services: '/pages/services/index',
    serviceDetail: '/pages/service-detail/index',
    therapist: '/pages/therapist/index',
    time: '/pages/time/index',
    confirm: '/pages/confirm/index',
    success: '/pages/success/index',
    orders: '/pages/orders/index',
    bookingDetail: '/pages/booking-detail/index',
    checkin: '/pages/checkin/index',
    review: '/pages/review/index',
    profile: '/pages/profile/index'
};
const withId = (route, id) => `${route}?id=${id}`;
exports.pageUrls = {
    storeDetail: (id) => withId(exports.pageRoutes.storeDetail, id),
    serviceDetail: (id) => withId(exports.pageRoutes.serviceDetail, id),
    success: (id) => withId(exports.pageRoutes.success, id),
    bookingDetail: (id) => withId(exports.pageRoutes.bookingDetail, id),
    checkin: (id) => withId(exports.pageRoutes.checkin, id),
    review: (id) => withId(exports.pageRoutes.review, id)
};
exports.tabBarItems = [
    { text: '首页', icon: '⌂', path: exports.pageRoutes.home },
    { text: '预约', icon: '◷', path: exports.pageRoutes.services },
    { text: '订单', icon: '□', path: exports.pageRoutes.orders },
    { text: '我的', icon: '◉', path: exports.pageRoutes.profile }
];
