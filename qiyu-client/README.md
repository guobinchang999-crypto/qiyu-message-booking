# qiyu-client

Native WeChat Mini Program MVP for 栖愈｜推拿·SPA.

## Preview

1. Open WeChat DevTools.
2. Import this folder as a Mini Program project.
3. Run `npm install` if TDesign components are needed, then use DevTools to build npm.

The current MVP uses local mock data and does not require backend services.

## Validation

- `npm run verify`: runs the full local client gate in order, including product boundary, login form, home order, profile, order status, booking draft, time slot, draft flow, confirm submit, booking action, review flow, review upload, and payment smoke checks.
- `npm run typecheck`: checks TypeScript sources.
- `npm run build:miniprogram-js`: emits Mini Program JavaScript files for DevTools preview.
- `npm run validate:miniprogram`: checks page registration and `pageRoutes` both ways, page/component/custom TabBar JavaScript output freshness, local component completeness, custom TabBar files, TDesign 1.15.x npm build output, custom/TDesign component declarations, TabBar route consistency, page/component copy placement, literal page route usage, route API compatibility, and fixed bottom action spacing before opening WeChat DevTools.
- `npm run smoke:page-acceptance`: checks all 15 design pages, four TabBar entries, and the key booking, location, fulfillment, review, and profile interaction entry points before opening WeChat DevTools.
- `npm run smoke:api-mode`: checks the `mock/dev/prod` runtime mode selector and Mock fallback.
- `npm run smoke:product-boundary`: checks the client does not expose store type, multi-operator, tenant, merchant, franchise, or independent membership concepts.
- `npm run smoke:login-form`: checks login copy, phone/code validation, agreement guard, SMS countdown, and submit navigation locks.
- `npm run smoke:home-order`: checks frequent store data and home section order before nearby stores.
- `npm run smoke:store-location-actions`: checks store list location/map bindings plus store navigation and phone action fallbacks.
- `npm run smoke:pull-refresh`: checks pull-to-refresh configuration and reload handlers for home, stores, services, orders, and profile.
- `npm run smoke:profile`: checks all-store member benefit wording, recent booking entry, orders entry, and logout confirmation.
- `npm run smoke:order-status`: checks unified booking status type, labels, order tabs, and mock booking statuses.
- `npm run smoke:booking-store`: checks booking draft store/service selection reset rules.
- `npm run smoke:time-slot`: checks full slot rejection and non-full slot restore rules.
- `npm run smoke:booking-draft-flow`: checks rebook and reschedule draft flow/source booking semantics.
- `npm run smoke:confirm-submit`: checks create versus reschedule submit effects on the booking list.
- `npm run smoke:booking-actions`: checks booking code refresh, checkin, and cancel action state updates.
- `npm run smoke:review-flow`: checks review submission action updates and store/service review list backfill.
- `npm run smoke:review-upload`: checks review image upload success/failure and uploaded-image review submit backfill.
- `npm run smoke:payment`: checks mock payment bypass, successful Mini Program payment confirmation, and failed payment rejection.

### API mode switching

The default mode is `mock`. In WeChat DevTools, use the console to select a remote mode before restarting the Mini Program:

```js
wx.setStorageSync('qiyu-api-mode', 'dev');
```

Use `prod` for the production endpoint, or clear the key to return to Mock mode:

```js
wx.removeStorageSync('qiyu-api-mode');
```

The `dev` URL is `http://localhost:8080/api/v1` for local DevTools use. A real device requires replacing it with a reachable HTTPS test address before network testing.
