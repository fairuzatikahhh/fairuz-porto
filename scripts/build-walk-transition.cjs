/*
 * Transisi berjalan untuk carousel Design Process (halaman detail project), dari video 16:9
 * berkamera diam: pose pegang kertas → menoleh → berjalan keluar ke kanan → masuk lagi dari kiri
 * → berbalik → pose menunjuk.
 *
 * Langkah sebelumnya:
 *   swift scripts/extract-video-frames.swift <video> frames/s5-walk2-src
 *   swift scripts/lift-subject-dir.swift frames/s5-walk2-src frames/s5-walk2-cut
 *
 * SEMUA frame dipakai, urut & sekecepatan video (24 fps). Tiap frame dipotong ke kotak karakternya,
 * tapi titik tumpunya = posisi kepala & kaki di frame PERTAMA → di web karakter berjalan persis
 * seperti di video (posisi, kecepatan, saat keluar & masuk layar).
 *
 * Pakai: node scripts/build-walk-transition.cjs <folder-cut> <prefix>
 *   → public/assets/frames/<prefix>-NN.webp + src/components/walk/<prefix>.ts
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, process.argv[2] || 'frames/s5-walk2-cut');
const PREFIX = process.argv[3] || 'walk12';
const OUT = path.join(ROOT, 'public/assets/frames');
const TARGET_CH = 760; // tinggi badan di file web (px)
const FPS = 24;

async function measure(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 100) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) return null; // frame kosong
  let sx = 0, n = 0;
  const a = Math.round(y0 + (y1 - y0) * 0.03), b = Math.round(y0 + (y1 - y0) * 0.18);
  for (let y = a; y <= b; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) { sx += x; n++; }
  return { x0, x1, y0, y1, W, H, headX: n ? sx / n : (x0 + x1) / 2, feet: y1 + 1, bh: y1 - y0 + 1 };
}

(async () => {
  // bersihkan frame lama dengan prefix sama
  for (const f of fs.readdirSync(OUT)) if (f.startsWith(`${PREFIX}-`)) fs.rmSync(path.join(OUT, f));
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.png')).sort();
  const ref = await measure(path.join(SRC, files[0]));
  const last = await measure(path.join(SRC, files[files.length - 1]));
  const s = TARGET_CH / ref.bh; // skala tetap (kamera diam, ukuran karakter tetap)
  const frames = [];
  let swapAt = -1; // frame pertama setelah karakter "melompat" dari tepi kanan ke tepi kiri
  let prevX = null;
  for (let i = 0; i < files.length; i++) {
    const file = path.join(SRC, files[i]);
    const m = await measure(file);
    if (!m) { frames.push(null); continue; }
    // karakter tiba-tiba muncul di tepi seberang = saat pindah tepi
    // (jalan ke kanan: muncul di tepi kiri; jalan ke kiri: muncul di tepi kanan)
    if (prevX != null && swapAt < 0 && (
      (m.x0 < ref.W * 0.05 && prevX[0] > ref.W * 0.3) ||
      (m.x1 > ref.W * 0.95 && prevX[1] < ref.W * 0.7))) swapAt = i;
    prevX = [m.x0, m.x1];
    const pad = 4;
    const left = Math.max(0, m.x0 - pad), top = Math.max(0, m.y0 - pad);
    const width = Math.min(m.W, m.x1 + pad) - left, height = Math.min(m.H, m.y1 + pad) - top;
    const w = Math.round(width * s), h = Math.round(height * s);
    const name = `${PREFIX}-${String(i + 1).padStart(2, '0')}.webp`;
    await sharp(file).extract({ left, top, width, height }).resize(w, h).webp({ quality: 78, alphaQuality: 85 }).toFile(path.join(OUT, name));
    const ver = crypto.createHash('md5').update(fs.readFileSync(path.join(OUT, name))).digest('hex').slice(0, 8);
    frames.push({ src: `/assets/frames/${name}?v=${ver}`, w, h, anchor: [Math.round((ref.headX - left) * s * 10) / 10, Math.round((ref.feet - top) * s * 10) / 10], ch: TARGET_CH, eyes: [] });
  }
  // lebar frame video & geseran kepala di akhir (dalam satuan tinggi badan) — dipakai web untuk
  // menyelaraskan pose diam berikutnya dengan frame terakhir
  const meta = { fps: FPS, swapAt, videoW: Math.round(ref.W * s), endDx: Math.round((last.headX - ref.headX) * s * 10) / 10 };
  const ts = `// Dibuat otomatis oleh scripts/build-walk-transition.cjs — jangan diedit manual.
// Transisi berjalan Design Process (video 16:9, kamera diam), sumber: ${path.relative(ROOT, SRC)}
import type { WalkVideo } from './types';

const video: WalkVideo = ${JSON.stringify({ frames, ...meta })};
export default video;
`;
  fs.mkdirSync(path.join(ROOT, 'src/components/walk'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, `src/components/walk/${PREFIX}.ts`), ts);
  const bytes = fs.readdirSync(OUT).filter((f) => f.startsWith(`${PREFIX}-`)).reduce((t, f) => t + fs.statSync(path.join(OUT, f)).size, 0);
  console.log('✓', frames.filter(Boolean).length, 'frame, pindah tepi di frame', swapAt, ', geser akhir', meta.endDx, 'px,', Math.round(bytes / 1024), 'KB');
})();
