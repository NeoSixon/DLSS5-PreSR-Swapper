'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('standalone app does not load the upstream product shell', () => {
  const main = read('standalone/main.js');
  assert.doesNotMatch(main, /require\s*\(\s*['"]\.\.\/main\.js['"]\s*\)/);
  assert.doesNotMatch(main, /\.\.\/src\/core\/(?:scan|apply|feeder-config|optiscaler|presr-bootstrap)/);
  assert.doesNotMatch(main, /community-client|admin-vault|RenoDX/i);
});

test('standalone core has no Feeder, RenoDX, emulator or Community module dependencies', () => {
  const files = [
    'standalone/core/game-scan.js',
    'standalone/core/file-state.js',
    'standalone/core/runtime.js',
    'standalone/core/optiscaler.js',
    'standalone/core/ini.js',
    'standalone/core/download.js'
  ];
  const source = files.map(read).join('\n');
  assert.doesNotMatch(source, /src\/core\/(?:scan|apply|feeder-config|runtime-components|presr-bootstrap)/);
  // Third-party packages can legitimately carry attribution files whose names
  // contain terms such as RenoDX. What must not survive here is a code/module
  // dependency on the old product surfaces themselves.
  assert.doesNotMatch(source, /require\s*\(\s*['"][^'"]*(?:community-client|admin-vault|emulators|feeder-release|renodx)[^'"]*['"]\s*\)/i);
});

test('retained upstream-derived code is isolated behind an attributed boundary', () => {
  const pe = read('standalone/core/derived/pe.js');
  assert.match(pe, /DLSS5-Swapper by Rakan Alkhaldi/);
  assert.match(pe, /MIT License/);
});

test('standalone renderer has no Community or Chat product surfaces', () => {
  const html = read('standalone/renderer/index.html');
  assert.doesNotMatch(html, /data-page=["'](?:community|chat)["']/i);
});

test('standalone launcher is explicit and separate from the legacy app', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['start:standalone'], 'electron standalone');
  assert.equal(pkg.main, 'presr-main.js');
});

test('standalone app keeps English and Simplified Chinese as exclusive UI locales', () => {
  const renderer = read('standalone/renderer/app.js');
  assert.match(renderer, /\ben:\s*\{/);
  assert.match(renderer, /['"]zh-CN['"]:\s*\{/);
  assert.match(renderer, /whereWindsMeet:\s*'Where Winds Meet'/);
  assert.match(renderer, /whereWindsMeet:\s*'燕云十六声'/);
});

test('standalone INI editor updates one section without requiring Feeder config', () => {
  const ini = require(path.join(root, 'standalone/core/ini'));
  let text = '[DlssNr]\r\nEnabled=false\r\n\r\n[Other]\r\nValue=1';
  text = ini.set(text, 'DlssNr', 'RunBeforeSR', 'true');
  text = ini.set(text, 'DlssNr', 'Enabled', 'true');
  assert.equal(ini.get(text, 'DlssNr', 'Enabled'), 'true');
  assert.equal(ini.get(text, 'DlssNr', 'RunBeforeSR'), 'true');
  assert.equal(ini.get(text, 'Other', 'Value'), '1');
});

test('standalone file state rejects paths outside the managed game root', () => {
  const fileState = require(path.join(root, 'standalone/core/file-state'));
  const game = path.join(root, 'tmp-game');
  assert.throws(() => fileState.safePath(game, path.join('..', 'outside.dll')), /escapes managed root/);
  assert.equal(fileState.safePath(game, path.join('bin', 'inside.dll')), path.join(game, 'bin', 'inside.dll'));
});

test('OptiScaler config writes independent styles for all three model passes', () => {
  const optiscaler = require(path.join(root, 'standalone/core/optiscaler'));
  const ini = require(path.join(root, 'standalone/core/ini'));
  const configured = optiscaler.configure('[DlssNr]\r\nEnabled=false', { exePath: path.join(root, 'Game.exe') }, {
    runBeforeSR: true,
    passes: 3,
    pass1Style: '0',
    pass2Style: '1',
    pass3Style: '2'
  });
  assert.equal(ini.get(configured, 'DlssNr', 'Passes'), '3');
  assert.equal(ini.get(configured, 'DlssNr', 'Style'), '0');
  assert.equal(ini.get(configured, 'DlssNr', 'Pass2Style'), '1');
  assert.equal(ini.get(configured, 'DlssNr', 'Pass3Style'), '2');
});

test('later pass styles default to backend inheritance', () => {
  const optiscaler = require(path.join(root, 'standalone/core/optiscaler'));
  const ini = require(path.join(root, 'standalone/core/ini'));
  const configured = optiscaler.configure('', { exePath: path.join(root, 'Game.exe') }, { passes: 2 });
  assert.equal(ini.get(configured, 'DlssNr', 'Style'), 'auto');
  assert.equal(ini.get(configured, 'DlssNr', 'Pass2Style'), 'auto');
  assert.equal(ini.get(configured, 'DlssNr', 'Pass3Style'), 'auto');
});

test('per-pass style controls are present in the standalone UI', () => {
  const html = read('standalone/renderer/index.html');
  assert.match(html, /id="pass1Style"/);
  assert.match(html, /id="pass2Style"/);
  assert.match(html, /id="pass3Style"/);
  assert.match(html, /data-i18n="inheritPass1"/);
});

test('standalone packaging has its own DLSS 5 product identity and entry point', () => {
  const pkg = JSON.parse(read('package.json'));
  const config = JSON.parse(read('standalone/electron-builder.json'));
  assert.equal(pkg.scripts['build:standalone:portable'], 'electron-builder --config standalone/electron-builder.json --win portable');
  assert.equal(config.productName, 'DLSS 5 Neural Rendering Manager');
  assert.equal(config.appId, 'com.doublesixun.dlss5nrmanager');
  assert.equal(config.extraMetadata.name, 'dlss5-neural-rendering-manager');
  assert.equal(config.extraMetadata.version, '0.1.0');
  assert.equal(config.extraMetadata.main, 'standalone/main.js');
  assert.deepEqual(config.win.target, ['portable']);
  assert.match(config.files.join('\n'), /standalone\/\*\*\/\*/);
  assert.doesNotMatch(config.files.join('\n'), /src\/\*\*/);
});

test('standalone shell uses the NR wordmark instead of the legacy green 5 tile', () => {
  const html = read('standalone/renderer/index.html');
  const css = read('standalone/renderer/style.css');
  assert.match(html, /class="brand-mark"/);
  assert.match(html, /class="brand-title">DLSS 5</);
  assert.doesNotMatch(html, /class="logo">5</);
  assert.doesNotMatch(html, /data-i18n="productSubtitle"/);
  assert.match(css, /\.brand-mark path/);
  assert.match(css, /stroke:#72f45a/);
  assert.match(css, /stroke-width:6\.5/);
  assert.match(css, /drop-shadow\(0 0 5px/);
});

test('standalone build generates and uses its own NR application icon', () => {
  const pkg = JSON.parse(read('package.json'));
  const main = read('standalone/main.js');
  const iconScript = read('scripts/make-standalone-icon.js');
  assert.equal(pkg.scripts['icon:standalone'], 'electron scripts/make-standalone-icon.js');
  assert.equal(pkg.scripts['prebuild:standalone:portable'], 'npm run icon:standalone');
  assert.equal(pkg.scripts['prestart:standalone'], 'npm run icon:standalone');
  assert.match(main, /renderer['"], 'app-icon\.png/);
  assert.match(iconScript, /DLSS 5 Neural Rendering Manager standalone icon/);
  assert.match(iconScript, /build\/icon\.ico|icon\.ico/);
  assert.match(iconScript, /app-icon\.png/);
  assert.match(iconScript, /stroke-width="46"/);
  assert.doesNotMatch(iconScript, /stroke-width="60"/);
});

test('settings includes a Buy Me a Coffee support card with a bundled QR code', () => {
  const html = read('standalone/renderer/index.html');
  const app = read('standalone/renderer/app.js');
  const preload = read('standalone/preload.js');
  const main = read('standalone/main.js');
  assert.match(html, /supportOpenBtn/);
  assert.match(html, /assets\/buymeacoffee-qr\.png/);
  assert.match(html, /buymeacoffee\.com\/NeoSixon/);
  assert.match(app, /supportTitle: '支持开发'/);
  assert.match(app, /window\.nrApp\.openSupport\(\)/);
  assert.match(preload, /app:open-support/);
  assert.match(main, /https:\/\/buymeacoffee\.com\/NeoSixon/);
  assert.match(main, /shell\.openExternal\(SUPPORT_URL\)/);
  const qr = path.join(root, 'standalone/renderer/assets/buymeacoffee-qr.png');
  assert.ok(fs.existsSync(qr), 'support QR should be bundled with standalone renderer assets');
  assert.ok(fs.statSync(qr).size > 1000, 'support QR should not be empty');
});
