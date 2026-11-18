/*
 * Menghapus lanyard (tali, gesper, klip, kartu) dari frame karakter, lalu mengisi bagian yang
 * kosong dengan kain di sekitarnya (push-pull: rata-rata bertingkat dari kasar ke halus → isi
 * menyambung mulus dengan warna & gradasi di sekelilingnya).
 *
 * Area kartu (menutupi rompi & ikat pinggang yang berdetail) diisi dari PATCH: frame karakter yang
 * sama tanpa lanyard (pose mirip), disejajarkan per badan (ujung kepala, kaki, tengah badan) &
 * disamakan warnanya dengan sekelilingnya. Tali yang tipis cukup diisi push-pull.
 *
 * Pakai: node scripts/remove-lanyard.cjs <frame.png> <out.png> [patch.png] [--debug <mask.png>]
 */
const sharp = require('sharp');
const { detect, findStrap } = require('./fix-video-cards.cjs');

const args = process.argv.slice(2);
const dbgAt = args.indexOf('--debug');
const DEBUG_OUT = dbgAt >= 0 ? args[dbgAt + 1] : null;
const [IN, OUT, PATCH] = dbgAt >= 0 ? args.slice(0, dbgAt) : args;
const FLAG = DEBUG_OUT ? '--debug' : null;

// ujung kepala, kaki & tengah badan (baris rok) — untuk menyejajarkan dua frame
function bodyOf(d, W, H) {
  let t = H, b = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 128) { if (y < t) t = y; if (y > b) b = y; }
  const row = Math.round(b - (b - t) * 0.12);
  let a = W, z = 0;
  for (let x = 0; x < W; x++) if (d[(row * W + x) * 4 + 3] > 128) { if (x < a) a = x; if (x > z) z = x; }
  return { top: t, feet: b, cx: (a + z) / 2 };
}

(async () => {
  const { data, info } = await sharp(IN).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const r = detect(data, W, H);
  if (!r) throw new Error('kartu tidak ketemu');
  const { mark, edge, box } = findStrap(data, W, H, r);

  const mask = new Uint8Array(N);
  // kartu (+ bayangan tipis di sekelilingnya)
  const c = Math.cos(r.t), s = Math.sin(r.t), PADC = 7;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - r.cx, dy = y - r.cy;
    if (Math.abs(dx * c + dy * s) < r.w / 2 + PADC && Math.abs(-dx * s + dy * c) < r.h / 2 + PADC) mask[y * W + x] = 1;
  }
  // tali + tepinya
  for (let i = 0; i < N; i++) if (mark[i]) mask[i] = 1;
  for (const [p] of edge) mask[p / 4] = 1;
  // gesper & klip (putih/perak, tak berwarna) di dekat tali atau di atas kartu
  const near = new Uint8Array(N), R = 14;
  for (let i = 0; i < N; i++) if (mark[i]) {
    const x = i % W, y = (i / W) | 0;
    for (let dy = -R; dy <= R; dy += 2) for (let dx = -R; dx <= R; dx += 2) {
      const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) near[ny * W + nx] = 1;
    }
  }
  const top = r.cy - r.h / 2;
  for (let y = Math.max(0, Math.round(top - r.h * 0.4)); y < top + 4; y++)
    for (let x = Math.round(r.cx - r.w * 0.3); x <= r.cx + r.w * 0.3; x++) near[y * W + x] = 1;
  for (let i = 0; i < N; i++) {
    if (!near[i] || mask[i]) continue;
    const p = i * 4, mx = Math.max(data[p], data[p + 1], data[p + 2]), mn = Math.min(data[p], data[p + 1], data[p + 2]);
    if (data[p + 3] > 150 && mx - mn < 22) mask[i] = 1;
  }
  // lebarkan 5 px (tepi tali yang gelap/antialias ikut dihapus, tidak jadi sumber warna)
  const G = 5, grow = Uint8Array.from(mask);
  for (let y = G; y < H - G; y++) for (let x = G; x < W - G; x++) if (mask[y * W + x])
    for (let dy = -G; dy <= G; dy++) for (let dx = -G; dx <= G; dx++) grow[(y + dy) * W + x + dx] = 1;
  for (let i = 0; i < N; i++) if (data[i * 4 + 3] < 200) grow[i] = 0; // hanya di dalam badan

  // push-pull: piramida rata-rata dari piksel yang diketahui (di badan & bukan lanyard)
  const levels = [];
  let w = W, h = H;
  let val = new Float32Array(N * 3), wt = new Float32Array(N);
  // sumber warna: hanya kain berwarna (pink) — lanyard menutupi syal & rompi pink, bukan tumbler/sweater
  // krem/putih (tak berwarna) yang bersebelahan dan bisa tercoreng ke area isian
  for (let i = 0; i < N; i++) {
    const p = i * 4, sat = Math.max(data[p], data[p + 1], data[p + 2]) - Math.min(data[p], data[p + 1], data[p + 2]);
    if (!grow[i] && data[p + 3] >= 200 && sat >= 32) { wt[i] = 1; for (let k = 0; k < 3; k++) val[i * 3 + k] = data[p + k]; }
  }
  levels.push({ w, h, val, wt });
  while (w > 8 && h > 8) {
    const w2 = Math.ceil(w / 2), h2 = Math.ceil(h / 2), v2 = new Float32Array(w2 * h2 * 3), t2 = new Float32Array(w2 * h2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, j = (y >> 1) * w2 + (x >> 1);
      if (!wt[i]) continue;
      t2[j] += wt[i]; for (let k = 0; k < 3; k++) v2[j * 3 + k] += val[i * 3 + k] * wt[i];
    }
    for (let j = 0; j < w2 * h2; j++) if (t2[j]) { for (let k = 0; k < 3; k++) v2[j * 3 + k] /= t2[j]; t2[j] = Math.min(1, t2[j]); }
    w = w2; h = h2; val = v2; wt = t2;
    levels.push({ w, h, val, wt });
  }
  for (let l = levels.length - 2; l >= 0; l--) { // pull: isi yang kosong dari tingkat lebih kasar (bilinear)
    const f = levels[l], g = levels[l + 1];
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const i = y * f.w + x;
      if (f.wt[i] >= 1) continue;
      const gx = Math.min(g.w - 1.001, Math.max(0, (x - 0.5) / 2)), gy = Math.min(g.h - 1.001, Math.max(0, (y - 0.5) / 2));
      const x0 = gx | 0, y0 = gy | 0, fx = gx - x0, fy = gy - y0;
      for (let k = 0; k < 3; k++) {
        const a = g.val[(y0 * g.w + x0) * 3 + k], b = g.val[(y0 * g.w + x0 + 1) * 3 + k];
        const cc = g.val[((y0 + 1) * g.w + x0) * 3 + k], d = g.val[((y0 + 1) * g.w + x0 + 1) * 3 + k];
        const up = (a * (1 - fx) + b * fx) * (1 - fy) + (cc * (1 - fx) + d * fx) * fy;
        f.val[i * 3 + k] = f.val[i * 3 + k] * f.wt[i] + up * (1 - f.wt[i]);
      }
      f.wt[i] = 1;
    }
  }
  const fill = levels[0].val;
  // haluskan isian (beberapa putaran rata-rata tetangga, hanya di area yang diisi)
  for (let it = 0; it < 40; it++) for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (!grow[i]) continue;
    for (let k = 0; k < 3; k++) fill[i * 3 + k] = (fill[(i - 1) * 3 + k] + fill[(i + 1) * 3 + k] + fill[(i - W) * 3 + k] + fill[(i + W) * 3 + k]) / 4;
  }
  // area kartu dari PATCH (badan yang sama tanpa lanyard)
  if (PATCH) {
    const pt = await sharp(PATCH).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const PW = pt.info.width, PH = pt.info.height, pd = pt.data;
    const bF = bodyOf(data, W, H), bP = bodyOf(pd, PW, PH);
    const k = (bP.feet - bP.top) / (bF.feet - bF.top);
    const map = (x, y) => [bP.cx + (x - bF.cx) * k, bP.feet + (y - bF.feet) * k];
    const samp = (x, y, ch) => {
      const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
      if (x0 < 0 || y0 < 0 || x0 >= PW - 1 || y0 >= PH - 1) return null;
      const o = (y0 * PW + x0) * 4 + ch;
      return pd[o] * (1 - fx) * (1 - fy) + pd[o + 4] * fx * (1 - fy) + pd[o + PW * 4] * (1 - fx) * fy + pd[o + PW * 4 + 4] * fx * fy;
    };
    const inCardArea = (x, y, extra) => { const dx = x - r.cx, dy = y - r.cy; return Math.abs(dx * c + dy * s) < r.w / 2 + PADC + extra && Math.abs(-dx * s + dy * c) < r.h / 2 + PADC + extra; };
    // samakan warna: rata-rata cincin di sekeliling area kartu (di luar yang dihapus)
    const sumF = [0, 0, 0], sumP = [0, 0, 0]; let n = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (grow[i] || !inCardArea(x, y, 30) || inCardArea(x, y, 6) || data[i * 4 + 3] < 200) continue;
      const [mx, my] = map(x, y); const a = samp(mx, my, 3); if (a === null || a < 200) continue;
      for (let ch = 0; ch < 3; ch++) { sumF[ch] += data[i * 4 + ch]; sumP[ch] += samp(mx, my, ch); }
      n++;
    }
    const shift = sumF.map((v, ch) => (n ? (v - sumP[ch]) / n : 0));
    // jarak ke tepi area yang dihapus → patch dibaurkan perlahan (tidak tampak seperti tempelan)
    const FEATHER = 14;
    const dist = new Float32Array(N).fill(1e9);
    for (let i = 0; i < N; i++) if (!grow[i]) dist[i] = 0;
    for (let y = 1; y < H; y++) for (let x = 1; x < W; x++) { const i = y * W + x; dist[i] = Math.min(dist[i], dist[i - 1] + 1, dist[i - W] + 1); }
    for (let y = H - 2; y >= 0; y--) for (let x = W - 2; x >= 0; x--) { const i = y * W + x; dist[i] = Math.min(dist[i], dist[i + 1] + 1, dist[i + W] + 1); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!grow[i] || !inCardArea(x, y, 6)) continue;
      const [mx, my] = map(x, y); const a = samp(mx, my, 3);
      if (a === null || a < 200) continue;
      const wgt = Math.min(1, dist[i] / FEATHER);
      for (let ch = 0; ch < 3; ch++) fill[i * 3 + ch] = fill[i * 3 + ch] * (1 - wgt) + (samp(mx, my, ch) + shift[ch]) * wgt;
    }
    console.log(`patch: skala ${k.toFixed(3)}, geser warna ${shift.map((v) => v.toFixed(1)).join('/')}`);
  }
  // sedikit butir halus (kain di sekitarnya tidak licin sempurna) supaya isian tidak tampak "blur"
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) - 0.5;
  for (let i = 0; i < N; i++) if (grow[i]) {
    const n = rnd() * 3.2;
    for (let k = 0; k < 3; k++) data[i * 4 + k] = Math.max(0, Math.min(255, Math.round(fill[i * 3 + k] + n)));
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(OUT);
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 88, alphaQuality: 100 }).toFile(OUT.replace(/\.png$/, '.webp'));
  if (FLAG === '--debug') {
    const m = Buffer.alloc(N); for (let i = 0; i < N; i++) m[i] = grow[i] ? 255 : 0;
    await sharp(m, { raw: { width: W, height: H, channels: 1 } }).png().toFile(DEBUG_OUT);
  }
  console.log('→', OUT);
})();
