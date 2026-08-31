# qiyu-client

栖愈｜推拿·SPA 原生微信小程序。

## Preview

1. 打开微信开发者工具。
2. 将本目录导入为小程序项目。
3. 执行 `npm install`，然后在开发者工具中构建 npm。

页面运行时只调用 `qiyu-server` 真实接口。本地 Mock 服务仅作为 smoke 测试夹具，不会被小程序运行时代码导入。

## Validation

- `npm run verify`: runs the full local client gate in order, including product boundary, login form, home order, profile, order status, booking draft, time slot, draft flow, confirm submit, booking action, review flow, review upload, and payment smoke checks.
- `npm run typecheck`: checks TypeScript sources.
- `npm run build:miniprogram-js`: emits Mini Program JavaScript files for DevTools preview.
- `npm run validate:miniprogram`: checks page registration and `pageRoutes` both ways, page/component/custom TabBar JavaScript output freshness, local component completeness, custom TabBar files, TDesign 1.15.x npm build output, custom/TDesign component declarations, TabBar route consistency, page/component copy placement, literal page route usage, route API compatibility, and fixed bottom action spacing before opening WeChat DevTools.
- `npm run smoke:page-acceptance`: checks all 15 design pages, four TabBar entries, and the key booking, location, fulfillment, review, and profile interaction entry points before opening WeChat DevTools.
- `npm run smoke:api-mode`: 检查 `dev/prod` 真实接口环境选择，并确认运行时不存在 Mock 回退。
- `npm run smoke:remote-contract`: checks dynamic appointment dates, date-driven slot reload, write idempotency keys, and multipart review-image upload.
- `npm run smoke:product-boundary`: checks the client does not expose store type, multi-operator, tenant, merchant, franchise, or independent membership concepts.
- `npm run smoke:login-form`: checks login copy, phone/code validation, agreement guard, SMS countdown, and submit navigation locks.
- `npm run smoke:home-order`: checks frequent store data and home section order before nearby stores.
- `npm run smoke:store-location-actions`: checks store list location/map bindings plus store navigation and phone action fallbacks.
- `npm run smoke:pull-refresh`: checks pull-to-refresh configuration and reload handlers for home, stores, services, orders, and profile.
- `npm run smoke:profile`: checks all-store member benefit wording, recent booking entry, orders entry, and logout confirmation.
- `npm run smoke:order-status`: 使用测试夹具检查统一预约状态、标签和订单页签。
- `npm run smoke:booking-store`: checks booking draft store/service selection reset rules.
- `npm run smoke:time-slot`: checks full slot rejection and non-full slot restore rules.
- `npm run smoke:booking-draft-flow`: checks rebook and reschedule draft flow/source booking semantics.
- `npm run smoke:confirm-submit`: checks create versus reschedule submit effects on the booking list.
- `npm run smoke:booking-actions`: checks booking code refresh, checkin, and cancel action state updates.
- `npm run smoke:review-flow`: checks review submission action updates and store/service review list backfill.
- `npm run smoke:review-upload`: checks review image upload success/failure and uploaded-image review submit backfill.
- `npm run smoke:payment`: 检查微信支付参数传递、成功确认及失败拒绝；运行时不存在支付绕过。

### API mode switching

默认环境为 `dev`。在微信开发者工具控制台可切换真实接口环境，修改后需重新启动小程序：

```js
wx.setStorageSync('qiyu-api-mode', 'dev');
```

生产部署使用 `prod`，清除该键会恢复默认的 `dev` 环境：

```js
wx.removeStorageSync('qiyu-api-mode');
```

`dev` 地址为 `http://localhost:8080`，供本机开发者工具使用。真机联调前必须配置可访问的 HTTPS 测试地址。
