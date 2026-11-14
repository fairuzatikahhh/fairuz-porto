/*
 * Membuat frame melambai (s1-wave-01..05) dari walker-stand.webp — cara "boneka/rig":
 * lengan bawah & telapak dipotong jadi potongan KAKU lalu diputar utuh (tidak dilenturkan),
 * jadi bentuk lengan baju & tangan tidak penyok. Sambungan pergelangan tertutup manset.
 *
 * Urutan lapisan: badan (lengan bawah asli dihapus) → telapak → lengan bawah (manset di atas telapak)
 *
 * Pakai:  node scripts/make-wave-frames.cjs
 * Hasil:  frames/s1-wave/s1-wave-01..05.png + .webp (933 × 2092, sama dgn walker-stand)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../public/assets/walker-stand.webp');
const OUT = path.join(__dirname, '../frames/s1-wave');

/* ── Titik acuan di walker-stand (933 × 2092 px) ── */
const ELBOW = [632, 846];               // poros siku
const CUFF = [[718, 652], [792, 724]];  // garis tepi manset (pergelangan)
const WRIST = [752, 700];               // poros telapak (sedikit di dalam manset)
const HEAD_C = [352, 330], NECK = [352, 560], HEAD_R0 = 300, HEAD_R1 = 560;

/*  forearm: putaran lengan bawah di siku (derajat, negatif = naik)
 *  hand:    putaran telapak di pergelangan (negatif = ke kiri, positif = ke kanan)
 *  tilt:    kepala miring ke arah tangan (derajat)  */
const FRAMES = [
  { name: 's1-wave-01', forearm: -8, hand: -3, tilt: 0 },  // mulai mengangkat
  { name: 's1-wave-02', forearm: -17, hand: -9, tilt: 0 }, // terangkat, telapak ke kiri
  { name: 's1-wave-03', forearm: -19, hand: 8, tilt: 0 },  // lambai ke kanan
  { name: 's1-wave-04', forearm: -18, hand: -9, tilt: 0 }, // lambai ke kiri
  { name: 's1-wave-05', forearm: -7, hand: 2, tilt: 0 },   // turun kembali
];

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const rot = ([x, y], [cx, cy], deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const dx = x - cx, dy = y - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
};

/* ── Mask potongan (dievaluasi di koordinat gambar asli) ── */
// sektor lengan bawah dari siku: lengan atas ada di < -86°, bawah siku/rok di > +40°
function sector([x, y]) {
  const dx = x - ELBOW[0], dy = y - ELBOW[1];
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return smooth(-87, -83, ang) * (1 - smooth(34, 42, ang)) * (1 - smooth(560, 600, Math.hypot(dx, dy)));
}
// jarak bertanda dari garis manset (positif = ke arah telapak)
const CN = (() => {
  const [a, b] = CUFF, d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d);
  return [d[1] / l, -d[0] / l]; // normal mengarah kanan-atas
})();
const pastCuff = ([x, y]) => (x - CUFF[0][0]) * CN[0] + (y - CUFF[0][1]) * CN[1];
/* Tepi manset melengkung, jadi kulit vs lengan baju dipisah berdasarkan WARNA di zona pergelangan
 * (kulit: r−b ≥ ~54, lengan baju krem: r−b ≤ ~42). Di luar zona: semua telapak / semua lengan. */
const ZONE = [-30, 14];   // rentang jarak dari garis manset yang dipisah per warna
let SKIN = null, SW = 0;  // peta kulit 0..1, diisi di buildMaps()
const skinAt = ([x, y]) => {
  const xi = Math.round(x), yi = Math.round(y);
  return xi < 0 || yi < 0 || xi >= SW || !SKIN || yi * SW + xi >= SKIN.length ? 0 : SKIN[yi * SW + xi];
};
const handMask = (p) => sector(p) * smooth(ZONE[0] - 4, ZONE[0], pastCuff(p));
const forearmMask = (p) => {
  const t = pastCuff(p);
  if (t < ZONE[0]) return sector(p);
  return sector(p) * (1 - skinAt(p)) * (1 - smooth(ZONE[1] - 4, ZONE[1], t));
};
// dari badan: hapus lengan bawah asli, tapi sisakan area siku (mengisi celah saat diputar)
const eraseMask = (p) => sector(p) * smooth(48, 72, Math.hypot(p[0] - ELBOW[0], p[1] - ELBOW[1]));

/* ── util sampling (premultiplied) ── */
function sample(src, W, H, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  let r = 0, g = 0, b = 0, a = 0;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const xx = x0 + i, yy = y0 + j;
    if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
    const w = (i ? fx : 1 - fx) * (j ? fy : 1 - fy), p = (yy * W + xx) * 4, al = (src[p + 3] / 255) * w;
    r += src[p] * al; g += src[p + 1] * al; b += src[p + 2] * al; a += al;
  }
  return [r, g, b, a]; // premultiplied, a ∈ 0..1
}
const over = (top, bot) => {
  const k = 1 - top[3];
  return [top[0] + bot[0] * k, top[1] + bot[1] * k, top[2] + bot[2] * k, top[3] + bot[3] * k];
};
const scale = (c, m) => [c[0] * m, c[1] * m, c[2] * m, c[3] * m];

/* Telapak diperpanjang ke dalam manset (kulit diulang), supaya saat telapak berayun
 * tidak ada celah kosong antara manset dan pangkal telapak. */
function buildMaps(src, W, H) {
  SW = W;
  SKIN = new Float32Array(W * H);
  for (let y = 500; y < 860; y++) for (let x = 660; x < W; x++) {
    const o = (y * W + x) * 4;
    if (src[o + 3] < 8) continue;
    SKIN[y * W + x] = smooth(44, 54, src[o] - src[o + 2]);
  }
  // sumber telapak: lengan baju di zona pergelangan diganti kulit (diambil dari kulit terdekat
  // ke arah telapak), supaya pangkal telapak "berlanjut" di bawah manset dan tidak ada celah
  const out = Buffer.from(src);
  for (let y = 500; y < 860; y++) for (let x = 660; x < W; x++) {
    const t = pastCuff([x, y]), o = (y * W + x) * 4;
    if (t < ZONE[0] - 4 || t >= ZONE[1] || src[o + 3] < 8 || SKIN[y * W + x] > 0.7 || !sector([x, y])) continue;
    for (let k = 1; k < 70; k++) {
      const sx = Math.round(x + CN[0] * k), sy = Math.round(y + CN[1] * k);
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) break;
      const so = (sy * W + sx) * 4;
      if (src[so + 3] > 200 && SKIN[sy * W + sx] > 0.9) {
        out[o] = src[so]; out[o + 1] = src[so + 1]; out[o + 2] = src[so + 2]; out[o + 3] = 255;
        break;
      }
    }
  }
  return out;
}

function render(src, handSrc, W, H, f) {
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const q = [x, y];
    // badan (+ kepala miring), lengan bawah asli dihapus
    let pb = q;
    if (f.tilt) {
      const kh = 1 - smooth(HEAD_R0, HEAD_R1, Math.hypot(x - HEAD_C[0], y - HEAD_C[1]));
      if (kh > 0) pb = rot(q, NECK, -f.tilt * kh);
    }
    let col = scale(sample(src, W, H, pb[0], pb[1]), 1 - eraseMask(pb));
    // telapak: balik putaran siku, lalu balik ayunan pergelangan
    const p1 = rot(q, ELBOW, -f.forearm);
    const ph = rot(p1, WRIST, -f.hand);
    const hm = handMask(ph);
    if (hm > 0) col = over(scale(sample(handSrc, W, H, ph[0], ph[1]), hm), col);
    // lengan bawah (dengan manset) paling atas
    const fm = forearmMask(p1);
    if (fm > 0) col = over(scale(sample(src, W, H, p1[0], p1[1]), fm), col);
    const o = (y * W + x) * 4;
    const a = col[3];
    if (a > 1e-6) { out[o] = col[0] / a; out[o + 1] = col[1] / a; out[o + 2] = col[2] / a; }
    out[o + 3] = Math.min(255, a * 255);
  }
  return out;
}

(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  fs.mkdirSync(OUT, { recursive: true });
  const handSrc = buildMaps(data, W, H);
  for (const f of FRAMES) {
    const out = render(data, handSrc, W, H, f);
    const img = sharp(out, { raw: { width: W, height: H, channels: 4 } });
    await img.clone().png().toFile(path.join(OUT, `${f.name}.png`));
    await img.clone().webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(OUT, `${f.name}.webp`));
    console.log('✓', f.name);
  }
})();
