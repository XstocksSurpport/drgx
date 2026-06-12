import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'frontend');
const out = join(root, 'public');

const obf = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

function obfuscateFile(srcPath, destPath) {
  const code = readFileSync(srcPath, 'utf8');
  const result = JavaScriptObfuscator.obfuscate(code, obf).getObfuscatedCode();
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, result, 'utf8');
}

function copyFile(srcPath, destPath) {
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, readFileSync(srcPath));
}

if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

['index.html', 'admin.html', 'pool.css', 'styles.css', 'icon.png', 'bg.jpg'].forEach((f) => {
  const p = join(src, f);
  if (existsSync(p)) copyFile(p, join(out, f));
});

if (existsSync(join(src, 'img'))) {
  cpSync(join(src, 'img'), join(out, 'img'), { recursive: true });
}

obfuscateFile(join(src, 'app.js'), join(out, 'app.js'));
obfuscateFile(join(src, 'admin.js'), join(out, 'admin.js'));
obfuscateFile(join(src, 'config.js'), join(out, 'config.js'));

console.log('Build complete → public/');
