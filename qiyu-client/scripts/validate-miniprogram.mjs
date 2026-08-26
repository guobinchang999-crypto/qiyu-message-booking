import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const miniprogramDir = join(rootDir, 'miniprogram');
const appJsonPath = join(miniprogramDir, 'app.json');
const packageLockPath = join(rootDir, 'package-lock.json');
const navigationPath = join(miniprogramDir, 'constants/navigation.ts');
const customComponentPattern = /<\s*((?:qy|t)-[a-z0-9-]+)/g;
const chineseCharacterPattern = /[\u4e00-\u9fa5]/;
const pageRouteLiteralPattern = /['"]\/pages\//;
const bottomActionPattern = /<\s*qy-bottom-action\b/;
const qyPagePattern = /class=["'][^"']*\bqy-page\b[^"']*["']/;
const utilityImportPattern = /@import\s+["'][^"']*styles\/utilities\.wxss["']/;
const localQyPagePaddingPattern = /\.qy-page\s*\{[^}]*padding-bottom\s*:/;
const fixedSummaryPattern = /class=["'][^"']*\bbottom-summary\b[^"']*["']/;
const doubleFixedPaddingPattern = /\.qy-page\s*\{[^}]*padding-bottom\s*:\s*calc\((?:2[4-9]\d|[3-9]\d{2,})rpx\s*\+\s*env\(safe-area-inset-bottom\)\)/;

const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'));
const stripLeadingDotSlash = (value) => value.replace(/^\.\//, '');
const unique = (values) => [...new Set(values)];
const walkFiles = (dirPath, extensions) => {
  const files = [];
  for (const entry of readdirSync(dirPath)) {
    const entryPath = join(dirPath, entry);
    const stat = statSync(entryPath);
    if (stat.isDirectory()) {
      files.push(...walkFiles(entryPath, extensions));
      continue;
    }
    if (extensions.some((extension) => entryPath.endsWith(extension))) files.push(entryPath);
  }
  return files;
};
const relativeToRoot = (filePath) => normalize(filePath).replace(`${normalize(rootDir)}/`, '');
const assertCompiledOutputFresh = (sourcePath, outputPath, label) => {
  if (!existsSync(sourcePath) || !existsSync(outputPath)) return;
  const sourceModifiedAt = statSync(sourcePath).mtimeMs;
  const outputModifiedAt = statSync(outputPath).mtimeMs;
  if (sourceModifiedAt > outputModifiedAt + 1000) {
    errors.push(`${label}: js output is older than ts source; run npx tsc --noEmit false`);
  }
};
const toComponentJsonPath = (baseDir, componentPath) => {
  const resolved = componentPath.startsWith('/')
    ? join(miniprogramDir, stripLeadingDotSlash(componentPath))
    : join(baseDir, componentPath);
  return `${normalize(resolved)}.json`;
};
const toNpmComponentJsonPath = (componentPath) => join(miniprogramDir, 'miniprogram_npm', `${componentPath}.json`);
const toAppPagePath = (route) => route.replace(/^\//, '');
const extractPageRoutes = (source) => {
  const block = source.match(/export const pageRoutes = \{([\s\S]*?)\};/);
  if (!block) return [];
  return [...block[1].matchAll(/([a-zA-Z0-9]+):\s*'([^']+)'/g)].map((match) => ({ key: match[1], route: match[2] }));
};
const extractTabBarPaths = (source, routes) => {
  const routeByKey = new Map(routes.map((route) => [route.key, route.route]));
  const block = source.match(/export const tabBarItems:[\s\S]*?=\s*\[([\s\S]*?)\];/);
  if (!block) return [];
  return [...block[1].matchAll(/path:\s*pageRoutes\.([a-zA-Z0-9]+)/g)]
    .map((match) => routeByKey.get(match[1]))
    .filter(Boolean);
};
const assertNavigationApis = (filePath, source, tabBarRouteKeys, nonTabBarRouteKeys) => {
  const relativePath = relativeToRoot(filePath);
  const navigationCalls = [
    ...source.matchAll(/wx\.(navigateTo|redirectTo|switchTab|reLaunch)\s*\(\s*\{\s*url\s*:\s*(pageRoutes|pageUrls)\.([a-zA-Z0-9]+)/g)
  ];
  for (const match of navigationCalls) {
    const [, apiName, routeSource, routeKey] = match;
    if (routeSource === 'pageRoutes' && tabBarRouteKeys.has(routeKey) && (apiName === 'navigateTo' || apiName === 'redirectTo')) {
      errors.push(`${relativePath}: use wx.switchTab or wx.reLaunch for tabBar route pageRoutes.${routeKey}`);
    }
    if (nonTabBarRouteKeys.has(routeKey) && apiName === 'switchTab') {
      errors.push(`${relativePath}: wx.switchTab can only target tabBar routes, got ${routeSource}.${routeKey}`);
    }
  }
};

const appJson = readJson(appJsonPath);
const packageLock = readJson(packageLockPath);
const globalComponents = appJson.usingComponents || {};
const errors = [];
const navigationSource = readFileSync(navigationPath, 'utf8');
const pageRoutes = extractPageRoutes(navigationSource);
const routePagePaths = pageRoutes.map((route) => toAppPagePath(route.route));
const appPages = appJson.pages || [];
const tdesignPackage = packageLock.packages?.['node_modules/tdesign-miniprogram'];
if (!tdesignPackage?.version || !/^1\.15\./.test(tdesignPackage.version)) {
  errors.push(`tdesign-miniprogram: expected package-lock version 1.15.x, got ${tdesignPackage?.version || 'missing'}`);
}
const customTabBarRequiredFiles = ['index.json', 'index.wxml', 'index.ts', 'index.js', 'index.wxss'];
const componentRequiredFiles = ['index.json', 'index.wxml', 'index.ts', 'index.js', 'index.wxss'];
const componentDirs = readdirSync(join(miniprogramDir, 'components'))
  .map((entry) => join(miniprogramDir, 'components', entry))
  .filter((entryPath) => statSync(entryPath).isDirectory());
const copyRestrictedFiles = [
  join(miniprogramDir, 'pages'),
  join(miniprogramDir, 'components'),
  join(miniprogramDir, 'custom-tab-bar')
].flatMap((dirPath) => walkFiles(dirPath, ['.ts', '.wxml']));
const routeRestrictedFiles = [
  join(miniprogramDir, 'pages'),
  join(miniprogramDir, 'components'),
  join(miniprogramDir, 'custom-tab-bar'),
  join(miniprogramDir, 'utils')
].flatMap((dirPath) => walkFiles(dirPath, ['.ts', '.js']));

for (const filePath of copyRestrictedFiles) {
  const source = readFileSync(filePath, 'utf8');
  if (chineseCharacterPattern.test(source)) errors.push(`${relativeToRoot(filePath)}: move user-facing Chinese copy to dictionaries/services/constants`);
}

for (const filePath of routeRestrictedFiles) {
  const source = readFileSync(filePath, 'utf8');
  if (pageRouteLiteralPattern.test(source)) errors.push(`${relativeToRoot(filePath)}: use pageRoutes/pageUrls instead of literal /pages/... paths`);
}

for (const fileName of customTabBarRequiredFiles) {
  const filePath = join(miniprogramDir, 'custom-tab-bar', fileName);
  if (!existsSync(filePath)) errors.push(`custom-tab-bar: missing ${fileName}`);
}
assertCompiledOutputFresh(join(miniprogramDir, 'custom-tab-bar/index.ts'), join(miniprogramDir, 'custom-tab-bar/index.js'), 'custom-tab-bar');

for (const componentDir of componentDirs) {
  const componentName = componentDir.split('/').pop();
  for (const fileName of componentRequiredFiles) {
    const filePath = join(componentDir, fileName);
    if (!existsSync(filePath)) errors.push(`${componentName}: missing ${fileName}`);
  }
  assertCompiledOutputFresh(join(componentDir, 'index.ts'), join(componentDir, 'index.js'), componentName);
  const componentJsonPath = join(componentDir, 'index.json');
  if (!existsSync(componentJsonPath)) continue;
  const componentJson = readJson(componentJsonPath);
  if (componentJson.component !== true) errors.push(`${componentName}: index.json must set component: true`);
  for (const [declaredName, declaredPath] of Object.entries(componentJson.usingComponents || {})) {
    const declaredJsonPath = toComponentJsonPath(componentDir, declaredPath);
    if (declaredPath.startsWith('tdesign-miniprogram/')) {
      const npmComponentJsonPath = toNpmComponentJsonPath(declaredPath);
      if (!existsSync(npmComponentJsonPath)) errors.push(`${componentName}: npm component <${declaredName}> path not found: ${declaredPath}`);
    } else if (!existsSync(declaredJsonPath)) {
      errors.push(`${componentName}: component <${declaredName}> path not found: ${declaredPath}`);
    }
  }
}

for (const route of pageRoutes) {
  const appPagePath = toAppPagePath(route.route);
  if (!appPages.includes(appPagePath)) errors.push(`pageRoutes.${route.key}: route is not registered in app.json: ${route.route}`);
}

for (const appPage of appPages) {
  if (!routePagePaths.includes(appPage)) errors.push(`app.json pages: page is not present in pageRoutes: ${appPage}`);
}

for (const tabBarItem of appJson.tabBar?.list || []) {
  if (!appPages.includes(tabBarItem.pagePath)) errors.push(`tabBar.${tabBarItem.text}: page is not registered in app.json: ${tabBarItem.pagePath}`);
  if (!routePagePaths.includes(tabBarItem.pagePath)) errors.push(`tabBar.${tabBarItem.text}: page is not present in pageRoutes: ${tabBarItem.pagePath}`);
}

const configuredTabBarPaths = (appJson.tabBar?.list || []).map((item) => `/${item.pagePath}`);
const codeTabBarPaths = extractTabBarPaths(navigationSource, pageRoutes);
const routeKeyByPath = new Map(pageRoutes.map((route) => [route.route, route.key]));
const tabBarRouteKeys = new Set(configuredTabBarPaths.map((route) => routeKeyByPath.get(route)).filter(Boolean));
const nonTabBarRouteKeys = new Set(pageRoutes.map((route) => route.key).filter((key) => !tabBarRouteKeys.has(key)));
for (const tabBarPath of codeTabBarPaths) {
  if (!configuredTabBarPaths.includes(tabBarPath)) errors.push(`tabBarItems: path is not present in app.json tabBar.list: ${tabBarPath}`);
}
for (const tabBarPath of configuredTabBarPaths) {
  if (!codeTabBarPaths.includes(tabBarPath)) errors.push(`app.json tabBar.list: path is not present in tabBarItems: ${tabBarPath}`);
}

for (const filePath of routeRestrictedFiles) {
  const source = readFileSync(filePath, 'utf8');
  assertNavigationApis(filePath, source, tabBarRouteKeys, nonTabBarRouteKeys);
}

for (const page of appJson.pages || []) {
  const pageBasePath = join(miniprogramDir, page);
  const pageJsonPath = `${pageBasePath}.json`;
  const pageWxmlPath = `${pageBasePath}.wxml`;
  const pageTsPath = `${pageBasePath}.ts`;
  const pageJsPath = `${pageBasePath}.js`;

  if (!existsSync(pageJsonPath)) errors.push(`${page}: missing page json`);
  if (!existsSync(pageWxmlPath)) errors.push(`${page}: missing page wxml`);
  if (!existsSync(pageTsPath)) errors.push(`${page}: missing page ts`);
  if (!existsSync(pageJsPath)) errors.push(`${page}: missing page js output; run npx tsc --noEmit false`);
  assertCompiledOutputFresh(pageTsPath, pageJsPath, page);
  if (!existsSync(pageJsonPath) || !existsSync(pageWxmlPath)) continue;

  const pageJson = readJson(pageJsonPath);
  const declaredComponents = { ...globalComponents, ...(pageJson.usingComponents || {}) };
  const pageWxml = readFileSync(pageWxmlPath, 'utf8');
  const pageWxssPath = `${pageBasePath}.wxss`;
  const pageWxss = existsSync(pageWxssPath) ? readFileSync(pageWxssPath, 'utf8') : '';
  const usedComponents = unique([...pageWxml.matchAll(customComponentPattern)].map((match) => match[1]));

  if (bottomActionPattern.test(pageWxml)) {
    if (!qyPagePattern.test(pageWxml)) {
      errors.push(`${page}: pages with <qy-bottom-action> must use the qy-page root spacing container`);
    }
    if (!utilityImportPattern.test(pageWxss) && !localQyPagePaddingPattern.test(pageWxss)) {
      errors.push(`${page}: pages with <qy-bottom-action> must import utilities.wxss or define qy-page bottom spacing`);
    }
  }

  if (bottomActionPattern.test(pageWxml) && fixedSummaryPattern.test(pageWxml) && !doubleFixedPaddingPattern.test(pageWxss)) {
    errors.push(`${page}: pages combining bottom-summary and <qy-bottom-action> need at least 240rpx qy-page bottom spacing`);
  }

  for (const componentName of usedComponents) {
    const componentPath = declaredComponents[componentName];
    if (!componentPath) {
      errors.push(`${page}: missing usingComponents declaration for <${componentName}>`);
      continue;
    }
    const componentJsonPath = toComponentJsonPath(dirname(pageJsonPath), componentPath);
    if (componentPath.startsWith('tdesign-miniprogram/')) {
      const npmComponentJsonPath = toNpmComponentJsonPath(componentPath);
      if (!existsSync(npmComponentJsonPath)) errors.push(`${page}: npm component <${componentName}> path not found: ${componentPath}`);
    } else if (!existsSync(componentJsonPath)) {
      errors.push(`${page}: component <${componentName}> path not found: ${componentPath}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated ${appJson.pages.length} miniprogram pages, ${componentDirs.length} local components, ${configuredTabBarPaths.length} tabBar routes, JS output freshness, custom tabBar files, npm components, component declarations, copy placement, route literals, navigation APIs, and bottom action spacing.`);
