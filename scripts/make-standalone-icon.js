'use strict';
// DLSS 5 Neural Rendering Manager standalone icon.
// This intentionally does not reuse the legacy DLSS5-Swapper artwork.

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'build');
const WINDOW_ICON = path.join(ROOT, 'standalone', 'renderer', 'app-icon.png');
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="ambient" cx="50%" cy="54%" r="54%">
      <stop offset="0" stop-color="#69f05d" stop-opacity=".16"/>
      <stop offset=".72" stop-color="#69f05d" stop-opacity=".025"/>
      <stop offset="1" stop-color="#69f05d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#65b96a"/>
      <stop offset="1" stop-color="#2f6a3a"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect x="66" y="66" width="892" height="892" rx="214" fill="#0a1118" stroke="url(#edge)" stroke-width="10"/>
  <circle cx="512" cy="555" r="330" fill="url(#ambient)"/>
  <g fill="none" stroke="#72f45a" stroke-width="60" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)">
    <path d="M270 690V334L486 690V334"/>
    <path d="M570 690V334H704C790 334 834 382 834 456C834 532 786 570 704 570H570M704 570L836 704"/>
  </g>
</svg>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1024px;height:1024px;overflow:hidden;background:transparent}
svg{display:block;width:1024px;height:1024px}
</style></head><body>${svg}</body></html>`;

function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(images.length * 16);
  let offset = 6 + directory.length;
  images.forEach((image, i) => {
    const at = i * 16;
    directory[at] = image.size >= 256 ? 0 : image.size;
    directory[at + 1] = image.size >= 256 ? 0 : image.size;
    directory[at + 2] = 0;
    directory[at + 3] = 0;
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(image.png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += image.png.length;
  });
  return Buffer.concat([header, directory, ...images.map(image => image.png)]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    width: 1024,
    height: 1024,
    resizable: false,
    webPreferences: { offscreen: true }
  });

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await new Promise(resolve => setTimeout(resolve, 80));
  const source = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });
  win.destroy();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(WINDOW_ICON), { recursive: true });

  const images = ICO_SIZES.map(size => ({
    size,
    png: source.resize({ width: size, height: size, quality: 'best' }).toPNG()
  }));
  fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), buildIco(images));
  fs.writeFileSync(path.join(OUT_DIR, 'icon.png'), source.toPNG());
  fs.writeFileSync(WINDOW_ICON, source.resize({ width: 256, height: 256, quality: 'best' }).toPNG());

  console.log('wrote standalone NR build/icon.ico, build/icon.png and standalone/renderer/app-icon.png');
  app.quit();
}).catch(error => {
  console.error(error);
  app.exit(1);
});
