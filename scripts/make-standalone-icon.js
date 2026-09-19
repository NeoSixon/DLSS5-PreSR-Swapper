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
    <linearGradient id="bg" x1="120" y1="90" x2="900" y2="940" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#18232d"/>
      <stop offset=".46" stop-color="#0b1219"/>
      <stop offset="1" stop-color="#05090d"/>
    </linearGradient>
    <linearGradient id="edge" x1="110" y1="100" x2="920" y2="920" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#50616c" stop-opacity=".76"/>
      <stop offset=".48" stop-color="#1f2a31" stop-opacity=".42"/>
      <stop offset="1" stop-color="#5cf34d" stop-opacity=".58"/>
    </linearGradient>
    <linearGradient id="blade" x1="930" y1="92" x2="610" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#b5ff7a"/>
      <stop offset=".34" stop-color="#69f04f"/>
      <stop offset="1" stop-color="#257f27" stop-opacity=".08"/>
    </linearGradient>
    <linearGradient id="nr" x1="235" y1="350" x2="790" y2="685" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#a4ff78"/>
      <stop offset=".46" stop-color="#67f252"/>
      <stop offset="1" stop-color="#4bdc43"/>
    </linearGradient>
    <radialGradient id="ambient" cx="68%" cy="42%" r="56%">
      <stop offset="0" stop-color="#69f04f" stop-opacity=".13"/>
      <stop offset=".55" stop-color="#69f04f" stop-opacity=".035"/>
      <stop offset="1" stop-color="#69f04f" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="13"/>
    </filter>
  </defs>

  <rect x="70" y="70" width="884" height="884" rx="210" fill="url(#bg)"/>
  <rect x="76" y="76" width="872" height="872" rx="204" fill="none" stroke="url(#edge)" stroke-width="9"/>
  <ellipse cx="610" cy="470" rx="355" ry="330" fill="url(#ambient)"/>

  <path d="M760 76H928V238L672 494L620 410Z" fill="url(#blade)" opacity=".86"/>
  <path d="M781 77H928V176L650 455" fill="none" stroke="#d7ffae" stroke-opacity=".24" stroke-width="10"/>

  <path d="M246 674V350L454 674V350H626
           C708 350 760 393 760 457
           C760 522 708 557 626 557H454
           M620 557L792 686"
        fill="none" stroke="#0b120d" stroke-width="76" stroke-linecap="round" stroke-linejoin="round"
        opacity=".72" filter="url(#shadow)"/>
  <path d="M246 674V350L454 674V350H626
           C708 350 760 393 760 457
           C760 522 708 557 626 557H454
           M620 557L792 686"
        fill="none" stroke="url(#nr)" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>

  <path d="M246 674V350L454 674V350H626"
        fill="none" stroke="#d7ffbd" stroke-width="7" stroke-linecap="round" opacity=".15"/>
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
