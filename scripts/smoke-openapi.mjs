#!/usr/bin/env node

/**
 * OpenAPI contract regression smoke.
 *
 * Fetches the generated OpenAPI document and guards the stable public contract:
 * no legacy /api/v1 prefix, all business path groups present, and every documented
 * response body is a concrete schema rather than an untyped map.
 *
 * Usage:
 *   node scripts/smoke-openapi.mjs
 *   QIYU_API_BASE_URL=... node scripts/smoke-openapi.mjs
 */

const baseUrl = process.env.QIYU_API_BASE_URL || 'http://localhost:8080';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const expectedPathGroups = [
  '/auth', '/catalog', '/stores', '/services', '/therapists', '/time-slots',
  '/bookings', '/reviews', '/member', '/admin'
];

const smoke = async () => {
  const response = await fetch(`${baseUrl}/v3/api-docs`);
  if (!response.ok) throw new Error(`OpenAPI fetch HTTP ${response.status}`);
  const spec = await response.json();

  const paths = Object.keys(spec.paths || {});
  assert(paths.length > 0, 'OpenAPI must expose at least one path');

  const legacy = paths.filter((path) => path.startsWith('/api/v1'));
  assert(legacy.length === 0, `legacy /api/v1 paths must not exist, found: ${legacy.join(', ')}`);

  for (const group of expectedPathGroups) {
    assert(paths.some((path) => path === group || path.startsWith(`${group}/`)),
      `expected path group ${group} is missing from OpenAPI`);
  }

  // Typed contracts: responses must reference a schema, not an untyped map.
  let untyped = 0;
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const operation of Object.values(item || {})) {
      if (typeof operation !== 'object' || !operation || !operation.responses) continue;
      const ok = operation.responses['200'];
      if (!ok) continue;
      const content = ok.content;
      if (content && Object.values(content).some((media) => {
        const ref = media.schema;
        return ref && ref.type === 'object' && !ref.additionalProperties && !ref.$ref;
      })) {
        untyped += 1;
      }
    }
  }
  assert(untyped === 0, `${untyped} response bodies are untyped maps instead of concrete schemas`);

  console.log(`Qiyu OpenAPI smoke passed: ${baseUrl} (${paths.length} paths, ${Object.keys(spec.components?.schemas || {}).length} schemas)`);
};

smoke().catch((error) => {
  console.error(`Qiyu OpenAPI smoke failed: ${error.message}`);
  process.exit(1);
});
