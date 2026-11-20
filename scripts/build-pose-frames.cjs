/*
 * Pose karakter untuk halaman detail project (carousel Design Process).
 * Gambar sumber (sudah transparan) → kanvas karakter standar (key-white.cjs: tinggi 2092, kepala
 * di tengah) → WebP + titik tumpu (kepala x, sol sepatu y) + posisi mata untuk kilau & kedip.
 * Terpisah dari build-frame-manifest.cjs supaya ratusan frame lain tidak ikut dibuat ulang.
 *
 * Pakai: node scripts/build-pose-frames.cjs
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { detectEyes } = require('./lib/eyes.cjs');
const { toLab } = require('./lib/greenkey.cjs');

const ROOT = path.join(__dirname, '..');
const POSES = [
  ['papers', 'frames/raw/detail/pose-papers.webp'], // memegang kertas, tangan terbuka
  ['point', 'frames/raw/detail/pose-point.webp'],   // menunjuk ke atas
  ['open', 'frames/raw/detail/pose-open.webp'],     // kedua tangan terbuka
];
const OUT_DIR = path.join(ROOT, 'public/assets/frames');
const TMP = path.join(ROOT, 'frames/raw/detail');

async function anchorOf(data, W, H) {
  let y0 = H, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  let sx = 0, n = 0;
  const a = Math.round(y0 + (y1 - y0) * 0.03), b = Math.round(y0 + (y1 - y0) * 0.18);
  for (let y = a; y <= b; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) { sx += x; n++; }
  return { anchor: [Math.round((sx / n) * 10) / 10, y1 + 1], bh: y1 - y0 + 1 };
}

(async () => {
  const frames = [];
  for (const [name, file] of POSES) {
    const keyed = path.join(TMP, `pose-${name}-keyed.png`);
    execFileSync('node', [path.join(__dirname, 'key-white.cjs'), path.join(ROOT, file), keyed], { stdio: 'inherit' });
    const { data, info } = await sharp(keyed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const out = path.join(OUT_DIR, `pose-${name}.webp`);
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ quality: 88, alphaQuality: 90 }).toFile(out);
    const { anchor, bh } = await anchorOf(data, info.width, info.height);
    const top = anchor[1] - bh;
    const eyes = detectEyes(data, info.width, info.height, { blackLum: 40 }).filter((e) => {
      const [L, a, b] = toLab(...e.skin);
      return e.cy < top + bh * 0.17 && a > 5 && a < 32 && b > 10 && b < 36 && L > 45;
    });
    if (eyes.length !== 2) console.warn(`  ! pose-${name}: ${eyes.length} mata terdeteksi`);
    const ver = crypto.createHash('md5').update(fs.readFileSync(out)).digest('hex').slice(0, 8);
    frames.push({ key: name, src: `/assets/frames/pose-${name}.webp?v=${ver}`, w: info.width, h: info.height, anchor, ch: bh, eyes });
    console.log('✓', name, info.width + '×' + info.height, 'ch', bh, 'mata', eyes.length);
  }
  const ts = `// Dibuat otomatis oleh scripts/build-pose-frames.cjs — jangan diedit manual.
import type { Frame } from './frames';

export const POSE_FRAMES: Record<'papers' | 'point' | 'open', Frame> = ${JSON.stringify(Object.fromEntries(frames.map(({ key, ...f }) => [key, f])))};
`;
  fs.writeFileSync(path.join(ROOT, 'src/components/poseFrames.ts'), ts);
})();
