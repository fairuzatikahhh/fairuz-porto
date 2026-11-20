/*
 * Mockup iPhone 16 miring (dari PSD mockups-design "Free iPhone 16 Mockup 2") → isi layar diganti
 * screenshot sendiri, latar transparan + bayangan lembut.
 *
 * Langkah sebelumnya: node scripts/psd-layers.cjs <psd> frames/raw/detail/mockup16/layers
 * Layer yang dipakai: 1 Shadows (+mask), 4 iPhone, 7 Design (layar terdistorsi), 8 mask grup Design,
 * 10 Highlights (blend screen).
 *
 * Pakai: node scripts/make-iphone16-mockup.cjs <screenshot> <out.webp> [tinggiOut=1400]
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '../frames/raw/detail/mockup16/layers');
const [, , IN, OUT, OUT_H = '1400'] = process.argv;
const W = 4000, H = 3000;
const CROP = { left: 900, top: 470, width: 2100, height: 2290 }; // area bodi HP + bayangan lantai
const info = JSON.parse(fs.readFileSync(path.join(DIR, 'layers.json')));
const raw = async (f) => (await sharp(path.join(DIR, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }));

// homografi: titik (u,v) di persegi sumber → (x,y)
function homography(src, dst) {
  const A = [], B = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i], [x, y] = dst[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); B.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); B.push(y);
  }
  // eliminasi Gauss
  for (let c = 0; c < 8; c++) {
    let m = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
    [A[c], A[m]] = [A[m], A[c]]; [B[c], B[m]] = [B[m], B[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; B[r] -= f * B[c]; }
  }
  const h = B.map((v, i) => v / A[i][i]);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}
function invert3(m) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, Bv = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * Bv + c * C;
  return [A, -(b * i - c * h), b * f - c * e, Bv, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((v) => v / det);
}

(async () => {
  const L = (i) => info.find((r) => r.i === i);
  const design = L(7), gmask = L(8).mask, phoneL = L(4), shadowL = L(1);
  const d = await raw(design.file);
  // sudut layar = titik-titik ekstrem alpha layer Design
  let best = { l: [1e9], t: [1e9], r: [-1e9], b: [-1e9] };
  for (let y = 0; y < d.info.height; y++) for (let x = 0; x < d.info.width; x++) {
    if (d.data[(y * d.info.width + x) * 4 + 3] < 128) continue;
    const X = x + design.left, Y = y + design.top;
    if (X < best.l[0]) best.l = [X, Y]; if (Y < best.t[1] || best.t[0] === 1e9) { if (best.t[0] === 1e9 || Y < best.t[1]) best.t = [X, Y]; }
    if (X > best.r[0]) best.r = [X, Y]; if (Y > best.b[1] || best.b[0] === -1e9) { if (best.b[0] === -1e9 || Y > best.b[1]) best.b = [X, Y]; }
  }
  // kiri = kiri-atas layar, atas = kanan-atas, kanan = kanan-bawah, bawah = kiri-bawah
  const quad = [best.l, best.t, best.r, best.b].map(([x, y]) => [x + 0.5, y + 0.5]);
  console.log('quad', JSON.stringify(quad));
  // layar sumber 948×2049 (ukuran smart object asli), dirender 2× agar tajam
  const SW = 948 * 2, SH = 2049 * 2;
  const shot = await sharp(IN).resize(SW, SH, { fit: 'fill', kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
  const Hm = invert3(homography([[0, 0], [SW, 0], [SW, SH], [0, SH]], quad));
  const m8 = (await sharp(path.join(DIR, L(8).maskFile)).extractChannel(0).raw().toBuffer({ resolveWithObject: true }));
  const mw = gmask.right - gmask.left;

  const out = Buffer.alloc(W * H * 4);
  // 1) bayangan: warna layer × alpha × mask
  const sh = await raw(shadowL.file), shm = await sharp(path.join(DIR, shadowL.maskFile)).extractChannel(0).raw().toBuffer();
  const smk = shadowL.mask, smw = smk.right - smk.left;
  for (let y = 0; y < sh.info.height; y++) for (let x = 0; x < sh.info.width; x++) {
    const X = x + shadowL.left, Y = y + shadowL.top; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
    const s = (y * sh.info.width + x) * 4, mx = X - smk.left, my = Y - smk.top;
    const mv = mx >= 0 && my >= 0 && mx < smw && my < smk.bottom - smk.top ? shm[my * smw + mx] : smk.def;
    const o = (Y * W + X) * 4;
    out[o] = sh.data[s]; out[o + 1] = sh.data[s + 1]; out[o + 2] = sh.data[s + 2]; const cl = (v) => Math.max(0, Math.min(1, v)), ss = (v) => v * v * (3 - 2 * v);
    // pudar sebelum tepi potongan (lihat CROP) agar bayangan tidak terpotong tajam
    const fade = ss(cl((X - CROP.left) / 420)) * ss(cl((CROP.left + CROP.width - X) / 120)) * ss(cl((CROP.top + CROP.height - Y) / 90));
    out[o + 3] = Math.round((sh.data[s + 3] * mv * fade) / 255);
  }
  const over = (o, r, g, b, a) => { // a 0..1, "normal" di atas out
    const da = out[o + 3] / 255, oa = a + da * (1 - a);
    if (oa <= 0) return;
    out[o] = Math.round((r * a + out[o] * da * (1 - a)) / oa); out[o + 1] = Math.round((g * a + out[o + 1] * da * (1 - a)) / oa);
    out[o + 2] = Math.round((b * a + out[o + 2] * da * (1 - a)) / oa); out[o + 3] = Math.round(oa * 255);
  };
  // 2) bodi iPhone
  const ph = await raw(phoneL.file);
  for (let y = 0; y < ph.info.height; y++) for (let x = 0; x < ph.info.width; x++) {
    const s = (y * ph.info.width + x) * 4; if (!ph.data[s + 3]) continue;
    over(((y + phoneL.top) * W + x + phoneL.left) * 4, ph.data[s], ph.data[s + 1], ph.data[s + 2], ph.data[s + 3] / 255);
  }
  // 3) layar: screenshot dipetakan ke quad, alpha = alpha Design × mask grup
  for (let y = 0; y < d.info.height; y++) for (let x = 0; x < d.info.width; x++) {
    const X = x + design.left, Y = y + design.top;
    const mx = X - gmask.left, my = Y - gmask.top;
    const mv = mx >= 0 && my >= 0 && mx < mw && my < gmask.bottom - gmask.top ? m8.data[my * mw + mx] : gmask.def;
    const a = (d.data[(y * d.info.width + x) * 4 + 3] * mv) / 65025; if (a <= 0) continue;
    const px = X + 0.5, py = Y + 0.5, wq = Hm[6] * px + Hm[7] * py + Hm[8];
    let u = (Hm[0] * px + Hm[1] * py + Hm[2]) / wq - 0.5, v = (Hm[3] * px + Hm[4] * py + Hm[5]) / wq - 0.5;
    u = Math.min(SW - 1.001, Math.max(0, u)); v = Math.min(SH - 1.001, Math.max(0, v));
    const u0 = u | 0, v0 = v | 0, fu = u - u0, fv = v - v0, rgb = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      const p00 = shot[(v0 * SW + u0) * 3 + c], p10 = shot[(v0 * SW + u0 + 1) * 3 + c], p01 = shot[((v0 + 1) * SW + u0) * 3 + c], p11 = shot[((v0 + 1) * SW + u0 + 1) * 3 + c];
      rgb[c] = (p00 * (1 - fu) + p10 * fu) * (1 - fv) + (p01 * (1 - fu) + p11 * fu) * fv;
    }
    over((Y * W + X) * 4, rgb[0], rgb[1], rgb[2], a);
  }
  // 4) highlights (blend screen) — hanya di area bodi/layar
  const hl = await raw(L(10).file);
  for (let i = 0; i < W * H; i++) {
    const o = i * 4; if (out[o + 3] < 250) continue; // bayangan/latar tidak disentuh
    if (i % W < phoneL.left || i % W >= phoneL.left + phoneL.w || ((i / W) | 0) < phoneL.top || ((i / W) | 0) >= phoneL.top + phoneL.h) continue;
    for (let c = 0; c < 3; c++) out[o + c] = 255 - ((255 - out[o + c]) * (255 - hl.data[o + c])) / 255;
  }
  const full = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).extract(CROP).png().toBuffer();
  await sharp(full).resize({ height: +OUT_H }).webp({ quality: 88, alphaQuality: 90, effort: 6 }).toFile(OUT);
  const m = await sharp(OUT).metadata();
  console.log('✓', OUT, m.width + '×' + m.height, Math.round(fs.statSync(OUT).size / 1024) + 'KB');
})();
