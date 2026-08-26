import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const pages = ['home', 'stores', 'services', 'orders', 'profile'];
const errors = [];

for (const page of pages) {
  const pageDir = resolve(rootDir, `miniprogram/pages/${page}`);
  const pageJson = JSON.parse(readFileSync(resolve(pageDir, 'index.json'), 'utf8'));
  const pageSource = readFileSync(resolve(pageDir, 'index.ts'), 'utf8');
  if (pageJson.enablePullDownRefresh !== true) errors.push(`${page}: enablePullDownRefresh should be enabled`);
  if (!/onPullDownRefresh\s*\(/.test(pageSource)) errors.push(`${page}: missing onPullDownRefresh handler`);
  if (!/wx\.stopPullDownRefresh\(\)/.test(pageSource)) errors.push(`${page}: refresh handler should stop pull-down refresh`);
  if (!/load(?:Home|Stores|Services|Orders|Profile)\(\)/.test(pageSource)) errors.push(`${page}: refresh handler should reload page data`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Pull refresh smoke passed.');
