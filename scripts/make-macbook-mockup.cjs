/*
 * Mockup MacBook tampak depan (sederhana): layar macOS dengan bilah menu, wallpaper lembut,
 * jendela aplikasi/browser di tengah, dan dock kecil; di bawahnya alas MacBook.
 *
 * Pakai: node scripts/make-macbook-mockup.cjs <screenshot.png> <out.webp> [warnaWallpaper1] [warnaWallpaper2] [--titlebar]
 *   --titlebar : screenshot tanpa bilah browser → ditambah bilah jendela macOS (tiga titik merah-kuning-hijau)
 *   --fullscreen --title="Judul" : aplikasi memenuhi seluruh layar (lebar penuh, tanpa wallpaper/dock),
 *                  dengan bilah jendela gelap berisi tiga titik & judul
 *   --crop-top=0.16 : buang bagian atas screenshot (mis. bilah browser) sebelum dipasang
 *   --cover : isi layar penuh (lebar & tinggi), kelebihan kiri-kanan dipotong rata tengah
 */
const sharp = require('sharp');

const ARGS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const TITLEBAR = process.argv.includes('--titlebar');
const FULLSCREEN = process.argv.includes('--fullscreen');
const TITLE = (process.argv.find((a) => a.startsWith('--title=')) || '--title=').slice(8);
const CROP_TOP = parseFloat((process.argv.find((a) => a.startsWith('--crop-top=')) || '--crop-top=0').slice(11));
const COVER = process.argv.includes('--cover');
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const [IN, OUT, C1 = '#d7e7e5', C2 = '#efe4dc'] = ARGS;
const TB_H = 46; // tinggi bilah jendela

// ukuran (px) — layar 16:10 seperti MacBook
const SCREEN = { w: 1880, h: 1175 };
const BEZEL = 44;            // tebal bingkai layar
const LID = { w: SCREEN.w + BEZEL * 2, h: SCREEN.h + BEZEL * 2 + 14 };
const BASE = { w: LID.w + 220, h: 46 };
const W = BASE.w, H = LID.h + BASE.h;
const lidX = (W - LID.w) / 2;
const scrX = lidX + BEZEL, scrY = BEZEL;

const MENU_H = 34;
const DOCK = { w: 600, h: 74, r: 22 };

// layar penuh: bilah jendela gelap + aplikasi selebar layar, terpotong di bawah oleh bingkai
async function fullscreenScreen() {
  const bar = 54;
  const meta = await sharp(IN).metadata();
  const cut = Math.round(meta.height * CROP_TOP);
  const src = await sharp(IN).extract({ left: 0, top: cut, width: meta.width, height: meta.height - cut }).png().toBuffer();
  const sh = meta.height - cut;
  let shot;
  if (COVER) {
    shot = await sharp(src).resize(SCREEN.w, SCREEN.h - bar, { fit: 'cover', position: 'top' }).png().toBuffer();
  } else {
    const shotH = Math.round((sh * SCREEN.w) / meta.width);
    const visH = Math.min(shotH, SCREEN.h - bar);
    shot = await sharp(src).resize(SCREEN.w, shotH).extract({ left: 0, top: 0, width: SCREEN.w, height: visH }).png().toBuffer();
  }
  const barSvg = Buffer.from(`<svg width="${SCREEN.w}" height="${bar}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${SCREEN.w}" height="${bar}" fill="#1e1e20"/>
    ${['#ff5f57', '#febc2e', '#28c840'].map((c, i) => `<circle cx="${30 + i * 28}" cy="${bar / 2}" r="9" fill="${c}"/>`).join('')}
    <text x="${30 + 3 * 28 + 18}" y="${bar / 2 + 8}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="#e6e6e8">${esc(TITLE)}</text>
  </svg>`);
  return sharp({ create: { width: SCREEN.w, height: SCREEN.h, channels: 4, background: '#f2f3f5' } })
    .composite([{ input: barSvg, left: 0, top: 0 }, { input: shot, left: 0, top: bar }]).png().toBuffer();
}

(async () => {
  // jendela: screenshot selebar 92% layar, sudut bawah ikut dibulatkan, berbayang
  const winW = Math.round(SCREEN.w * 0.92);
  const meta = await sharp(IN).metadata();
  const winH = Math.round((meta.height * winW) / meta.width);
  const maxH = SCREEN.h - MENU_H - 60 - DOCK.h - 46;
  const tb = TITLEBAR ? TB_H : 0;
  const h = Math.min(winH + tb, maxH);
  let shot = await sharp(IN).resize(winW, winH).extract({ left: 0, top: 0, width: winW, height: h - tb }).png().toBuffer();
  if (TITLEBAR) {
    const bar = Buffer.from(`<svg width="${winW}" height="${tb}"><rect width="${winW}" height="${tb}" fill="#ececee"/>
      <rect y="${tb - 1}" width="${winW}" height="1" fill="#d4d4d8"/>
      ${['#ff5f57', '#febc2e', '#28c840'].map((c, i) => `<circle cx="${26 + i * 24}" cy="${tb / 2}" r="7.5" fill="${c}"/>`).join('')}</svg>`);
    shot = await sharp({ create: { width: winW, height: h, channels: 4, background: '#ffffff' } })
      .composite([{ input: bar, left: 0, top: 0 }, { input: shot, left: 0, top: tb }]).png().toBuffer();
  }
  const mask = Buffer.from(`<svg width="${winW}" height="${h}"><rect width="${winW}" height="${h}" rx="22" ry="22" fill="#fff"/></svg>`);
  const win = await sharp(shot).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const winX = scrX + Math.round((SCREEN.w - winW) / 2);
  const winY = scrY + MENU_H + 26;

  const icons = ['#5ac8fa', '#34c759', '#ff9f0a', '#ff375f', '#af52de', '#0a84ff', '#30b0c7', '#8e8e93'];
  const dockX = scrX + (SCREEN.w - DOCK.w) / 2, dockY = scrY + SCREEN.h - DOCK.h - 14;
  const iconSize = 52, gap = (DOCK.w - icons.length * iconSize) / (icons.length + 1);

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C1}"/><stop offset="1" stop-color="${C2}"/></linearGradient>
    <radialGradient id="glow" cx="0.3" cy="0.25" r="0.7"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4e4e6"/><stop offset="0.55" stop-color="#c9c9cc"/><stop offset="1" stop-color="#8f8f94"/></linearGradient>
    <linearGradient id="lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a2d"/><stop offset="1" stop-color="#151517"/></linearGradient>
    <filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#1b2a33" flood-opacity="0.22"/></filter>
    <clipPath id="scr"><rect x="${scrX}" y="${scrY}" width="${SCREEN.w}" height="${SCREEN.h}" rx="14"/></clipPath>
  </defs>
  <!-- tutup (bingkai layar) -->
  <rect x="${lidX}" y="0" width="${LID.w}" height="${LID.h}" rx="46" fill="url(#lid)"/>
  <rect x="${lidX + 3}" y="3" width="${LID.w - 6}" height="${LID.h - 6}" rx="43" fill="none" stroke="#4a4a4e" stroke-width="2"/>
  <!-- layar -->
  <g clip-path="url(#scr)">
    <rect x="${scrX}" y="${scrY}" width="${SCREEN.w}" height="${SCREEN.h}" fill="url(#wall)"/>
    <rect x="${scrX}" y="${scrY}" width="${SCREEN.w}" height="${SCREEN.h}" fill="url(#glow)"/>
    <!-- bilah menu -->
    <rect x="${scrX}" y="${scrY}" width="${SCREEN.w}" height="${MENU_H}" fill="#ffffff" fill-opacity="0.55"/>
    <circle cx="${scrX + 30}" cy="${scrY + MENU_H / 2}" r="8" fill="#2b2b2b" fill-opacity="0.75"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${scrX + 58 + i * 74}" y="${scrY + MENU_H / 2 - 5}" width="${i ? 52 : 64}" height="10" rx="5" fill="#2b2b2b" fill-opacity="${i ? 0.35 : 0.6}"/>`).join('')}
    ${[0, 1, 2].map((i) => `<rect x="${scrX + SCREEN.w - 40 - i * 46}" y="${scrY + MENU_H / 2 - 5}" width="${i ? 26 : 30}" height="10" rx="5" fill="#2b2b2b" fill-opacity="0.4"/>`).join('')}
    <!-- dock -->
    <rect x="${dockX}" y="${dockY}" width="${DOCK.w}" height="${DOCK.h}" rx="${DOCK.r}" fill="#ffffff" fill-opacity="0.45" stroke="#ffffff" stroke-opacity="0.6"/>
    ${icons.map((c, i) => `<rect x="${dockX + gap + i * (iconSize + gap)}" y="${dockY + (DOCK.h - iconSize) / 2}" width="${iconSize}" height="${iconSize}" rx="13" fill="${c}"/>`).join('')}
    <!-- bayangan jendela -->
    <rect x="${winX}" y="${winY}" width="${winW}" height="${h}" rx="22" fill="#ffffff" filter="url(#sh)"/>
  </g>
  <!-- poni kamera -->
  <rect x="${W / 2 - 92}" y="${scrY - 2}" width="184" height="30" rx="12" fill="#111113"/>
  <circle cx="${W / 2}" cy="${scrY + 11}" r="5" fill="#1f2a35"/>
  <!-- alas -->
  <path d="M0 ${LID.h} H${W} V${LID.h + 14} Q${W} ${H} ${W - 70} ${H} H70 Q0 ${H} 0 ${LID.h + 14} Z" fill="url(#base)"/>
  <rect x="${W / 2 - 150}" y="${LID.h}" width="300" height="12" rx="6" fill="#a9a9ad"/>
</svg>`;

  // tempel jendela dulu di ukuran asli, baru diperkecil (sharp mengecilkan sebelum menempel)
  const layer = FULLSCREEN
    ? { input: await sharp(await fullscreenScreen()).composite([{ input: Buffer.from(`<svg width="${SCREEN.w}" height="${SCREEN.h}"><rect width="${SCREEN.w}" height="${SCREEN.h}" rx="14" fill="#fff"/></svg>`), blend: 'dest-in' }]).png().toBuffer(), left: scrX, top: scrY }
    : { input: win, left: winX, top: winY };
  const full = await sharp(Buffer.from(svg)).composite([layer]).png().toBuffer();
  await sharp(full)
    .resize({ width: 1800 })
    .webp({ quality: 88, alphaQuality: 95, effort: 6 })
    .toFile(OUT);
  const m = await sharp(OUT).metadata();
  console.log('✓', OUT, m.width + '×' + m.height);
})();
