import { defineConfig } from '@umijs/max';

export default defineConfig({
  npmClient: 'npm',
  title: '栖愈运营中心',
  favicons: [],
  initialState: {},
  layout: {},
  model: {},
  access: {},
  routes: [
    { path: '/login', name: '登录', component: './Login', layout: false },
    {
      path: '/',
      component: '@/wrappers/auth',
      routes: [
        { path: '/', redirect: '/dashboard' },
        { path: '/dashboard', name: '总部运营看板', component: './Dashboard' },
        { path: '/stores', name: '门店管理', component: './Stores' },
        { path: '/appointments', name: '预约管理', component: './Appointments' },
        { path: '/checkin', name: '到店核销', component: './Checkin' },
        { path: '/service-orders', name: '服务订单', component: './ServiceOrders' },
        { path: '/schedule', name: '排班管理', component: './Schedule' },
        { path: '/therapists', name: '技师管理', component: './Therapists' },
        { path: '/services', name: '服务项目', component: './Services' },
        { path: '/rooms', name: '房间管理', component: './Rooms' },
        { path: '/customers', name: '客户管理', component: './Customers' },
        { path: '/members', name: '会员管理', component: './Members' },
        { path: '/coupons', name: '优惠券', component: './Coupons' },
        { path: '/reports', name: '经营报表', component: './Reports' },
        { path: '/system/organizations', name: '组织与部门', component: './System/Organizations' },
        { path: '/system/users', name: '系统用户', component: './System/Users' },
        { path: '/system/roles', name: '角色与权限', component: './System/Roles' },
        { path: '/system/menus', name: '菜单管理', component: './System/Menus' },
        { path: '/system/dictionaries', name: '数据字典', component: './System/Dictionaries' },
        { path: '/system/audit-logs', name: '审计日志', component: './System/AuditLogs' },
        { path: '/resources', redirect: '/schedule' }
      ]
    }
  ]
});
