import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const source = readFileSync(resolve(rootDir, 'src/layouts/AdminLayout.tsx'), 'utf8');
const authSource = readFileSync(resolve(rootDir, 'src/services/admin-auth.ts'), 'utf8');
const requiredPatterns = [
  [/readAdminSession\(\)/, 'layout should read the structured admin auth session'],
  [/window\.location\.replace\('\/login'\)/, 'unauthenticated users should be redirected to login'],
  [/roleMenuPaths\[session\.role\]/, 'layout should filter menu items by session role'],
  [/authenticated\)/, 'layout should defer business content until auth is checked'],
  [/expiresAt <= Date\.now\(\)/, 'auth service should reject expired sessions'],
  [/clearAdminSession\(\)/, 'logout should clear the structured session']
];

const errors = requiredPatterns
  .filter(([pattern]) => !pattern.test(`${source}\n${authSource}`))
  .map(([, message]) => message);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Admin auth guard smoke passed.');
