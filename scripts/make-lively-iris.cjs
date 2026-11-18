/*
 * Membuat iris bust (public/assets/eyes-lively.png) yang SERASI dengan mata di pose badan penuh
 * (walker-stand & frame video), dari public/assets/eyes.png:
 *  - ukuran pupil sama (±0.45 jari-jari iris)
 *  - rata-rata warna iris = TARGET (diukur dari walker-stand), gradasi gelap di dekat pupil
 *    → terang ke luar, bagian bawah sedikit lebih terang
 *  - dicerminkan supaya kilau utama di KANAN atas, searah cahaya di pose badan penuh
 * eyes.png asli tidak diubah. Setelah membuat ulang, naikkan ?v= di Eyes.tsx & config.ts.
 *
 * Pakai: node scripts/make-lively-iris.cjs
 */
const sharp = require('sharp');
const path = require('path');

const SRC = path.join(__dirname, '../public/assets/eyes.png');
const OUT = path.join(__dirname, '../public/assets/eyes-lively.png');

const PUPIL_OLD = 0.44;  // jari-jari pupil di eyes.png (× jari-jari gambar)
const PUPIL_NEW = 0.45;  // jari-jari pupil — sama dengan mata pose berdiri (±0.45–0.47 dari iris)
const TARGET = [92, 69, 60];  // rata-rata warna iris pose badan penuh (diukur dari walker-stand)
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

(async () => {
  // dicerminkan: kilau bawaan eyes.png pindah ke KANAN atas, sama dengan arah cahaya di pose badan penuh
  const { data, info } = await sharp(SRC).flop().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, cx = W / 2, cy = H / 2, R = W / 2;
  const out = Buffer.alloc(W * H * 4);
  const sample = (x, y, o) => { // bilinear
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    for (let c = 0; c < 4; c++) {
      let v = 0;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
        const xx = Math.min(W - 1, Math.max(0, x0 + i)), yy = Math.min(H - 1, Math.max(0, y0 + j));
        v += data[(yy * W + xx) * 4 + c] * (i ? fx : 1 - fx) * (j ? fy : 1 - fy);
      }
      out[o + c] = v;
    }
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy, rho = Math.hypot(dx, dy) / R, o = (y * W + x) * 4;
    // 1) pupil lebih kecil: petakan radius keluaran → radius sumber
    const src = rho < PUPIL_NEW ? rho * (PUPIL_OLD / PUPIL_NEW) : PUPIL_OLD + ((rho - PUPIL_NEW) * (1 - PUPIL_OLD)) / (1 - PUPIL_NEW);
    const k = rho > 0 ? src / rho : 1;
    sample(cx + dx * k, cy + dy * k, o);
  }
  // 2) warna iris: rata-rata iris digeser ke rata-rata iris pose badan penuh (TARGET), tekstur tetap;
  //    bagian bawah sedikit lebih terang (pantulan cahaya) supaya tatapan tidak kosong
  const ringW = (rho) => smooth(PUPIL_NEW - 0.02, PUPIL_NEW + 0.02, rho) * (1 - smooth(0.93, 1.0, rho));
  // gradasi seperti pose badan penuh: gelap di dekat pupil, makin terang ke luar
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const rho = Math.hypot(x - cx, y - cy) / R, w = ringW(rho);
    if (w <= 0) continue;
    const f = 1 - w * 0.72 * (1 - smooth(PUPIL_NEW, 0.95, rho)), o = (y * W + x) * 4;
    for (let c = 0; c < 3; c++) out[o + c] *= f;
  }
  const mean = [0, 0, 0];
  let n = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const rho = Math.hypot(x - cx, y - cy) / R;
    if (rho < 0.5 || rho > 0.9) continue;
    const o = (y * W + x) * 4;
    for (let c = 0; c < 3; c++) mean[c] += out[o + c];
    n++;
  }
  const shift = mean.map((v, c) => TARGET[c] - v / n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy, rho = Math.hypot(dx, dy) / R, w = ringW(rho);
    if (w <= 0) continue;
    const o = (y * W + x) * 4;
    const below = 1 + 0.12 * Math.max(0, dy / (Math.hypot(dx, dy) || 1)) * smooth(PUPIL_NEW, 0.8, rho);
    for (let c = 0; c < 3; c++) out[o + c] = Math.min(255, Math.max(0, (out[o + c] + shift[c] * w) * (1 + (below - 1) * w)));
  }
  // 3) kilau: besar di kiri-atas, kecil di kanan-bawah
  const glow = (gx, gy, r, alpha) => {
    for (let y = Math.floor(gy - r * 1.6); y <= gy + r * 1.6; y++) for (let x = Math.floor(gx - r * 1.6); x <= gx + r * 1.6; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const d = Math.hypot(x - gx, y - gy) / r, a = alpha * (1 - smooth(0.75, 1.15, d)), o = (y * W + x) * 4;
      if (a <= 0) continue;
      for (let c = 0; c < 3; c++) out[o + c] = out[o + c] * (1 - a) + 255 * a;
    }
  };
  glow(cx + R * 0.27, cy - R * 0.29, R * 0.12, 0.9);  // kanan-atas (searah kilau pose badan penuh)
  // (satu kilau utama saja, sama dengan mata pose badan penuh)
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(OUT);
  console.log('→', path.relative(path.join(__dirname, '..'), OUT));
})();
