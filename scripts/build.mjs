import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
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

function obfuscateFile(src, dest) {
  const code = readFileSync(src, 'utf8');
  const result = JavaScriptObfuscator.obfuscate(code, obf).getObfuscatedCode();
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, result, 'utf8');
}

function copyFile(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, readFileSync(src));
}

if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

['index.html', 'admin.html', 'pool.css', 'styles.css', 'icon.png'].forEach((f) => {
  copyFile(join(root, f), join(out, f));
});

cpSync(join(root, 'img'), join(out, 'img'), { recursive: true });

obfuscateFile(join(root, 'app.js'), join(out, 'app.js'));
obfuscateFile(join(root, 'admin.js'), join(out, 'admin.js'));
obfuscateFile(join(root, 'config.js'), join(out, 'config.js'));

console.log('Build complete → public/');
