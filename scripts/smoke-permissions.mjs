#!/usr/bin/env node

/**
 * End-to-end data-permission rejection smoke against a real backend.
 *
 * Verifies that server-resolved data scope is enforced identically across list,
 * detail, write, dashboard and report endpoints, and that a user-level DENY
 * override beats role ALLOW grants after a fresh login.
 *
 * Usage:
 *   node scripts/smoke-permissions.mjs
 *   QIYU_API_BASE_URL=... node scripts/smoke-permissions.mjs
 */

const baseUrl = process.env.QIYU_API_BASE_URL || 'http://localhost:8080';
const ADMIN_USER = process.env.QIYU_ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.QIYU_ADMIN_PASSWORD || '123456';
const MANAGER_USER = process.env.QIYU_MANAGER_USER || 'test_manager';
const MANAGER_PASSWORD = process.env.QIYU_MANAGER_PASSWORD || 'Test@123456';
const THERAPIST_USER = process.env.QIYU_THERAPIST_USER || 'test_therapist';
const THERAPIST_PASSWORD = process.env.QIYU_THERAPIST_PASSWORD || 'Test@123456';

const assert = (condition, message) => { if (!condition) throw new Error(message); };

const login = async (identifier, credential, clientType = 'ADMIN_WEB') => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ clientType, grantType: 'PASSWORD', identifier, credential })
  });
  const body = await response.json();
  if (body.code !== 0) throw new Error(`login ${identifier} failed: ${body.message}`);
  return body.data.token;
};

const request = async (path, token, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
  let body;
  try { body = await response.json(); } catch { throw new Error(`${path} non-JSON HTTP ${response.status}`); }
  return body;
};

const expectCode = (path, token, options, expected) => {
  return request(path, token, options).then((body) => {
    if (body.code !== expected) throw new Error(`${path} expected code ${expected}, got ${body.code}: ${body.message}`);
    return body.data;
  });
};

const smoke = async () => {
  const admin = await login(ADMIN_USER, ADMIN_PASSWORD);
  const manager = await login(MANAGER_USER, MANAGER_PASSWORD);

  // Manager list is limited to the primary store.
  const managerBookings = (await expectCode('/admin/bookings?page=1&pageSize=50', manager, {}, 0)).list;
  assert(managerBookings.every((row) => row.store.name.includes('徐家汇')),
    'manager bookings must be limited to their primary store');
  assert(managerBookings.length > 0, 'manager should see at least one 徐家汇 booking');

  // Manager reports are aggregated after the same store filter.
  const managerReports = await expectCode('/admin/reports?startDate=2026-08-01&endDate=2026-08-31', manager, {}, 0);
  assert(managerReports.every((row) => row.store.includes('徐家汇')), 'manager reports must exclude other stores');

  // Admin resolves a 静安寺 booking; the manager must be rejected on detail and on write.
  const allBookings = (await expectCode('/admin/bookings?page=1&pageSize=50', admin, {}, 0)).list;
  const jingan = allBookings.find((row) => row.store.name.includes('静安寺'));
  assert(jingan, 'admin should see a 静安寺 booking for the cross-store test');

  await expectCode(`/bookings/${jingan.id}`, manager, {}, 403);
  await expectCode(`/bookings/${jingan.id}/checkin`, manager, { method: 'POST', body: JSON.stringify({ requestId: 'perm-smoke' }) }, 403);

  // A user-level DENY override must beat the role ALLOW after a fresh login.
  await expectCode(`/admin/system/users/9007/permissions`, admin, {
    method: 'PUT', body: JSON.stringify({ allowedCodes: [], deniedCodes: ['customer:read'] })
  }, 0);
  const therapist = await login(THERAPIST_USER, THERAPIST_PASSWORD);
  const me = (await expectCode('/auth/me', therapist, {}, 0)).principal;
  assert(!me.permissions.includes('customer:read'), 'DENY override must remove the role-granted permission');
  await expectCode('/admin/customers', therapist, {}, 403);

  // Cleanup: restore the role-inherited behaviour.
  await expectCode(`/admin/system/users/9007/permissions`, admin, { method: 'DELETE' }, 0);

  console.log(`Qiyu permission smoke passed: ${baseUrl}`);
};

smoke().catch((error) => {
  console.error(`Qiyu permission smoke failed: ${error.message}`);
  process.exit(1);
});
