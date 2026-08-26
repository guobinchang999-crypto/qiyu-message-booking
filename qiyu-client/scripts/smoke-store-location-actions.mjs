import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = resolve(new URL('..', import.meta.url).pathname);
const { stores } = require(resolve(rootDir, 'miniprogram/mock/fixtures.js'));
const { mockService } = require(resolve(rootDir, 'miniprogram/services/mock-service.js'));
const { callStore, navigateToStore } = require(resolve(rootDir, 'miniprogram/utils/store-actions.js'));

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const wxCalls = [];
global.wx = {
  openLocation(options) {
    wxCalls.push({ type: 'openLocation', options });
  },
  makePhoneCall(options) {
    wxCalls.push({ type: 'makePhoneCall', options });
  },
  showToast(options) {
    wxCalls.push({ type: 'showToast', options });
  }
};

const feedback = await mockService.getActionFeedbackDictionaries();
const store = stores[0];

navigateToStore(store, feedback);
const navigationCall = wxCalls.find((call) => call.type === 'openLocation');
assert(navigationCall?.options.latitude === store.latitude, 'navigateToStore should pass store latitude to wx.openLocation');
assert(navigationCall?.options.longitude === store.longitude, 'navigateToStore should pass store longitude to wx.openLocation');
assert(navigationCall?.options.name === store.name, 'navigateToStore should pass store name to wx.openLocation');
assert(navigationCall?.options.address === store.address, 'navigateToStore should pass store address to wx.openLocation');
navigationCall?.options.fail();
assert(wxCalls.some((call) => call.type === 'showToast' && call.options.title === feedback.navigationUnavailable), 'navigateToStore should show dictionary navigation fallback on failure');

wxCalls.length = 0;
navigateToStore(null, feedback);
assert(wxCalls.some((call) => call.type === 'showToast' && call.options.title === feedback.navigationUnavailable), 'navigateToStore should guard missing store with dictionary feedback');

wxCalls.length = 0;
callStore(store, feedback);
const contactCall = wxCalls.find((call) => call.type === 'makePhoneCall');
assert(contactCall?.options.phoneNumber === store.phone, 'callStore should pass store phone to wx.makePhoneCall');
contactCall?.options.fail();
assert(wxCalls.some((call) => call.type === 'showToast' && call.options.title === feedback.contactPlaceholder), 'callStore should show dictionary contact fallback on failure');

wxCalls.length = 0;
callStore({ ...store, phone: '' }, feedback);
assert(wxCalls.some((call) => call.type === 'showToast' && call.options.title === feedback.contactPlaceholder), 'callStore should guard missing phone with dictionary feedback');

const storesPageTs = readFileSync(resolve(rootDir, 'miniprogram/pages/stores/index.ts'), 'utf8');
const storesPageWxml = readFileSync(resolve(rootDir, 'miniprogram/pages/stores/index.wxml'), 'utf8');
const storeDetailTs = readFileSync(resolve(rootDir, 'miniprogram/pages/store-detail/index.ts'), 'utf8');
const storeDetailWxml = readFileSync(resolve(rootDir, 'miniprogram/pages/store-detail/index.wxml'), 'utf8');
const storeCardWxml = readFileSync(resolve(rootDir, 'miniprogram/components/qy-store-card/index.wxml'), 'utf8');

assert(storesPageTs.includes('bookingService.getPageStateDictionaries()'), 'stores page should load page state dictionaries from service');
assert(storesPageTs.includes('pageStates.stores.sortOptions'), 'stores page should render sort options from dictionaries');
assert(storesPageTs.includes("businessStatusCode === 'OPEN'"), 'stores page should filter business-only stores by status code');
assert(storesPageTs.includes("sortKey: SortKey = 'distance'"), 'stores page should switch to distance sort after location is selected');
assert(storesPageTs.includes("wx.getLocation({\n      type: 'gcj02'"), 'stores page should request gcj02 location for map-compatible distance sorting');
assert(storesPageTs.includes('wx.chooseLocation({'), 'stores page should support choosing a map location');
assert(storesPageTs.includes("wx.showToast({ title:this.data.feedback.mapUnavailable, icon:'none' })"), 'stores page should use dictionary feedback when map selection fails');
assert(storesPageTs.includes('bookingStore.selectStore(storeId)'), 'stores page should update booking draft when a store is selected');
assert(storesPageTs.includes('wx.navigateTo({ url: pageUrls.storeDetail(storeId) })'), 'stores page should navigate through centralized pageUrls');

assert(storesPageWxml.includes('placeholder="{{stateCopy.searchPlaceholder}}"'), 'stores WXML should render search placeholder from dictionaries');
assert(storesPageWxml.includes('wx:for="{{sortOptions}}"'), 'stores WXML should render sort tabs from dictionaries');
assert(storesPageWxml.includes('bindtap="openMap"'), 'stores WXML should bind map entry to openMap');
assert(storesPageWxml.includes('bindtap="refreshLocation"'), 'stores WXML should bind locate action to refreshLocation');
assert(storesPageWxml.includes('locationDeniedWarning'), 'stores WXML should render denied location warning');
assert(storesPageWxml.includes('locationFailedWarning'), 'stores WXML should render failed location warning');
assert(storesPageWxml.includes('visibleStores.length === 0'), 'stores WXML should render empty state after filtering');
assert(storesPageWxml.includes('bind:select="goStore"'), 'stores WXML should bind store card selection');

assert(storeDetailTs.includes("if (key === 'navigation')"), 'store detail should route navigation action by dictionary key');
assert(storeDetailTs.includes('navigateToStore(this.data.store, this.data.feedback)'), 'store detail should call shared navigation utility');
assert(storeDetailTs.includes("if (key === 'contact')"), 'store detail should route contact action by dictionary key');
assert(storeDetailTs.includes('callStore(this.data.store, this.data.feedback)'), 'store detail should call shared contact utility');
assert(storeDetailWxml.includes('wx:for="{{dictionaries.actions}}"'), 'store detail should render action buttons from backend dictionaries');
assert(storeDetailWxml.includes('data-key="{{item.key}}"'), 'store detail actions should preserve dictionary action keys');
assert(storeCardWxml.includes('bindtap="onSelect"'), 'store card should be selectable');
assert(storeCardWxml.includes('triggerEvent') === false, 'store card WXML should keep selection implementation in component logic');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Store location actions smoke passed.');
