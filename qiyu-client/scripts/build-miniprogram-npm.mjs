import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = resolve(projectDir, 'node_modules/tdesign-miniprogram/miniprogram_dist');
const targetDir = resolve(projectDir, 'miniprogram/miniprogram_npm/tdesign-miniprogram');

if (!existsSync(sourceDir)) {
  throw new Error(`TDesign MiniProgram distribution not found: ${sourceDir}`);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(dirname(targetDir), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });
rmSync(resolve(targetDir, '.wechatide.ib.json'), { force: true });
console.log(`Built Mini Program npm dependencies in ${targetDir}`);
