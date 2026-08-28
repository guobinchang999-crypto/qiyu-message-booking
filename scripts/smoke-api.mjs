#!/usr/bin/env node

const baseUrl = process.env.QIYU_API_BASE_URL || 'http://localhost:8080';

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  const body = await response.json();
  if (body.code !== 0) {
    throw new Error(`${path} returned API code ${body.code}: ${body.message}`);
  }
  return body.data;
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const smoke = async () => {
  const catalog = await requestJson('/catalog/client');
  assert(catalog.homeCopy?.memberTitle === '会员权益 · 全门店通用', 'catalog home copy mismatch');
  assert(catalog.orderDictionaries?.statusLabel?.BOOKED === '已预约', 'catalog booking status mismatch');

  const stores = await requestJson('/stores');
  assert(Array.isArray(stores) && stores.length > 0, 'stores should not be empty');

  const services = await requestJson('/services');
  assert(Array.isArray(services) && services.length > 0, 'services should not be empty');
  assert(services[0].category === '调理', 'service category should come from the API');
  assert(services[0].salesCount === 3280, 'service sales count should come from the API');
  assert(Array.isArray(services[0].tags) && services[0].tags.length > 0, 'service tags should come from the API');
  assert(Array.isArray(services[0].processSteps) && services[0].processSteps.length > 0, 'service process should come from the API');

  const therapists = await requestJson('/therapists?serviceId=service-neck');
  assert(Array.isArray(therapists) && therapists.length > 0, 'therapists should not be empty');

  const slots = await requestJson('/time-slots?storeId=store-jingan&serviceId=service-neck&therapistId=therapist-anran&date=2026-08-08');
  assert(Array.isArray(slots) && slots.length > 0, 'time slots should not be empty');
  assert(slots.find((slot) => slot.time === '10:30')?.status === 'FULL', 'time slot should include preparation/service overlap');

  const confirmation = await requestJson('/bookings/confirmation', {
    method: 'POST',
    body: JSON.stringify({
      storeId: 'store-jingan',
      serviceId: 'service-neck',
      therapistId: 'therapist-anran',
      date: '2026-08-08',
      startTime: '14:00',
      guestCount: 1,
      customerName: '林知夏',
      couponId: '新人体验券 ¥20'
    })
  });
  assert(confirmation.payment?.depositDue === 50, 'confirmation deposit mismatch');

  const created = await requestJson('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      storeId: 'store-jingan',
      serviceId: 'service-neck',
      therapistId: 'therapist-anran',
      date: '2026-08-08',
      startTime: '18:00',
      customerName: '林知夏',
      mobile: '13800001288',
      couponId: '新人体验券 ¥20'
    })
  });
  assert(created.id, 'created booking should include id');

  const detail = await requestJson(`/bookings/${created.id}`);
  assert(detail.id === created.id, 'booking detail id mismatch');
  assert(detail.verificationQrImageUrl, 'booking detail should include qr image url');

  const success = await requestJson(`/bookings/${created.id}/success`);
  assert(success.booking?.id === created.id, 'booking success id mismatch');

  const checkedIn = await requestJson(`/bookings/${created.id}/checkin`, { method: 'POST' });
  assert(checkedIn.status === 'CHECKED_IN', 'checkin status mismatch');
  const inService = await requestJson(`/bookings/${created.id}/start-service`, { method: 'POST' });
  assert(inService.status === 'IN_SERVICE', 'start service status mismatch');
  const pendingSettlement = await requestJson(`/bookings/${created.id}/finish-service`, { method: 'POST' });
  assert(pendingSettlement.status === 'PENDING_SETTLEMENT', 'finish service status mismatch');
  const completed = await requestJson(`/bookings/${created.id}/settle`, { method: 'POST' });
  assert(completed.status === 'COMPLETED', 'settlement status mismatch');
  assert(success.copy?.title === '预约成功', 'booking success copy mismatch');

  const payment = await requestJson('/bookings/BK-202608-1001/payment', {
    method: 'POST',
    body: JSON.stringify({ requestId: 'smoke-pay' })
  });
  assert(payment.parameters?.package === 'prepay_id=mock-BK-202608-1001', 'payment parameters mismatch');
  assert(payment.parameters?.mockPayment === true, 'payment should be marked as mock');

  const paid = await requestJson('/bookings/BK-202608-1001/pay', { method: 'POST' });
  assert(paid.status === 'BOOKED', 'paid booking status mismatch');

  const refreshed = await requestJson('/bookings/BK-202608-1002/verification-code/refresh', { method: 'POST' });
  assert(/^\d{6}$/.test(refreshed.verificationCode), 'refreshed verification code mismatch');
  assert(refreshed.verificationQrImageUrl?.includes(refreshed.verificationCode), 'refreshed qr image mismatch');

  const rescheduleDraft = await requestJson('/bookings/BK-202608-1002/reschedule-draft');
  assert(rescheduleDraft.draft?.flow === 'reschedule', 'reschedule draft flow mismatch');

  const rescheduled = await requestJson('/bookings/BK-202608-1002/reschedule', {
    method: 'POST',
    body: JSON.stringify({
      date: '2026-08-10',
      startTime: '16:00'
    })
  });
  assert(rescheduled.appointmentDate === '2026-08-10', 'rescheduled date mismatch');
  assert(rescheduled.startTime === '16:00', 'rescheduled start time mismatch');

  const cancelled = await requestJson(`/bookings/${created.id}/cancel`, { method: 'POST' });
  assert(cancelled.status === 'CANCELLED', 'cancelled booking status mismatch');

  const reviewImage = await requestJson('/reviews/images', {
    method: 'POST',
    body: JSON.stringify({
      fileName: 'smoke-review.jpg',
      requestId: 'smoke-upload'
    })
  });
  assert(reviewImage.imageUrl?.endsWith('/smoke-review.jpg'), 'review image upload url mismatch');

  const submittedReview = await requestJson('/reviews', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: 'BK-202608-1000',
      storeRating: 5,
      therapistRating: 5,
      serviceRating: 5,
      tags: ['手法专业'],
      content: 'smoke review content',
      anonymous: true,
      imageUrls: [reviewImage.imageUrl]
    })
  });
  assert(submittedReview.review?.storeId === 'store-jingan', 'submitted review store mismatch');

  const reviews = await requestJson('/reviews?storeId=store-jingan&serviceId=service-neck&page=1&pageSize=2');
  assert(reviews.items?.[0]?.content === 'smoke review content', 'submitted review should appear first');

  const profile = await requestJson('/member/profile');
  assert(profile.memberTitle === '会员权益 · 全门店通用', 'member profile benefit text mismatch');

  console.log(`Qiyu API smoke passed: ${baseUrl}`);
};

smoke().catch((error) => {
  console.error(`Qiyu API smoke failed: ${error.message}`);
  process.exit(1);
});
