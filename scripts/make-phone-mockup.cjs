/*
 * Mockup iPhone tampak depan (tegak), latar transparan — gayanya sama dengan mockup HP di halaman
 * Rayspeed: bingkai hitam dengan tepi logam tipis, Dynamic Island, tombol samping, sudut layar bulat.
 * Screenshot sebaiknya sudah berisi status bar (jam 9:41 dsb).
 *
 * Pakai: node scripts/make-phone-mockup.cjs <screenshot> <out.webp>
 */
const sharp = require('sharp');

const [, , IN, OUT] = process.argv;
const SW = 640;                 // lebar layar (px)
const BEZEL = 22;               // tebal bingkai hitam
const RIM = 5;                  // tepi logam di luar bingkai
const BTN = 7;                  // tombol samping menonjol

(async () => {
  const meta = await sharp(IN).metadata();
  const SH = Math.round((meta.height * SW) / meta.width);
  const PW = SW + 2 * (BEZEL + RIM), PH = SH + 2 * (BEZEL + RIM);
  const W = PW + 2 * BTN, H = PH;
  const R = Math.round(PW * 0.15), SR = Math.round(SW * 0.115);
  const x0 = BTN, sx = x0 + RIM + BEZEL, sy = RIM + BEZEL;

  const screenMask = Buffer.from(`<svg width="${SW}" height="${SH}"><rect width="${SW}" height="${SH}" rx="${SR}" fill="#fff"/></svg>`);
  const screen = await sharp(IN).resize(SW, SH).ensureAlpha().composite([{ input: screenMask, blend: 'dest-in' }]).png().toBuffer();

  const frame = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b5b60"/><stop offset="0.5" stop-color="#2a2a2e"/><stop offset="1" stop-color="#4a4a4f"/></linearGradient>
      <linearGradient id="btn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a3a3e"/><stop offset="1" stop-color="#1c1c1f"/></linearGradient>
    </defs>
    <!-- tombol samping: kiri (aksi, volume +, volume −), kanan (power) -->
    <rect x="0" y="${PH * 0.17}" width="${BTN + 4}" height="${PH * 0.045}" rx="3" fill="url(#btn)"/>
    <rect x="0" y="${PH * 0.25}" width="${BTN + 4}" height="${PH * 0.075}" rx="3" fill="url(#btn)"/>
    <rect x="0" y="${PH * 0.345}" width="${BTN + 4}" height="${PH * 0.075}" rx="3" fill="url(#btn)"/>
    <rect x="${W - BTN - 4}" y="${PH * 0.28}" width="${BTN + 4}" height="${PH * 0.11}" rx="3" fill="url(#btn)"/>
    <!-- bodi: tepi logam lalu bingkai hitam -->
    <rect x="${x0}" y="0" width="${PW}" height="${PH}" rx="${R}" fill="url(#rim)"/>
    <rect x="${x0 + RIM}" y="${RIM}" width="${PW - 2 * RIM}" height="${PH - 2 * RIM}" rx="${R - RIM}" fill="#0b0b0c"/>
  </svg>`);
  const island = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${sx + SW / 2 - SW * 0.15}" y="${sy + SW * 0.028}" width="${SW * 0.3}" height="${SW * 0.085}" rx="${SW * 0.0425}" fill="#050505"/>
  </svg>`);

  await sharp(frame)
    .composite([{ input: screen, left: sx, top: sy }, { input: island, left: 0, top: 0 }])
    .webp({ quality: 90, alphaQuality: 95, effort: 6 })
    .toFile(OUT);
  console.log('✓', OUT, W + '×' + H);
})();
