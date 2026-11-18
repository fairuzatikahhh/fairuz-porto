/*
 * Memproses sheet hasil generate (background hijau) menjadi frame transparan
 * yang ukuran & posisinya sama dengan walker-stand (tinggi 2092, kaki di bawah).
 *
 * Pakai:  node scripts/process-sheet.cjs <sheet> <folder-output> <prefix> [startIndex] [feet|head] [lebarKanvas]
 * Contoh: node scripts/process-sheet.cjs frames/raw/s2-turn-sheet-v2.jpg frames/s2-turn s2-turn 1
 *         node scripts/process-sheet.cjs frames/raw/s2-walk-sheet-a.jpg frames/s2-walk s2-walk 1 head 1300
 *
 * Langkah: chroma key hijau → bersihkan tepi → potong per karakter (kolom kosong)
 * → skala sama untuk semua pose (tinggi = walker-stand) → kaki di bawah kanvas → samakan warna.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { keyGreen, matchColors, measure } = require('./lib/greenkey.cjs');

// ALIGN: 'feet' (default, pose diam) atau 'head' (siklus jalan, supaya badan tidak goyang kiri-kanan)
// CANVAS_W: lebar kanvas (default 933 = walker-stand; jalan butuh lebih lebar untuk langkah & syal)
const [, , SHEET, OUT_DIR, PREFIX, START = '1', ALIGN = 'feet', CANVAS_W = '933'] = process.argv;
if (!SHEET || !OUT_DIR || !PREFIX) {
  console.error('Pakai: node scripts/process-sheet.cjs <sheet> <folder-output> <prefix> [startIndex] [feet|head] [lebarKanvas]');
  process.exit(1);
}

const CANVAS = { w: Number(CANVAS_W), h: 2092 }; // tinggi sama dengan walker-stand
const TARGET_H = 2092;                           // tinggi karakter (ujung hijab → sol sepatu)

(async () => {
  const { data, info } = await sharp(SHEET).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const { rgba, alpha } = keyGreen(data, W, H);

  // cari karakter: kolom yang berisi piksel solid
  const colHas = new Array(W).fill(false);
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (alpha[y * W + x] > 200) { colHas[x] = true; break; }
  const spans = [];
  for (let x = 0; x < W; x++) {
    if (colHas[x] && (x === 0 || !colHas[x - 1])) spans.push([x, x]);
    if (colHas[x]) spans[spans.length - 1][1] = x;
  }
  const boxes = spans.filter(([a, b]) => b - a > 60).map(([x0, x1]) => measure(alpha, W, H, x0, x1, ALIGN));
  console.log(`ditemukan ${boxes.length} karakter`);

  // skala SAMA untuk semua pose (pakai tinggi rata-rata) supaya tidak "membesar-mengecil"
  const avgH = boxes.reduce((s, b) => s + (b.y1 - b.y0 + 1), 0) / boxes.length;
  const scale = TARGET_H / avgH;
  console.log(`skala ${scale.toFixed(3)}× (tinggi rata-rata ${avgH.toFixed(0)} px)`);

  const big = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .resize({ width: Math.round(W * scale), kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  // diperbesar ±2× → pertajam warna, HANYA di bagian dalam karakter (tepi tetap, supaya tak ada garis putih)
  const sharp3 = await sharp(big.data, { raw: big.info }).removeAlpha()
    .sharpen({ sigma: 1.0, m1: 0.7, m2: 1.6 }).raw().toBuffer();
  for (let p = 0, n = big.info.width * big.info.height; p < n; p++) {
    if (big.data[p * 4 + 3] < 252) continue;
    for (let c = 0; c < 3; c++) big.data[p * 4 + c] = sharp3[p * 3 + c];
  }
  const BW = big.info.width, BH = big.info.height;

  const outs = boxes.map((b, i) => {
    const left = Math.round(b.refX * scale - CANVAS.w / 2);
    const top = Math.round((b.y1 + 1) * scale - CANVAS.h);
    const out = Buffer.alloc(CANVAS.w * CANVAS.h * 4);
    for (let y = 0; y < CANVAS.h; y++) {
      const sy = y + top;
      if (sy < 0 || sy >= BH) continue;
      for (let x = 0; x < CANVAS.w; x++) {
        const sx = x + left;
        if (sx < 0 || sx >= BW) continue;
        const ox = sx / scale; // hanya piksel milik karakter ini (abaikan tetangga di sheet)
        if (ox < b.x0 - 3 || ox > b.x1 + 3) continue;
        big.data.copy(out, (y * CANVAS.w + x) * 4, (sy * BW + sx) * 4, (sy * BW + sx) * 4 + 4);
      }
    }
    return { name: `${PREFIX}-${String(Number(START) + i).padStart(2, '0')}`, out, width: Math.round((b.x1 - b.x0) * scale) };
  });

  await matchColors(outs.map((o) => o.out));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const o of outs) {
    const img = sharp(o.out, { raw: { width: CANVAS.w, height: CANVAS.h, channels: 4 } });
    await img.clone().png().toFile(path.join(OUT_DIR, `${o.name}.png`));
    await img.clone().webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(OUT_DIR, `${o.name}.webp`));
    console.log('✓', o.name, `(lebar karakter ${o.width} px)`);
  }
})();
