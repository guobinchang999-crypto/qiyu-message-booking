import { defineConfig } from '@umijs/max';

export default defineConfig({
  npmClient: 'npm',
  title: '栖愈运营中心',
  favicons: [],
  routes: [
    { path: '/login', component: 'Login', layout: false },
    {
      path: '/',
      component: '@/layouts/AdminLayout',
      routes: [
        { path: '/', redirect: '/dashboard' },
        { path: '/dashboard', component: 'Dashboard' },
        { path: '/stores', component: 'Stores' },
        { path: '/appointments', component: 'Appointments' },
        { path: '/checkin', component: 'Checkin' },
        { path: '/service-orders', component: 'ServiceOrders' },
        { path: '/schedule', component: 'Schedule' },
        { path: '/therapists', component: 'Therapists' },
        { path: '/services', component: 'Services' },
        { path: '/rooms', component: 'Rooms' },
        { path: '/customers', component: 'Customers' },
        { path: '/members', component: 'Members' },
        { path: '/coupons', component: 'Coupons' },
        { path: '/reports', component: 'Reports' },
        { path: '/resources', redirect: '/schedule' }
      ]
    }
  ]
});
