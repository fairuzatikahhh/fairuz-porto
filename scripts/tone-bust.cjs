/*
 * Bust di hero (public/assets/base.png) disamakan warnanya dengan acuan Tercode, memakai koreksi
 * grup "bust" di scripts/tone.json (fit-tone.cjs) — sama seperti semua frame karakter.
 * Hasil: public/assets/base-toned.png (base.png asli tidak diubah).
 *
 * Pakai: node scripts/tone-bust.cjs
 */
const sharp = require('sharp');
const path = require('path');
const { applyTone } = require('./lib/greenkey.cjs');

const ROOT = path.join(__dirname, '..');
const TONE = require('./tone.json').groups.bust;
(async () => {
  const { data, info } = await sharp(path.join(ROOT, 'public/assets/base.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  applyTone(data, TONE);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 })
    .toFile(path.join(ROOT, 'public/assets/base-toned.png'));
  console.log('→ public/assets/base-toned.png');
})();
