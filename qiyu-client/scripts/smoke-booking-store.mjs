import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = resolve(new URL('..', import.meta.url).pathname);
const { bookingStore } = require(resolve(rootDir, 'miniprogram/store/booking.js'));

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

bookingStore.reset();
const initialDraft = bookingStore.get();
assert(initialDraft.storeId === '', 'default store must come from a real API selection');
assert(initialDraft.serviceId === '', 'default service must come from a real API selection');
assert(initialDraft.therapistMode === 'auto', 'default therapist mode should be automatic');
assert(initialDraft.therapistId === undefined, 'default draft must not contain a fixture therapist');
assert(initialDraft.slotId === undefined, 'default draft must not contain a fixture slot');
assert(initialDraft.contact === '', 'default draft must not contain fixture customer data');
assert(initialDraft.benefitSelection === '', 'default draft must not contain a fixture benefit');

bookingStore.selectStore('jingan');
const unchangedStoreDraft = bookingStore.get();
assert(unchangedStoreDraft.therapistId === undefined, 'selecting a store should not invent a therapist');
assert(unchangedStoreDraft.slotId === undefined, 'selecting a store should not invent a slot');

bookingStore.selectStore('xujiahui');
const changedStoreDraft = bookingStore.get();
assert(changedStoreDraft.storeId === 'xujiahui', 'selectStore should update store');
assert(changedStoreDraft.therapistMode === 'auto', 'selectStore should reset therapist mode to auto');
assert(changedStoreDraft.therapistId === undefined, 'selectStore should clear therapist');
assert(changedStoreDraft.slotId === undefined, 'selectStore should clear slot');

bookingStore.update({ therapistMode:'specified', therapistId:'li', slotId:'1600' });
bookingStore.selectService('neck');
bookingStore.update({ therapistMode:'specified', therapistId:'li', slotId:'1600' });
bookingStore.selectService('neck');
const unchangedServiceDraft = bookingStore.get();
assert(unchangedServiceDraft.therapistId === 'li', 'selecting same service should keep therapist');
assert(unchangedServiceDraft.slotId === '1600', 'selecting same service should keep slot');

let notificationCount = 0;
const unsubscribe = bookingStore.subscribe((draft) => {
  notificationCount += 1;
  draft.contact = 'mutated-by-test';
});
bookingStore.selectService('spa');
const changedServiceDraft = bookingStore.get();
assert(notificationCount === 1, 'selectService should notify subscribers once');
assert(changedServiceDraft.serviceId === 'spa', 'selectService should update service');
assert(changedServiceDraft.therapistMode === 'auto', 'selectService should reset therapist mode to auto');
assert(changedServiceDraft.therapistId === undefined, 'selectService should clear therapist');
assert(changedServiceDraft.slotId === undefined, 'selectService should clear slot');
assert(bookingStore.get().contact !== 'mutated-by-test', 'subscriber should receive a copy of draft');

unsubscribe();
bookingStore.selectService('tuina');
assert(notificationCount === 1, 'unsubscribe should stop further notifications');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Booking store smoke passed.');
