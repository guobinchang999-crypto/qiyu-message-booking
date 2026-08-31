# 栖愈管理后台 MVP

基于 React、TypeScript、Umi 4 与 Ant Design 5 的总部运营后台。所有业务页面读取 `qiyu-server` 真实接口；业务路由需要登录态，未登录访问会回到 `/login`。

## 页面

- `/login`：后台账号密码登录。
- `/dashboard`：总部运营看板、门店排名、经营趋势、异常事项和技师利用率。
- `/appointments`：预约筛选、创建、编辑、签到与取消操作。
- `/resources`：技师周排班、请假提醒及房间资源状态。

## 启动

```bash
npm install
npm run dev
```

默认开发端口为 `8000`。构建验证：`npm run build`；登录态检查：`npm run smoke:auth-guard`；履约审计和批量签到检查：`npm run smoke:fulfillment`。

登录成功后会话包含服务端计算的角色、功能权限、数据范围和过期时间。

后台服务模式默认是 `dev`，接口地址为 `http://localhost:8080`。生产环境可设置 `qiyu-admin-api-mode=prod` 和 `qiyu-admin-api-base-url` 后刷新。

启动后台前需先启动 `qiyu-server`。非本机环境需要将生产接口地址设置为浏览器可访问的 HTTPS 地址。
