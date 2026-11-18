/*
 * Gambar karakter berlatar PUTIH → frame transparan seperti keluaran process-sheet.cjs
 * (kanvas 1300×2092, tinggi karakter 2092, kepala di tengah).
 * Latar = piksel putih yang tersambung ke tepi gambar (isi banjir), jadi sepatu/gelas putih di
 * dalam badan tidak ikut terhapus. Tepi: alpha dari jarak warna ke putih + warna dibersihkan
 * dari campuran putih (tidak ada garis putih di pinggir).
 *
 * Gambar yang sudah transparan dipakai apa adanya (alpha asli).
 *
 * Pakai: node scripts/key-white.cjs <gambar> <out.png>
 */
const sharp = require('sharp');
const [, , IN, OUT] = process.argv;
const CANVAS = { w: 1300, h: 2092 };

(async () => {
  // gambar sudah transparan? pakai alpha-nya langsung
  const src = await sharp(IN).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let clear = 0;
  for (let i = 3; i < src.data.length; i += 4) if (src.data[i] < 10) clear++;
  const preKeyed = clear / (src.data.length / 4) > 0.2;
  const { data, info } = await sharp(IN).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const whiteish = (i) => { const p = i * 3; return Math.min(data[p], data[p + 1], data[p + 2]) > 232 && Math.max(data[p], data[p + 1], data[p + 2]) - Math.min(data[p], data[p + 1], data[p + 2]) < 14; };
  const bg = new Uint8Array(N);
  const st = [];
  for (let x = 0; x < W; x++) { st.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { st.push(y * W, y * W + W - 1); }
  while (st.length) {
    const i = st.pop();
    if (bg[i] || !whiteish(i)) continue;
    bg[i] = 1;
    const x = i % W, y = (i / W) | 0;
    if (x > 0) st.push(i - 1); if (x < W - 1) st.push(i + 1); if (y > 0) st.push(i - W); if (y < H - 1) st.push(i + W);
  }
  const rgba = Buffer.alloc(N * 4);
  if (preKeyed) src.data.copy(rgba);
  else for (let i = 0; i < N; i++) {
    let a = bg[i] ? 0 : 255;
    let r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    if (!bg[i]) {
      // tepi (bersebelahan dengan latar): alpha dari seberapa jauh dari putih
      const x = i % W, y = (i / W) | 0;
      let edge = false;
      for (let d = 1; d <= 2 && !edge; d++) for (const j of [i - d, i + d, i - d * W, i + d * W])
        if (j >= 0 && j < N && Math.abs((j % W) - x) <= 2 && bg[j]) edge = true;
      if (edge) {
        const dist = 255 - Math.min(r, g, b);
        a = Math.round(Math.min(1, dist / 60) * 255);
        if (a > 0 && a < 255) { const al = a / 255; r = (r - 255 * (1 - al)) / al; g = (g - 255 * (1 - al)) / al; b = (b - 255 * (1 - al)) / al; }
      }
    }
    rgba[i * 4] = Math.max(0, Math.min(255, r)); rgba[i * 4 + 1] = Math.max(0, Math.min(255, g)); rgba[i * 4 + 2] = Math.max(0, Math.min(255, b)); rgba[i * 4 + 3] = a;
  }
  // potong ke karakter, skala tinggi = kanvas, kepala (15% atas) di tengah
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let i = 0; i < N; i++) if (rgba[i * 4 + 3] > 128) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  let sx = 0, n = 0;
  for (let y = y0; y < y0 + (y1 - y0) * 0.15; y++) for (let x = x0; x <= x1; x++) if (rgba[(y * W + x) * 4 + 3] > 128) { sx += x; n++; }
  const k = CANVAS.h / (y1 - y0 + 1);
  const crop = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize({ height: CANVAS.h, kernel: 'lanczos3' }).png().toBuffer();
  const cm = await sharp(crop).metadata();
  // kanvas melebar bila perlu, kepala tetap di tengah
  const head = (sx / n - x0) * k, half = Math.max(CANVAS.w / 2, head + 20, cm.width - head + 20);
  const CW = Math.ceil(half * 2), left = Math.round(half - head);
  await sharp({ create: { width: CW, height: CANVAS.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: crop, left, top: 0 }]).png().toFile(OUT);
  await sharp(OUT).webp({ quality: 90, alphaQuality: 100 }).toFile(OUT.replace(/\.png$/, '.webp'));
  console.log('→', OUT, `karakter ${cm.width}×${cm.height}, skala ×${k.toFixed(2)}`);
})();
