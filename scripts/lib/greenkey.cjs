/*
 * Fungsi bersama untuk memproses gambar/video ber-background hijau:
 *   keyGreen()     chroma key + bersihkan tepi kehijauan (rumbai syal, tepi rok)
 *   matchColors()  samakan warna sekumpulan frame dengan walker-stand (satu transform untuk semua)
 * Dipakai oleh process-sheet.cjs (sheet pose) dan process-video.cjs (frame video).
 */
const sharp = require('sharp');
const path = require('path');

const KEY = { lo: 10, hi: 70 }; // kadar hijau (g − r): karakter ini selalu g ≤ r (pink/kulit/krem/putih); > hi = background
const REF = path.join(__dirname, '../../public/assets/walker-stand.webp'); // acuan warna

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** data = RGB mentah (3 channel). Hasil: { rgba, alpha } dengan ukuran sama. */
function keyGreen(data, W, H) {
  const rgba = Buffer.alloc(W * H * 4);

  // 1) chroma key + despill
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3], b = data[i * 3 + 2];
    let g = data[i * 3 + 1];
    const spill = g - r;
    const a = 1 - smooth(KEY.lo, KEY.hi, spill);
    if (spill > 0) g = r; // buang kelebihan hijau
    const j = i * 4;
    rgba[j] = r; rgba[j + 1] = g; rgba[j + 2] = b; rgba[j + 3] = Math.round(a * 255);
  }
  // 1b) pita tepi: 1–3 px terluar karakter tercampur hijau (terlihat sebagai garis keruh/olive).
  //     Warnanya diganti rata-rata warna bagian DALAM karakter di dekatnya (alpha tetap).
  const EDGE = 3, REACH = 6, FAR = 32; // FAR: cadangan untuk helai tipis (rumbai) yang tak punya bagian dalam
  const dist = new Uint8Array(W * H).fill(255); // jarak (px) ke background, dibatasi
  for (let i = 0; i < W * H; i++) if (rgba[i * 4 + 3] < 128) dist[i] = 0;
  for (let pass = 1; pass <= EDGE + 1; pass++)
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (dist[i] !== 255) continue;
      if (dist[i - 1] === pass - 1 || dist[i + 1] === pass - 1 || dist[i - W] === pass - 1 || dist[i + W] === pass - 1) dist[i] = pass;
    }
  // piksel kehijauan dianggap tercemar walau berada di dalam (mis. celah antar rumbai)
  const green = (i) => { const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]; return g > r + 6 || (g > r - 2 && b < g - 30); };
  const clean = (k) => dist[k] > EDGE && !green(k);
  const src0 = Buffer.from(rgba);
  for (let y = REACH; y < H - REACH; y++) for (let x = REACH; x < W - REACH; x++) {
    const i = y * W + x, j = i * 4;
    if (src0[j + 3] === 0 || (dist[i] > EDGE && !green(i))) continue;
    const s = [0, 0, 0];
    let n = 0;
    for (let dy = -REACH; dy <= REACH; dy++) for (let dx = -REACH; dx <= REACH; dx++) {
      const k = i + dy * W + dx;
      if (clean(k)) { const q = k * 4; s[0] += src0[q]; s[1] += src0[q + 1]; s[2] += src0[q + 2]; n++; }
    }
    if (!n) // helai tipis: cari bagian dalam yang lebih jauh (langkah 2 px)
      for (let dy = -FAR; dy <= FAR; dy += 2) for (let dx = -FAR; dx <= FAR; dx += 2) {
        const yy = y + dy, xx = x + dx;
        if (yy < 0 || xx < 0 || yy >= H || xx >= W) continue;
        const k = yy * W + xx;
        if (clean(k)) { const q = k * 4; s[0] += src0[q]; s[1] += src0[q + 1]; s[2] += src0[q + 2]; n++; }
      }
    if (n) for (let c = 0; c < 3; c++) rgba[j + c] = s[c] / n;
  }
  // 2) kikis tepi 1 px (sisa piksel campuran hijau di pinggir)
  const alpha = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = rgba[(y * W + x) * 4 + 3];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) { m = 0; continue; }
      m = Math.min(m, rgba[(yy * W + xx) * 4 + 3] + 90); // kikis lembut
    }
    alpha[y * W + x] = m;
  }
  for (let i = 0; i < W * H; i++) rgba[i * 4 + 3] = alpha[i];
  return { rgba, alpha };
}

/** Samakan warna (mean/std per channel di Lab) semua buffer RGBA ke walker-stand. In-place. */
async function matchColors(bufs, strength = 0.8) {
  const ref = await sharp(REF).ensureAlpha().raw().toBuffer();
  const stats = (list) => {
    const s = [0, 0, 0], q = [0, 0, 0];
    let n = 0;
    for (const buf of list) for (let i = 0; i < buf.length; i += 4) {
      if (buf[i + 3] < 250) continue;
      const lab = toLab(buf[i], buf[i + 1], buf[i + 2]);
      for (let c = 0; c < 3; c++) { s[c] += lab[c]; q[c] += lab[c] * lab[c]; }
      n++;
    }
    return s.map((v, c) => ({ m: v / n, sd: Math.sqrt(q[c] / n - (v / n) ** 2) }));
  };
  const sRef = stats([ref]), sNew = stats(bufs);
  for (const buf of bufs) for (let i = 0; i < buf.length; i += 4) {
    if (!buf[i + 3]) continue;
    const lab = toLab(buf[i], buf[i + 1], buf[i + 2]);
    const t = lab.map((v, c) => v + ((((v - sNew[c].m) / sNew[c].sd) * sRef[c].sd + sRef[c].m) - v) * strength);
    const rgb = fromLab(...t);
    buf[i] = rgb[0]; buf[i + 1] = rgb[1]; buf[i + 2] = rgb[2];
  }
}

/* ── konversi sRGB ↔ CIELAB (D65) ── */
function toLab(r, g, b) {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const R = lin(r), G = lin(g), B = lin(b);
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
function fromLab(L, a, bb) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - bb / 200;
  const inv = (t) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const X = inv(fx) * 0.95047, Y = inv(fy), Z = inv(fz) * 1.08883;
  const R = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const G = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const B = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  const g = (v) => Math.round(255 * Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
  return [g(R), g(G), g(B)];
}

/** bbox vertikal + x acuan ('head' = kepala 3–18% atas, 'feet' = 4% bawah) dalam rentang kolom. */
function measure(alpha, W, H, x0 = 0, x1 = W - 1, align = 'feet') {
  let y0 = H, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) if (alpha[y * W + x] > 128) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const [ra, rb] = align === 'head' ? [y0 + (y1 - y0) * 0.03, y0 + (y1 - y0) * 0.18] : [y1 - (y1 - y0) * 0.04, y1];
  let sx = 0, n = 0;
  for (let y = Math.round(ra); y <= rb; y++) for (let x = x0; x <= x1; x++) if (alpha[y * W + x] > 128) { sx += x; n++; }
  return { x0, x1, y0, y1, refX: sx / n };
}

/**
 * Koreksi rona per bahan (dari scripts/tone.json): geser a* dan b* tiap piksel mengikuti titik
 * koreksi terdekat (bobot jarak terbalik di bidang a*-b*). Warna netral (krom < 4) tidak diubah.
 */
function applyTone(rgba, anchors) {
  const SIG2 = 36; // kehalusan transisi antar bahan
  for (let i = 0; i < rgba.length; i += 4) {
    if (!rgba[i + 3]) continue;
    const [L, a, b] = toLab(rgba[i], rgba[i + 1], rgba[i + 2]);
    let wa = 0, wb = 0, ws = 0;
    for (const { ab, d } of anchors) {
      const w = 1 / ((a - ab[0]) ** 2 + (b - ab[1]) ** 2 + SIG2);
      wa += w * d[0]; wb += w * d[1]; ws += w;
    }
    const k = smooth(2, 8, Math.hypot(a, b)); // netral → 0
    let a2 = a + (wa / ws) * k, b2 = b + (wb / ws) * k;
    // batasi rona kuning: warna terang yang tidak merah/pink (a* kecil) tapi lebih kuning dari
    // sweater di bust (b* ≈ 8) ditarik mendekati itu — cahaya kekuningan di rok/sweater render asli.
    // Kulit (a* > 9) & pink (a* > 12) tidak terkena.
    const yk = smooth(10, 6, a2) * smooth(55, 70, L);
    if (b2 > 11 && yk > 0) b2 = b2 - (b2 - 11) * 0.65 * yk;
    const rgb = fromLab(L, a2, b2);
    rgba[i] = rgb[0]; rgba[i + 1] = rgb[1]; rgba[i + 2] = rgb[2];
  }
}

/**
 * Buang pantulan hijau di SELURUH badan (bukan cuma tepi). Video yang dirender di depan layar
 * hijau memantulkan cahaya hijau ke sweater/rumbai. Karakter ini tidak punya warna hijau,
 * jadi g dibatasi ke rata-rata r & b (+toleransi kecil). Krem, kulit, pink, putih tidak berubah.
 */
function despillAll(rgba, tol = 8) {
  for (let i = 0; i < rgba.length; i += 4) {
    if (!rgba[i + 3]) continue;
    const lim = (rgba[i] + rgba[i + 2]) / 2 + tol;
    if (rgba[i + 1] > lim) rgba[i + 1] = lim;
  }
}

/**
 * Kembalikan warna pink pada bagian rok yang di render aslinya "pucat" (cahaya kekuningan
 * membuat sisi rok hampir krem). Hanya baris y0..y1 (area rok), hanya piksel yang kurang pink.
 */
function restoreSkirt(rgba, W, y0, y1, targetA = 22, targetB = 9) {
  // rok utama: a* ±22, b* ±9. Bayangan rok di render asli bergeser ke cokelat-hijau (a* 9–13, b* 15–17)
  for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (!rgba[i + 3]) continue;
    const [L, a, b] = toLab(rgba[i], rgba[i + 1], rgba[i + 2]);
    if (L < 28 || L > 92 || a >= targetA - 2) continue;
    const w = smooth(targetA - 2, targetA - 12, a) * 0.85; // makin tidak pink → makin dikoreksi
    const rgb = fromLab(L, a + (targetA - a) * w, b + (targetB - b) * w);
    rgba[i] = rgb[0]; rgba[i + 1] = rgb[1]; rgba[i + 2] = rgb[2];
  }
}

module.exports = { keyGreen, matchColors, measure, applyTone, despillAll, restoreSkirt, toLab, fromLab };
