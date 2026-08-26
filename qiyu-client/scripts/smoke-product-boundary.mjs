import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const miniprogramDir = join(rootDir, 'miniprogram');
const scannedDirs = [
  'components',
  'constants',
  'custom-tab-bar',
  'mock',
  'pages',
  'services',
  'store',
  'types',
  'utils'
].map((dir) => join(miniprogramDir, dir));
const scannedExtensions = ['.ts', '.js', '.wxml', '.json'];
const forbiddenPatterns = [
  { pattern: /经营主体/g, label: 'multi operator copy' },
  { pattern: /门店类型/g, label: 'store type copy' },
  { pattern: /经营类型/g, label: 'business type copy' },
  { pattern: /独立会员/g, label: 'independent membership copy' },
  { pattern: /独立财务/g, label: 'independent finance copy' },
  { pattern: /加盟/g, label: 'franchise copy' },
  { pattern: /\bstoreType\b/g, label: 'storeType field' },
  { pattern: /\bbusinessType\b/g, label: 'businessType field' },
  { pattern: /\btenant\b/gi, label: 'tenant field' },
  { pattern: /\bmerchant\b/gi, label: 'merchant field' },
  { pattern: /\bfranchise\b/gi, label: 'franchise field' }
];

const walkFiles = (dirPath) => {
  const files = [];
  for (const entry of readdirSync(dirPath)) {
    const entryPath = join(dirPath, entry);
    const stat = statSync(entryPath);
    if (stat.isDirectory()) {
      files.push(...walkFiles(entryPath));
      continue;
    }
    if (scannedExtensions.some((extension) => entryPath.endsWith(extension))) files.push(entryPath);
  }
  return files;
};
const relativeToRoot = (filePath) => normalize(filePath).replace(`${normalize(rootDir)}/`, '');
const errors = [];

for (const filePath of scannedDirs.flatMap(walkFiles)) {
  const source = readFileSync(filePath, 'utf8');
  for (const { pattern, label } of forbiddenPatterns) {
    const matches = source.match(pattern);
    if (matches?.length) {
      errors.push(`${relativeToRoot(filePath)}: forbidden ${label}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Product boundary smoke passed.');
