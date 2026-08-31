#!/usr/bin/env node

/**
 * End-to-end API smoke against a real local/development backend.
 *
 * This script intentionally contains NO mock expectations. It asserts the real
 * chain: MySQL-backed catalog, Redis-backed SMS single-use login, a persisted
 * booking lifecycle, fail-closed payment (no simulated success), persisted
 * favorites and reviews. It exits non-zero on the first contract violation.
 *
 * Usage:
 *   node scripts/smoke-api.mjs
 *   QIYU_API_BASE_URL=https://... node scripts/smoke-api.mjs
 */

const baseUrl = process.env.QIYU_API_BASE_URL || 'http://localhost:8080';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const requestJson = async (path, options = {}) => {
  const { headers, ...rest } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: { 'content-type': 'application/json', ...(headers || {}) }
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`${path} returned non-JSON HTTP ${response.status}`);
  }
  if (body.code !== 0) {
    throw new Error(`${path} returned API code ${body.code}: ${body.message}`);
  }
  return body.data;
};

const loginAdmin = async () => {
  const data = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      clientType: 'ADMIN_WEB',
      grantType: 'PASSWORD',
      identifier: process.env.QIYU_ADMIN_USER || 'admin',
      credential: process.env.QIYU_ADMIN_PASSWORD || '123456'
    })
  });
  assert(data.token, 'admin login should return a token');
  return data.token;
};

const loginCustomer = async (mobile) => {
  const sent = await requestJson('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ mobile, clientType: 'MINI_PROGRAM' })
  });
  assert(sent.verificationCode, 'send-code should return the local Redis verification code');
  const data = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ clientType: 'MINI_PROGRAM', grantType: 'SMS_CODE', identifier: mobile, credential: sent.verificationCode })
  });
  assert(data.principal?.userType === 'CUSTOMER', 'sms login should resolve a customer principal');
  // A consumed code must be single-use.
  let replayRejected = false;
  try {
    await requestJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ clientType: 'MINI_PROGRAM', grantType: 'SMS_CODE', identifier: mobile, credential: sent.verificationCode })
    });
  } catch {
    replayRejected = true;
  }
  assert(replayRejected, 'verification code must be single-use');
  return data.token;
};

const smoke = async () => {
  const health = await requestJson('/health');
  assert(health.mode === 'local-mysql', 'backend must run against MySQL, not in-memory mock');

  // Public catalog must come from the database (real store/service rows with MinIO URLs).
  const stores = await requestJson('/stores');
  assert(Array.isArray(stores) && stores.length > 0, 'stores should not be empty');
  assert(stores[0].coverImageUrl?.includes('http'), 'store images must be real object URLs');

  const services = await requestJson('/services');
  assert(Array.isArray(services) && services.length > 0, 'services should not be empty');

  const therapists = await requestJson(`/therapists?serviceId=${services[0].id}&storeId=${stores[0].id}`);
  assert(Array.isArray(therapists) && therapists.length > 0, 'therapists should not be empty');

  // Admin console must run on the real permission model.
  const adminToken = await loginAdmin();
  const adminAuth = { Authorization: `Bearer ${adminToken}` };
  const dashboard = await requestJson('/admin/dashboard', { headers: adminAuth });
  assert(dashboard.statistics, 'admin dashboard should expose statistics');
  const accessibleStores = await requestJson('/admin/accessible-stores', { headers: adminAuth });
  assert(Array.isArray(accessibleStores) && accessibleStores.length > 0, 'admin should resolve accessible stores');

  // Customer real login and persisted booking lifecycle.
  const mobile = process.env.QIYU_CUSTOMER_MOBILE || '13800001288';
  const customerToken = await loginCustomer(mobile);
  const auth = { Authorization: `Bearer ${customerToken}` };

  const slots = await requestJson(`/time-slots?storeId=${stores[0].id}&serviceId=${services[0].id}&therapistId=${therapists[0].id}&date=2026-09-05`, { headers: auth });
  assert(Array.isArray(slots) && slots.length > 0, 'time slots should be available');
  const openSlot = slots.find((slot) => slot.status === 'AVAILABLE');
  assert(openSlot, 'at least one AVAILABLE slot should be resolvable from the real schedule');

  const created = await requestJson('/bookings', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      storeId: stores[0].id,
      serviceId: services[0].id,
      therapistId: therapists[0].id,
      date: '2026-09-05',
      startTime: openSlot.time,
      customerName: '冒烟客户',
      mobile
    })
  });
  assert(created.id && created.status === 'PENDING_PAYMENT', 'booking should be created as pending payment');

  const detail = await requestJson(`/bookings/${created.id}`, { headers: auth });
  assert(detail.id === created.id, 'booking detail should round-trip');

  // Payment must fail closed until a real merchant provider is configured; simulated success is prohibited.
  let paymentRejected = false;
  try {
    await requestJson(`/bookings/${created.id}/payment`, {
      method: 'POST', headers: auth, body: JSON.stringify({ requestId: 'smoke-payment' })
    });
  } catch {
    paymentRejected = true;
  }
  assert(paymentRejected, 'payment must fail closed without a configured merchant provider');

  const cancelled = await requestJson(`/bookings/${created.id}/cancel`, {
    method: 'POST', headers: auth, body: JSON.stringify({ requestId: 'smoke-cancel' })
  });
  assert(cancelled.status === 'CANCELLED', 'booking should be cancelled');

  // Persisted favorites round-trip.
  const favorite = await requestJson(`/member/favorites/stores/${stores[0].id}`, { method: 'PUT', headers: auth });
  assert(favorite.favorite === true, 'store favorite should be persisted');
  await requestJson(`/member/favorites/stores/${stores[0].id}`, { method: 'DELETE', headers: auth });

  // Reviews must come from the database.
  const reviews = await requestJson(`/reviews?storeId=${stores[0].id}&serviceId=${services[0].id}&page=1&pageSize=5`, { headers: auth });
  assert(Array.isArray(reviews.items), 'review list should be paginated');
  for (const item of reviews.items) {
    assert(item.serviceId === services[0].id, `review serviceId must match catalog id, got ${item.serviceId}`);
  }

  console.log(`Qiyu real-API smoke passed: ${baseUrl} (mode=${health.mode}, stores=${stores.length}, services=${services.length})`);
};

smoke().catch((error) => {
  console.error(`Qiyu real-API smoke failed: ${error.message}`);
  process.exit(1);
});
