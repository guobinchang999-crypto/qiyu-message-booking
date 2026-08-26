export type TabBarItem = {
  text: string;
  icon: string;
  path: string;
};

export const pageRoutes = {
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

const withId = (route: string, id: string): string => `${route}?id=${id}`;

export const pageUrls = {
  storeDetail: (id: string) => withId(pageRoutes.storeDetail, id),
  serviceDetail: (id: string) => withId(pageRoutes.serviceDetail, id),
  success: (id: string) => withId(pageRoutes.success, id),
  bookingDetail: (id: string) => withId(pageRoutes.bookingDetail, id),
  checkin: (id: string) => withId(pageRoutes.checkin, id),
  review: (id: string) => withId(pageRoutes.review, id)
};

export const tabBarItems: TabBarItem[] = [
  { text: '首页', icon: '⌂', path: pageRoutes.home },
  { text: '预约', icon: '◷', path: pageRoutes.services },
  { text: '订单', icon: '□', path: pageRoutes.orders },
  { text: '我的', icon: '◉', path: pageRoutes.profile }
];
