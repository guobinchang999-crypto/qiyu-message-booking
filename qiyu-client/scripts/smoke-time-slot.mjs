import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = resolve(new URL('..', import.meta.url).pathname);
const { mockService } = require(resolve(rootDir, 'miniprogram/services/mock-service.js'));
const { bookingStore } = require(resolve(rootDir, 'miniprogram/store/booking.js'));

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

bookingStore.reset();
const draft = bookingStore.get();
const slots = await mockService.getTimeSlots(draft);
const selectedDraftSlot = slots.find((slot) => slot.id === draft.slotId);
assert(slots.some((slot) => slot.status === 'full'), 'time slot mock data should include full slots');
assert(slots.some((slot) => slot.status === 'available'), 'time slot mock data should include available slots');
assert(slots.some((slot) => slot.status === 'limited'), 'time slot mock data should include limited slots');
assert(selectedDraftSlot?.status !== 'full', 'default booking draft should not select a full slot');

const timePageSource = readFileSync(resolve(rootDir, 'miniprogram/pages/time/index.ts'), 'utf8');
assert(/chooseSlot\(event[\s\S]*?slot\.status\s*===\s*'full'[\s\S]*?wx\.showToast[\s\S]*?return;/.test(timePageSource), 'time page should reject full slot selection with a toast');
assert(/const draftSlot = viewSlots\.find\(\(slot\) => slot\.id === draft\.slotId && slot\.status !== 'full'\)/.test(timePageSource), 'time page should ignore full draft slot restore');
assert(/const firstAvailable = draftSlot \|\| visibleSlots\.find\(\(slot\) => slot\.status !== 'full'\)/.test(timePageSource), 'time page should auto-select only non-full slots');
assert(/bookingStore\.update\(\{ slotId:this\.data\.selectedSlotId \}\)/.test(timePageSource), 'time page should persist only selected slot id on next');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Time slot smoke passed.');
