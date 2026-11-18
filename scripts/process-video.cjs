/*
 * Memproses frame video (background hijau) menjadi frame sequence transparan untuk web.
 * Berbeda dari process-sheet: SATU skala & SATU posisi untuk semua frame, jadi gerak asli
 * di video (badan naik-turun, ayunan) tetap utuh — tidak disejajarkan ulang per frame.
 *
 * Pakai:  node scripts/process-video.cjs <folder-frame-video> <folder-output> <prefix> <panjangLoop> [mulai|auto] [tinggiKanvas] [lebarKanvas]
 * Contoh: node scripts/process-video.cjs /tmp/vid frames/s2-walk-video s2-walk 32 auto 1600 1000
 *         (frame hasil AI upscale: node scripts/process-video.cjs <folder-4x> frames/s2-walk-video s2-walk 32 0 2000 1250)
 *
 * Folder input berisi v0000.png, v0001.png, … (dari scripts/extract-video-frames.swift).
 *
 * Opsi (environment variable) untuk video LANJUTAN yang harus nyambung dengan frame yang sudah ada:
 *   MATCH_TO=<png>      samakan warna (kurva per channel) dengan gambar acuan — frame 0 video harus
 *                       berpose sama dengan acuan, mis. frames/s2-full-video/s2-full-130.png
 *   FIRST_HEIGHT=<px>   skala & posisi dikunci ke frame 0 (tinggi karakter frame 0 = px ini,
 *                       kepala & kaki frame 0 jadi titik acuan) — sama dengan grup sebelumnya
 *   PAD_BOTTOM=<px>     ruang kosong di bawah kaki frame 0 (untuk pose yang turun lebih rendah)
 *   SCALE=, HEAD_X=, GROUND=  paksa skala & penempatan (nilai yang dicetak saat memproses video lain
 *                       dari kamera/posisi yang sama) → dua video bisa disambung tanpa geser
 *   ALIGN_TO=<png>      frame 0 ditempatkan TEPAT menimpa karakter di gambar acuan (ukuran kanvas,
 *                       skala & posisi ikut acuan) — untuk video yang melanjutkan pose terakhir video
 *                       sebelumnya, mis. frames/s3-sit-video/s3-sit-143.png
 * "auto" mencari titik mulai yang membuat frame terakhir paling nyambung ke frame pertama.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { keyGreen, matchColors, measure, despillAll } = require('./lib/greenkey.cjs');

const [, , IN_DIR, OUT_DIR, PREFIX, LOOP, START = 'auto', CH = '1046', CW = '650'] = process.argv;
if (!IN_DIR || !OUT_DIR || !PREFIX || !LOOP) {
  console.error('Pakai: node scripts/process-video.cjs <folder-frame-video> <folder-output> <prefix> <panjangLoop> [mulai|auto] [tinggiKanvas] [lebarKanvas]');
  process.exit(1);
}
const N = Number(LOOP);
const CANVAS = { w: Number(CW), h: Number(CH) };
const PAD_BOTTOM = Number(process.env.PAD_BOTTOM || 0);
const files = fs.readdirSync(IN_DIR).filter((f) => /^v\d+\.png$/.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

// cari titik mulai: frame i dan i+N harus semirip mungkin (loop mulus)
async function autoStart() {
  const small = await Promise.all(files.map((f) => sharp(path.join(IN_DIR, f)).resize({ width: 240 }).removeAlpha().raw().toBuffer()));
  let best = 0, bestD = Infinity;
  for (let i = 0; i + N < files.length; i++) {
    const a = small[i], b = small[i + N];
    let d = 0;
    for (let k = 0; k < a.length; k++) d += Math.abs(a[k] - b[k]);
    if (d < bestD) { bestD = d; best = i; }
  }
  console.log(`titik mulai loop: frame ${best} (selisih ke frame ${best + N}: ${(bestD / small[0].length).toFixed(2)})`);
  return best;
}

(async () => {
  const start = START === 'auto' ? await autoStart() : Number(START);
  const keyed = [];
  for (let i = start; i < start + N; i++) {
    const { data, info } = await sharp(path.join(IN_DIR, files[i])).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { rgba, alpha } = keyGreen(data, info.width, info.height);
    despillAll(rgba); // pantulan hijau dari layar hijau di sweater, rumbai, dll.
    keyed.push({ rgba, W: info.width, H: info.height, m: measure(alpha, info.width, info.height, 0, info.width - 1, 'head') });
  }
  // satu skala & satu posisi untuk semua frame
  const avg = (f) => keyed.reduce((s, k) => s + f(k.m), 0) / keyed.length;
  const FIRST_H = Number(process.env.FIRST_HEIGHT || 0);
  const m0 = keyed[0].m;
  let scale = FIRST_H ? FIRST_H / (m0.y1 - m0.y0 + 1) : (CANVAS.h * 0.95) / avg((m) => m.y1 - m.y0 + 1); // 5% ruang di atas
  let headX = FIRST_H ? m0.refX : avg((m) => m.refX);
  let ground = FIRST_H ? m0.y1 + 1 : Math.max(...keyed.map((k) => k.m.y1)) + 1;
  if (process.env.SCALE) scale = Number(process.env.SCALE);
  if (process.env.HEAD_X) headX = Number(process.env.HEAD_X);
  if (process.env.GROUND) ground = Number(process.env.GROUND);
  let place = null; // ALIGN_TO: offset langsung (kiri, atas) di kanvas acuan
  if (process.env.ALIGN_TO) {
    const { data: rd, info: ri } = await sharp(process.env.ALIGN_TO).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let x0 = ri.width, x1 = 0, y0 = ri.height, y1 = 0;
    for (let y = 0; y < ri.height; y++) for (let x = 0; x < ri.width; x++) if (rd[(y * ri.width + x) * 4 + 3] > 128) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    const a0 = keyed[0];
    let fx0 = a0.W, fx1 = 0;
    for (let y = m0.y0; y <= m0.y1; y++) for (let x = 0; x < a0.W; x++) if (a0.rgba[(y * a0.W + x) * 4 + 3] > 128) { if (x < fx0) fx0 = x; if (x > fx1) fx1 = x; }
    scale = (y1 - y0 + 1) / (m0.y1 - m0.y0 + 1); // tinggi karakter frame 0 = tinggi karakter acuan
    CANVAS.w = ri.width; CANVAS.h = ri.height;
    // tengah-bawah kotak karakter frame 0 → tengah-bawah kotak karakter acuan
    place = { left: Math.round(((fx0 + fx1) / 2) * scale - (x0 + x1) / 2), top: Math.round((m0.y1 + 1) * scale - (y1 + 1)) };
    console.log(`selaras dengan ${process.env.ALIGN_TO}: kanvas ${ri.width}×${ri.height}`);
  }
  console.log(`skala ${scale.toFixed(3)}×, kepala x ${headX.toFixed(1)}, tanah y ${ground}`);

  const outs = [];
  for (let i = 0; i < keyed.length; i++) {
    const { rgba, W, H } = keyed[i];
    // perbesar (lanczos, alpha di-premultiply oleh sharp), lalu pertajam HANYA warna (alpha tetap)
    // supaya tepi tidak muncul garis gelap/terang
    const up = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
      .resize({ width: Math.round(W * scale), kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
    // pertajam warna, tapi pakai hasil tajam HANYA di bagian dalam karakter (alpha penuh);
    // di tepi tetap warna asli, supaya tidak muncul garis putih/gelap di sekeliling siluet
    const sharp3 = await sharp(up.data, { raw: up.info }).removeAlpha()
      .sharpen({ sigma: 0.9, m1: 0.6, m2: 1.4 }) // video 720p diperbesar → pertajam sedikit
      .raw().toBuffer();
    const n = up.info.width * up.info.height;
    for (let p = 0; p < n && scale > 1.2; p++) { // hanya kalau frame benar-benar diperbesar
      if (up.data[p * 4 + 3] < 252) continue;
      for (let c = 0; c < 3; c++) up.data[p * 4 + c] = sharp3[p * 3 + c];
    }
    const big = { data: up.data, info: up.info };
    const BW = big.info.width, BH = big.info.height;
    const left = place ? place.left : Math.round(headX * scale - CANVAS.w / 2);
    const top = place ? place.top : Math.round(ground * scale - (CANVAS.h - PAD_BOTTOM)); // PAD_BOTTOM: ruang di bawah kaki (mis. kaki terjulur saat duduk)
    const out = Buffer.alloc(CANVAS.w * CANVAS.h * 4);
    for (let y = 0; y < CANVAS.h; y++) {
      const sy = y + top;
      if (sy < 0 || sy >= BH) continue;
      for (let x = 0; x < CANVAS.w; x++) {
        const sx = x + left;
        if (sx < 0 || sx >= BW) continue;
        big.data.copy(out, (y * CANVAS.w + x) * 4, (sy * BW + sx) * 4, (sy * BW + sx) * 4 + 4);
      }
    }
    outs.push({ name: `${PREFIX}-${String(i + 1).padStart(String(keyed.length).length, '0')}`, out }); // 001..130 → urutan abjad = urutan angka
  }

  if (process.env.MATCH_TO) {
    // kurva warna per channel (histogram matching) dari frame 0 → gambar acuan, dipakai ke semua frame
    const ref = await sharp(process.env.MATCH_TO).ensureAlpha().raw().toBuffer();
    const hist = (buf) => { const h = [0, 1, 2].map(() => new Float64Array(256)); for (let i = 0; i < buf.length; i += 4) if (buf[i + 3] > 250) for (let c = 0; c < 3; c++) h[c][buf[i + c]]++; return h; };
    const cdf = (h) => { const t = h.reduce((a, b) => a + b, 0); let acc = 0; return Array.from(h, (v) => (acc += v) / t); };
    const hs = hist(outs[0].out), hr = hist(ref);
    const lut = [0, 1, 2].map((c) => {
      const cs = cdf(hs[c]), cr = cdf(hr[c]), L = new Uint8Array(256);
      let u = 0;
      for (let v = 0; v < 256; v++) { while (u < 255 && cr[u] < cs[v]) u++; L[v] = u; }
      return L;
    });
    for (const o of outs) for (let i = 0; i < o.out.length; i += 4) if (o.out[i + 3]) for (let c = 0; c < 3; c++) o.out[i + c] = lut[c][o.out[i + c]];
    console.log('warna disamakan dengan', process.env.MATCH_TO);
  } else {
    await matchColors(outs.map((o) => o.out));
  }
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const o of outs) {
    const img = sharp(o.out, { raw: { width: CANVAS.w, height: CANVAS.h, channels: 4 } });
    await img.clone().png().toFile(path.join(OUT_DIR, `${o.name}.png`));
    await img.clone().webp({ quality: 88, alphaQuality: 100 }).toFile(path.join(OUT_DIR, `${o.name}.webp`));
  }
  console.log(`✓ ${outs.length} frame → ${OUT_DIR}`);
})();
