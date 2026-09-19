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
    <radialGradient id="ambient" cx="50%" cy="52%" r="54%">
      <stop offset="0" stop-color="#69f05d" stop-opacity=".08"/>
      <stop offset=".78" stop-color="#69f05d" stop-opacity=".015"/>
      <stop offset="1" stop-color="#69f05d" stop-opacity="0"/>
    </radialGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>
  <rect x="82" y="82" width="860" height="860" rx="186" fill="#081117" stroke="#35683c" stroke-opacity=".58" stroke-width="8"/>
  <circle cx="512" cy="526" r="304" fill="url(#ambient)"/>
  <g fill="none" stroke="#72f45a" stroke-width="46" stroke-linecap="round" stroke-linejoin="round" opacity=".16" filter="url(#softGlow)">
    <path d="M255 660V364L455 660V364"/>
    <path d="M565 660V364H700L776 404V500L700 540H565M700 540L792 672"/>
  </g>
  <g fill="none" stroke="#72f45a" stroke-width="46" stroke-linecap="round" stroke-linejoin="round">
    <path d="M255 660V364L455 660V364"/>
    <path d="M565 660V364H700L776 404V500L700 540H565M700 540L792 672"/>
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
