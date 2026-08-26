# 栖愈管理后台 MVP

基于 React、TypeScript、Umi 4 与 Ant Design 5 的总部运营后台。当前使用本地 Mock Service，不依赖后端环境；业务路由需要登录态，未登录访问会回到 `/login`。

## 页面

- `/login`：管理员登录占位页，任意非空手机号和密码可进入。
- `/dashboard`：总部运营看板、门店排名、经营趋势、异常事项和技师利用率。
- `/appointments`：预约筛选、创建、编辑、签到与取消操作。
- `/resources`：技师周排班、请假提醒及房间资源状态。

## 启动

```bash
npm install
npm run dev
```

默认开发端口为 `8000`。构建验证：`npm run build`；登录态检查：`npm run smoke:auth-guard`；履约审计和批量签到检查：`npm run smoke:fulfillment`。

Mock 登录会话包含角色、门店范围和过期时间。演示角色为总部运营管理员和静安寺店店长，真实认证服务接入时替换 `src/services/admin-auth.ts` 的会话来源即可。

后台服务模式默认是 Mock。可在浏览器控制台设置 `localStorage.setItem('qiyu-admin-api-mode', 'dev')` 后刷新，使总部看板读取 `/api/v1/admin/dashboard`；清除该值可回到 Mock。

总部看板和排班与资源页已支持 Remote 读取；切换 dev 模式前需先启动 `qiyu-server`，真机或非本机环境需要使用可访问的 HTTPS API 地址。

Mock 数据位于 `src/mock/data.ts`；未来接入 `qiyu-server` 时，只需替换 `src/services/mock.ts` 的数据实现，页面调用无需变更。
