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
    <linearGradient id="bg" x1="120" y1="80" x2="900" y2="940" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1b2731"/>
      <stop offset=".46" stop-color="#0b1219"/>
      <stop offset="1" stop-color="#05080c"/>
    </linearGradient>
    <linearGradient id="edge" x1="110" y1="90" x2="930" y2="930" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#687984" stop-opacity=".72"/>
      <stop offset=".50" stop-color="#263139" stop-opacity=".38"/>
      <stop offset="1" stop-color="#75ed58" stop-opacity=".52"/>
    </linearGradient>
    <linearGradient id="blade" x1="930" y1="90" x2="560" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#c2ff83"/>
      <stop offset=".32" stop-color="#72f45a"/>
      <stop offset="1" stop-color="#2b8e2a" stop-opacity=".08"/>
    </linearGradient>
    <linearGradient id="five" x1="300" y1="280" x2="720" y2="850" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#f4f8fa"/>
      <stop offset=".62" stop-color="#dce4e8"/>
      <stop offset="1" stop-color="#a8b6bd"/>
    </linearGradient>
    <radialGradient id="ambient" cx="69%" cy="43%" r="57%">
      <stop offset="0" stop-color="#72f45a" stop-opacity=".15"/>
      <stop offset=".55" stop-color="#72f45a" stop-opacity=".035"/>
      <stop offset="1" stop-color="#72f45a" stop-opacity="0"/>
    </radialGradient>
    <filter id="markShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <rect x="70" y="70" width="884" height="884" rx="210" fill="url(#bg)"/>
  <rect x="76" y="76" width="872" height="872" rx="204" fill="none" stroke="url(#edge)" stroke-width="9"/>
  <ellipse cx="616" cy="475" rx="360" ry="330" fill="url(#ambient)"/>

  <path d="M755 76H929V232L664 497L610 408Z" fill="url(#blade)" opacity=".88"/>
  <path d="M781 77H929V171L648 452" fill="none" stroke="#e0ffbf" stroke-opacity=".24" stroke-width="10"/>

  <path d="M318 286H775L733 386H430L401 492H594
           C738 492 819 568 819 683
           C819 822 710 884 553 884H273L323 781H553
           C645 781 703 749 703 685
           C703 626 661 595 580 595H263L345 286Z"
        fill="#000" opacity=".58" filter="url(#markShadow)"/>
  <path d="M318 286H775L733 386H430L401 492H594
           C738 492 819 568 819 683
           C819 822 710 884 553 884H273L323 781H553
           C645 781 703 749 703 685
           C703 626 661 595 580 595H263L345 286Z"
        fill="url(#five)"/>
  <path d="M430 386L401 492H594" fill="none" stroke="#a5ff78" stroke-width="13" stroke-linecap="round" opacity=".72"/>
  <path d="M323 781H553C645 781 703 749 703 685" fill="none" stroke="#72f45a" stroke-width="11" stroke-linecap="round" opacity=".38"/>
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
