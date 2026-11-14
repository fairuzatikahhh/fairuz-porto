/*
 * Menyalin frame karakter yang dipakai web ke public/assets/frames/ dan menulis
 * src/components/frames.ts berisi ukuran + titik tumpu (anchor) tiap frame.
 *
 * Anchor = [x tengah kepala, y sol sepatu paling bawah] dalam px frame.
 * Dengan anchor di kepala, karakter tidak "goyang" kiri-kanan saat berganti pose
 * (kaki bergantian saat jalan, tapi kepala tetap di jalurnya).
 *
 * Pakai:  node scripts/build-frame-manifest.cjs
 */
const sharp = require('sharp');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/assets/frames');
const OUT_TS = path.join(ROOT, 'src/components/frames.ts');

// grup → daftar file sumber (urutan = urutan frame)
const GROUPS = {
  stand: ['public/assets/walker-stand.webp'],
  wave: [1, 2, 3, 4, 5].map((i) => `frames/s1-wave/s1-wave-0${i}.webp`),
  // satu video utuh (process-video.cjs → frames/s2-full-video): depan → berbalik ke kanan →
  // jalan di tempat → berbalik ke depan. Dipotong per bagian di SlideStory (FULL_CUT).
  // urut ANGKA (bukan abjad: "s2-full-100" tidak boleh berada di antara "-10" dan "-11")
  full: fs.readdirSync(path.join(ROOT, 'frames/s2-full-video')).filter((f) => f.endsWith('.webp'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => `frames/s2-full-video/${f}`),
};

const { applyTone, despillAll, restoreSkirt } = require('./lib/greenkey.cjs');
// rok di walker-stand (dan frame turunannya) sisi kirinya pucat → warnai lagi (baris px rok)
const SKIRT_ROWS = { stand: [1045, 1922], wave: [1045, 1922] }; // pinggang → ujung rok (di atas sepatu)
const { detectEyes } = require('./lib/eyes.cjs');
const TONE_FILE = path.join(__dirname, 'tone.json');
const TONE = fs.existsSync(TONE_FILE) ? JSON.parse(fs.readFileSync(TONE_FILE, 'utf8')).groups : {};

// grup yang posisinya sudah benar dari sumbernya (video) → titik tumpu tetap
// 'first' = titik tumpu & ukuran mengikuti frame pertama (pose depan), supaya sambungan dengan
// walker-stand pas; frame berikutnya bergerak relatif terhadapnya (gerak asli video tetap utuh)
const FIXED_ANCHOR = { full: 'first' };

async function anchorOf(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  let y0 = H, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  let sx = 0, n = 0;
  const a = Math.round(y0 + (y1 - y0) * 0.03), b = Math.round(y0 + (y1 - y0) * 0.18);
  for (let y = a; y <= b; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) { sx += x; n++; }
  return { w: W, h: H, anchor: [Math.round((sx / n) * 10) / 10, y1 + 1], bh: y1 - y0 + 1 };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = {};
  for (const [group, files] of Object.entries(GROUPS)) {
    const list = [];
    for (let i = 0; i < files.length; i++) {
      const src = path.join(ROOT, files[i]);
      const name = `${group}-${String(i + 1).padStart(2, '0')}.webp`;
      // samakan color tone dengan bust (scripts/tone.json, dari fit-tone.cjs), lalu simpan WebP
      const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      despillAll(data); // buang rona hijau di bayangan (sweater/rok walker-stand, pantulan layar hijau)
      if (TONE[group]) applyTone(data, TONE[group]);
      if (SKIRT_ROWS[group]) restoreSkirt(data, info.width, ...SKIRT_ROWS[group]);
      await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .webp({ quality: group === 'full' ? 78 : 88, alphaQuality: 90 }).toFile(path.join(OUT_DIR, name)); // frame video banyak → kompres sedikit lebih
      // posisi mata (untuk kilau mata & kedip di web)
      const eyes = detectEyes(data, info.width, info.height);
      if (eyes.length !== 2) console.warn(`  ! ${name}: ${eyes.length} mata terdeteksi`);
      // ?v=<sidik isi file>: kalau frame dibuat ulang, URL ikut berubah → browser tidak memakai
      // gambar lama dari cache (nama file sama, isi beda)
      const ver = crypto.createHash('md5').update(fs.readFileSync(path.join(OUT_DIR, name))).digest('hex').slice(0, 8);
      list.push({ src: `/assets/frames/${name}?v=${ver}`, ...(await anchorOf(src)), eyes });
    }
    // ch = tinggi karakter rata-rata grup (px frame). Dipakai untuk menyamakan ukuran tampil
    // antar grup yang resolusinya beda, tanpa menghapus gerak naik-turun di dalam grup.
    // grup video: lacak mata antar-frame. Frame "pasti benar" = dua mata sejajar. Mata di frame
    // lain hanya dipakai kalau dekat posisi mata di frame pasti-benar terdekat (±8 frame).
    // Membuang deteksi palsu di tepi kerudung saat mata asli sedang terpejam.
    if (FIXED_ANCHOR[group]) {
      const sure = list.map((f) => f.eyes.length === 2 && Math.abs(f.eyes[0].py - f.eyes[1].py) < Math.max(f.eyes[0].pr, f.eyes[1].pr) * 1.5);
      list.forEach((f, i) => {
        if (sure[i]) return;
        let ref = null;
        for (let d = 1; d <= 8 && !ref; d++) ref = (sure[i - d] && list[i - d]) || (sure[i + d] && list[i + d]) || null;
        f.eyes = ref ? f.eyes.filter((e) => ref.eyes.some((o) => Math.hypot(o.px - e.px, o.py - e.py) < Math.max(14, o.pr * 3))) : f.eyes;
      });
    }
    let ch = Math.round(list.reduce((s, f) => s + f.bh, 0) / list.length);
    // grup dari video: titik tumpu SAMA untuk semua frame, supaya goyangan & naik-turun badan
    // yang asli tetap terlihat (kalau per frame, gerak itu "dibatalkan")
    const mode = FIXED_ANCHOR[group];
    if (mode) {
      const ax = mode === 'first' ? list[0].anchor[0] : Math.round((list.reduce((s, f) => s + f.anchor[0], 0) / list.length) * 10) / 10;
      const ay = Math.max(...list.map((f) => f.anchor[1]));
      if (mode === 'first') ch = list[0].bh;
      list.forEach((f) => { f.anchor = [ax, ay]; });
    }
    out[group] = list.map(({ bh, ...f }) => ({ ...f, ch }));
    console.log('✓', group, list.length, 'frame,', list[0].w + '×' + list[0].h, 'ch', ch);
  }
  const ts =
    '// Dibuat otomatis oleh scripts/build-frame-manifest.cjs — jangan diedit manual.\n' +
    '// anchor = [x tengah kepala, y sol sepatu] dalam px frame; ch = tinggi karakter rata-rata grup (px frame).\n' +
    '// eyes = bukaan mata (cx,cy,rx,ry), iris (px,py,pr) & warna kulit di bawah mata — untuk kilau & kedip.\n' +
    'export interface Eye { cx: number; cy: number; rx: number; ry: number; px: number; py: number; pr: number; skin: readonly [number, number, number] }\n' +
    'export interface Frame { src: string; w: number; h: number; anchor: readonly [number, number]; ch: number; eyes: readonly Eye[] }\n\n' +
    `export const FRAMES = ${JSON.stringify(out)} as const satisfies Record<string, readonly Frame[]>;\n\n` +
    'export const FRAME_URLS: string[] = Object.values(FRAMES).flat().map((f) => f.src);\n';
  fs.writeFileSync(OUT_TS, ts);
  console.log('→', path.relative(ROOT, OUT_TS));
})();
