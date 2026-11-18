/*
 * Mengganti kartu ID buatan AI di frame video (desainnya acak, wajahnya aneh) dengan desain
 * kartu asli (frames/raw/tries-card.png, dibuat place-card.cjs), mengikuti posisi, ukuran &
 * kemiringan kartu di tiap frame.
 *
 * Deteksi: piksel gelap di area dada → dipecah per komponen → komponen berbentuk garis panjang
 * (tali lanyard) dibuang, potongan kartu (potret terang di tengah memecah kartu) digabung →
 * persegi panjang terkecil (dicoba sudut −30°…30°) yang memuat semuanya.
 *
 * Pakai: node scripts/fix-video-cards.cjs <folder-frame> <kartu.png> [--debug <folder-out>]
 *   env OUT_DIR=<folder>   simpan hasil ke folder lain (default: menimpa frame), nama diberi PREFIX
 *   env PREFIX=<nama>      awalan nama file hasil di OUT_DIR (mis. s4-job2)
 *   env ONLY=<a,b,...>     hanya frame ini (nama file)
 *   env STRAP=<#rrggbb>    tali lanyard (hitam) diwarnai ulang, bayangan tetap
 *   env RECT=cx,cy,w,h[,derajat]  posisi kartu ditentukan manual (mis. kartu berwarna terang yang
 *                                 tidak terdeteksi otomatis)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const [, , DIR, CARD, FLAG, DEBUG_DIR] = require.main === module ? process.argv : [];
const DEBUG = FLAG === '--debug';
const DARK = 80;   // batas kecerahan "gelap" (kartu & tali hitam)
const ERODE = 1;   // erosi kecil: hanya membuang bintik/garis tepi 1–2 px
const PAD = 3;     // kartu sedikit diperbesar supaya tepi kartu lama tertutup
const ASPECT = 1.5;  // tinggi ÷ lebar kartu di video; tepi atas dihitung dari tepi bawah & lebar
                     // (tali yang tegak di atas kartu sering ikut terdeteksi)

const lum = (d, p) => (d[p] + d[p + 1] + d[p + 2]) / 3;

function erode(mask, W, H, r) { // min-filter terpisah (horizontal lalu vertikal)
  const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    let run = 0;
    for (let x = 0; x < W; x++) { run = mask[y * W + x] ? run + 1 : 0; if (run > 2 * r) tmp[y * W + x - r] = 1; }
  }
  for (let x = 0; x < W; x++) {
    let run = 0;
    for (let y = 0; y < H; y++) { run = tmp[y * W + x] ? run + 1 : 0; if (run > 2 * r) out[(y - r) * W + x] = 1; }
  }
  return out;
}

function detect(data, W, H) {
  // kotak karakter → area cari: dada sampai perut, tengah badan
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const bh = y1 - y0;
  const ya = Math.round(y0 + bh * 0.22), yb = Math.round(y0 + bh * 0.62);
  const mask = new Uint8Array(W * H);
  for (let y = ya; y < yb; y++) for (let x = x0; x <= x1; x++) {
    const p = (y * W + x) * 4;
    if (data[p + 3] > 200 && lum(data, p) < DARK) mask[y * W + x] = 1;
  }
  const er = erode(mask, W, H, ERODE);
  // semua komponen gelap; tali = garis panjang (isi kotak sedikit & panjang ≫ lebar)
  const seen = new Uint8Array(W * H);
  const comps = [];
  for (let y = ya; y < yb; y++) for (let x = x0; x <= x1; x++) {
    const i = y * W + x;
    if (!er[i] || seen[i]) continue;
    const pts = []; const st = [i]; seen[i] = 1;
    let a0 = W, a1 = 0, b0 = H, b1 = 0;
    while (st.length) {
      const j = st.pop(); pts.push(j);
      const jx = j % W, jy = (j / W) | 0;
      if (jx < a0) a0 = jx; if (jx > a1) a1 = jx; if (jy < b0) b0 = jy; if (jy > b1) b1 = jy;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = jx + dx, ny = jy + dy, n = ny * W + nx;
        if (nx < x0 || nx > x1 || ny < ya || ny >= yb || seen[n] || !er[n]) continue;
        seen[n] = 1; st.push(n);
      }
    }
    const bw = a1 - a0 + 1, bhh = b1 - b0 + 1, fill = pts.length / (bw * bhh);
    // ketebalan rata-rata ≈ luas / panjang diagonal kotak
    const thick = pts.length / Math.hypot(bw, bhh);
    const tall = bhh / bw;
    // tali: garis miring (kotak hampir kosong) atau garis tegak sempit; bintik: terlalu kecil
    if (pts.length < 60 || thick < 7 || (fill < 0.35 && thick < 20) || (tall > 3.5 && thick < 20)) continue;
    comps.push({ pts, cx: (a0 + a1) / 2, cy: (b0 + b1) / 2, n: pts.length, fill });
  }
  if (!comps.length) return null;
  comps.sort((p, q) => q.n - p.n);
  const main = comps[0], size = Math.sqrt(main.n) * 2.5;
  const best = comps.filter((c) => Math.hypot(c.cx - main.cx, c.cy - main.cy) < size + 60).flatMap((c) => c.pts);
  if (best.length < 200) return null;
  // persegi panjang terkecil yang memuat komponen; lalu dipotong sesuai rasio kartu dari tepi
  // bawah, dan kemiringan dihitung ulang hanya dari titik di dalam kartu (2×)
  let P = best.map((j) => [j % W, (j / W) | 0]);
  const fitRect = (pts) => {
    let f = null;
    for (let a = -30; a <= 30; a += 0.5) {
      const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
      let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
      for (const [x, y] of pts) { const u = x * c + y * s, v = -x * s + y * c; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
      const area = (u1 - u0) * (v1 - v0);
      if (!f || area < f.area) f = { area, t, u0, u1, v0, v1 };
    }
    return f;
  };
  let fit = fitRect(P);
  for (let it = 0; it < 2; it++) {
    const c = Math.cos(fit.t), s = Math.sin(fit.t);
    const top = fit.v1 - (fit.u1 - fit.u0) * ASPECT;
    const keep = P.filter(([x, y]) => -x * s + y * c >= top);
    if (keep.length < 100) break;
    P = keep;
    fit = fitRect(P);
  }
  fit.v0 = Math.max(fit.v0, fit.v1 - (fit.u1 - fit.u0) * ASPECT);
  const { t, u0, u1, v0, v1 } = fit;
  const e = ERODE + PAD, c = Math.cos(t), s = Math.sin(t);
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  return { cx: cu * c - cv * s, cy: cu * s + cv * c, w: u1 - u0 + 2 * e, h: v1 - v0 + 2 * e, t };
}

// tali lanyard → warna baru, terang-gelapnya (lipatan, bayangan) dipertahankan.
// Tali dicari dari potongannya tepat di atas kartu, lalu menjalar ke piksel gelap yang tersambung
// (pupil, alis, tepi hijab yang juga gelap tidak tersambung → tidak ikut). Wajah dikecualikan.
function findStrap(data, W, H, r) {
  let y0 = H, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x += 3) if (data[(y * W + x) * 4 + 3] > 128) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const top = r.cy - r.h / 2;
  const ya = Math.round(Math.max(y0 + (y1 - y0) * 0.2, top - r.h * 3.2)), yb = Math.round(top);
  const xa = Math.max(0, Math.round(r.cx - r.w * 2.2)), xb = Math.min(W - 1, Math.round(r.cx + r.w * 2.2));
  const info = (p) => { const R = data[p], G = data[p + 1], B = data[p + 2]; return [(R + G + B) / 3, Math.max(R, G, B) - Math.min(R, G, B)]; };
  // tali = abu-abu NETRAL (R≈G≈B); tepi hijab/lengan yang gelap tetap kemerahan → tidak ikut
  const neutral = (p) => Math.abs(data[p] - data[p + 2]) < 22 && Math.abs(data[p] - data[p + 1]) < 22;
  const isStrap = (x, y, strict = false) => {
    const p = (y * W + x) * 4; if (data[p + 3] < 120 || !neutral(p)) return false;
    const [L, S] = info(p); return strict ? L < 80 && S < 25 : L < 100 && S < 38;
  };
  const mark = new Uint8Array(W * H);
  const st = [];
  // benih: piksel tali yang jelas (gelap & netral) di sepanjang jalur tali; gesper putih memutus
  // tali → kedua bagian tetap dapat benih
  for (let y = ya; y < Math.round(top - r.h * 0.05); y++)
    for (let x = Math.round(r.cx - r.w * 1.7); x <= r.cx + r.w * 1.7; x++)
      if (x >= xa && x <= xb && isStrap(x, y, true)) { mark[y * W + x] = 1; st.push(y * W + x); }
  while (st.length) {
    const j = st.pop(), x = j % W, y = (j / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy, n = ny * W + nx;
      if (nx < xa || nx > xb || ny < ya || ny > yb || mark[n] || !isStrap(nx, ny)) continue;
      mark[n] = 1; st.push(n);
    }
  }
  // tepi antialias: tetangga ≤2 px yang agak gelap & tak berwarna → dicampur
  const edge = [];
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
    const i = y * W + x;
    if (mark[i]) continue;
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++) { const n = (y + dy) * W + x + dx; if (n >= 0 && n < W * H && mark[n] === 1) near = true; }
    if (!near) continue;
    const p = i * 4, [L, S] = info(p);
    if (data[p + 3] > 60 && L < 140 && S < 35 && neutral(p)) edge.push([p, Math.min(1, (140 - L) / 50), L]);
  }
  return { mark, edge, box: { xa, xb, ya, yb } };
}

function recolorStrap(data, W, H, r, rgb) {
  const { mark, edge } = findStrap(data, W, H, r);
  const info = (p) => [(data[p] + data[p + 1] + data[p + 2]) / 3];
  const REF = 62; // kecerahan rata-rata tali hitam
  const paint = (p, w, L) => {
    const k = Math.min(1.5, Math.max(0.55, L / REF));
    for (let i = 0; i < 3; i++) data[p + i] = Math.round(data[p + i] * (1 - w) + Math.min(255, rgb[i] * k) * w);
  };
  for (let i = 0; i < mark.length; i++) if (mark[i]) { const p = i * 4; paint(p, 1, info(p)[0]); }
  for (const [p, w, L] of edge) paint(p, w, L);
}

module.exports = { detect, findStrap };

if (require.main === module) (async () => {
  const card = await sharp(CARD).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const CW = card.info.width, CH = card.info.height, cd = card.data;
  const sample = (u, v, c) => { // bilinear
    const x = Math.min(CW - 1.001, Math.max(0, u)), y = Math.min(CH - 1.001, Math.max(0, v));
    const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, o = (iy * CW + ix) * 4 + c;
    return cd[o] * (1 - fx) * (1 - fy) + cd[o + 4] * fx * (1 - fy) + cd[o + CW * 4] * (1 - fx) * fy + cd[o + CW * 4 + 4] * fx * fy;
  };
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const list = DEBUG ? files.filter((_, i) => i % 40 === 0) : only ? files.filter((f) => only.includes(f)) : files;
  const OUT_DIR = process.env.OUT_DIR;
  if (OUT_DIR) fs.mkdirSync(OUT_DIR, { recursive: true });
  const STRAP = process.env.STRAP ? [1, 3, 5].map((i) => parseInt(process.env.STRAP.slice(i, i + 2), 16)) : null;
  if (DEBUG) fs.mkdirSync(DEBUG_DIR, { recursive: true });
  // 1) deteksi semua frame, 2) haluskan antar frame (rata-rata ±2 frame) supaya kartu tidak bergetar
  const found = [];
  for (const f of list) {
    const { data, info } = await sharp(path.join(DIR, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (process.env.RECT) {
      const [cx, cy, w, h, deg = 0] = process.env.RECT.split(',').map(Number);
      found.push({ cx, cy, w, h, t: (deg * Math.PI) / 180 });
    } else found.push(detect(data, info.width, info.height));
  }
  const smooth = found.map((r, i) => {
    if (!r || DEBUG) return r;
    const near = found.slice(Math.max(0, i - 2), i + 3).filter(Boolean);
    const avg = (k) => near.reduce((a, q) => a + q[k], 0) / near.length;
    return { cx: avg('cx'), cy: avg('cy'), w: avg('w'), h: avg('h'), t: avg('t') };
  });
  let miss = 0;
  for (let fi = 0; fi < list.length; fi++) {
    const f = list[fi];
    const file = path.join(DIR, f);
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const r = smooth[fi];
    if (!r) { miss++; console.log('  ! kartu tidak ketemu:', f); continue; }
    // gambar kartu asli (affine: putar + skala), 3×3 supersampling di tepi
    const c = Math.cos(r.t), s = Math.sin(r.t), R = Math.hypot(r.w, r.h) / 2 + 2;
    for (let y = Math.floor(r.cy - R); y <= r.cy + R; y++) for (let x = Math.floor(r.cx - R); x <= r.cx + R; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      let acc = [0, 0, 0], cov = 0;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
        const px = x + (sx + 0.5) / 3 - r.cx, py = y + (sy + 0.5) / 3 - r.cy;
        const du = px * c + py * s, dv = -px * s + py * c;
        const u = (du / r.w + 0.5) * CW, v = (dv / r.h + 0.5) * CH;
        if (u < 0 || v < 0 || u >= CW || v >= CH) continue;
        const a = sample(u, v, 3) / 255;
        for (let k = 0; k < 3; k++) acc[k] += sample(u, v, k) * a;
        cov += a;
      }
      if (cov <= 0) continue;
      const a = cov / 9, p = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) data[p + k] = data[p + k] * (1 - a) + (acc[k] / cov) * a;
      data[p + 3] = Math.max(data[p + 3], Math.round(a * 255));
    }
    if (STRAP) recolorStrap(data, W, H, r, STRAP);
    const img = sharp(data, { raw: { width: W, height: H, channels: 4 } });
    if (DEBUG) {
      await img.clone().extract({ left: Math.max(0, Math.round(r.cx - 220)), top: Math.max(0, Math.round(r.cy - 260)), width: 440, height: 520 })
        .flatten({ background: '#888' }).png().toFile(path.join(DEBUG_DIR, f));
      console.log(f, `kartu ${r.w.toFixed(0)}×${r.h.toFixed(0)} miring ${((r.t * 180) / Math.PI).toFixed(1)}°`);
    } else {
      const dest = OUT_DIR ? path.join(OUT_DIR, `${process.env.PREFIX || 'frame'}-${String(fi + 1).padStart(2, '0')}.png`) : file;
      await img.clone().png().toFile(dest);
      await img.clone().webp({ quality: 88, alphaQuality: 100 }).toFile(dest.replace(/\.png$/, '.webp'));
    }
  }
  console.log(`✓ ${list.length - miss}/${list.length} frame${DEBUG ? ' (debug)' : ''}`);
})();
