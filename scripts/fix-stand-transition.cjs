/*
 * Video "berdiri" (s3-stand) dari AI mengecilkan karakter & sedikit mengubah warna saat ia bangun.
 * Script ini memperbaikinya BERTAHAP selama gerakan bangun:
 *  - ukuran: frame duduk tetap (nyambung dengan video meluncur), frame berdiri diperbesar sampai
 *    tinggi karakter = pose berdiri biasa (ACUAN), dengan kaki sebagai titik tumpu
 *  - warna: kurva warna dari frame berdiri terakhir → ACUAN, dicampur makin kuat saat ia berdiri
 *
 * Pakai: node scripts/fix-stand-transition.cjs
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../frames/s3-stand-video');
const ACUAN = path.join(__dirname, '../frames/s2-full-video/s2-full-130.png'); // pose berdiri depan
const RAMP = [9, 23];  // frame (1-based) mulai bangun → sudah berdiri (48 frame, ditajamkan Real-ESRGAN)

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const bbox = (d, W, H) => {
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 128) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, x1, y0, y1, h: y1 - y0 + 1 };
};

(async () => {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const load = async (f) => sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const last = await load(path.join(DIR, files[files.length - 1]));
  const ref = await load(ACUAN);
  const W = last.info.width, H = last.info.height;
  const bl = bbox(last.data, W, H), br = bbox(ref.data, ref.info.width, ref.info.height);
  const k = br.h / bl.h;
  const pivot = { x: (bl.x0 + bl.x1) / 2, y: bl.y1 + 1 }; // kaki pose berdiri
  console.log(`tinggi berdiri di video ${bl.h}px, seharusnya ${br.h}px → ×${k.toFixed(3)}`);

  // kurva warna: frame berdiri terakhir → acuan
  const hist = (buf) => { const h = [0, 1, 2].map(() => new Float64Array(256)); for (let i = 0; i < buf.length; i += 4) if (buf[i + 3] > 250) for (let c = 0; c < 3; c++) h[c][buf[i + c]]++; return h; };
  const cdf = (h) => { const t = h.reduce((a, b) => a + b, 0); let acc = 0; return Array.from(h, (v) => (acc += v) / t); };
  const hs = hist(last.data), hr = hist(ref.data);
  const lut = [0, 1, 2].map((c) => {
    const cs = cdf(hs[c]), cr = cdf(hr[c]), L = new Uint8Array(256);
    let u = 0;
    for (let v = 0; v < 256; v++) { while (u < 255 && cr[u] < cs[v]) u++; L[v] = u; }
    return L;
  });

  for (let i = 0; i < files.length; i++) {
    const w = smooth(RAMP[0], RAMP[1], i + 1);
    if (w <= 0) continue;
    const f = path.join(DIR, files[i]);
    const { data } = await load(f);
    // warna
    for (let p = 0; p < data.length; p += 4) if (data[p + 3]) for (let c = 0; c < 3; c++) data[p + c] = data[p + c] * (1 - w) + lut[c][data[p + c]] * w;
    // ukuran: perbesar di sekitar kaki
    const s = 1 + (k - 1) * w;
    const big = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
      .resize({ width: Math.round(W * s), kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
    const BW = big.info.width, BH = big.info.height;
    const left = Math.round(pivot.x * s - pivot.x), top = Math.round(pivot.y * s - pivot.y);
    const out = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) {
      const sy = y + top;
      if (sy < 0 || sy >= BH) continue;
      for (let x = 0; x < W; x++) {
        const sx = x + left;
        if (sx < 0 || sx >= BW) continue;
        big.data.copy(out, (y * W + x) * 4, (sy * BW + sx) * 4, (sy * BW + sx) * 4 + 4);
      }
    }
    const img = sharp(out, { raw: { width: W, height: H, channels: 4 } });
    await img.clone().png().toFile(f);
    await img.clone().webp({ quality: 88, alphaQuality: 100 }).toFile(f.replace(/\.png$/, '.webp'));
  }
  console.log(`✓ ${files.length} frame diperbaiki (bertahap frame ${RAMP[0]}–${RAMP[1]})`);
})();
