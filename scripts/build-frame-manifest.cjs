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
  stand: ['frames/s1-stand/s1-stand-01.webp'], // pose badan penuh setelah zoom-out (gambar Gemini, ditajamkan)
  wave: [1, 2, 3, 4, 5].map((i) => `frames/s1-wave/s1-wave-0${i}.webp`),
  // satu video utuh (process-video.cjs → frames/s2-full-video): depan → berbalik ke kanan →
  // jalan di tempat → berbalik ke depan. Dipotong per bagian di SlideStory (FULL_CUT).
  // urut ANGKA (bukan abjad: "s2-full-100" tidak boleh berada di antara "-10" dan "-11")
  full: fs.readdirSync(path.join(ROOT, 'frames/s2-full-video')).filter((f) => f.endsWith('.webp'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => `frames/s2-full-video/${f}`),
  // perosotan (process-video.cjs, warna & posisi disambung ke frame sebelumnya):
  // duduk (melihat ke bawah → duduk), meluncur (loop), berdiri (turun → berdiri menghadap depan)
  sit: videoFrames('frames/s3-sit-video', { every: 2, last: 90 }),   // 91–143 = duduk diam, tidak perlu
  slide: videoFrames('frames/s3-slide-video', { every: 2 }),
  rise: videoFrames('frames/s3-stand-video'),                      // bangun dari perosotan (48 frame, sudah selang satu)
  // melayang turun dengan payung ke section riwayat pekerjaan
  float: videoFrames('frames/s4-float-video', { every: 2 }),
  // mengeluarkan & membuka payung (diproses dengan skala & posisi SAMA dengan s4-float → nyambung)
  open: videoFrames('frames/s4-open-video', { every: 2 }),
  // berdiri dengan lanyard Tries (gambar diam; napas & kedip dibuat di web)
  work: ['frames/s4-work/s4-work-01.webp'],
  // berjalan maju mendekat (ukuran membesar alami dari video; titik acuan per frame = kaki)
  fwd: videoFrames('frames/s4-fwd-video'), // 48 frame (selang satu, ditajamkan Real-ESRGAN): sampai berhenti tegak, tangan di samping
  // pose diam di section pekerjaan (gambar Gemini, ditajamkan; kartu ditempel fix-video-cards.cjs)
  tries: ['frames/s4-tries/s4-tries-01.webp'],  // gambar Genah, tali diwarnai hitam, kartu Tries asli
  genah: ['frames/s4-genah/s4-genah-01.webp'],  // gambar Gemini sendiri (tali biru langit), kartu putih asli
  // tanpa lanyard (Tercode, Telkom): gambar Gemini dari pose akhir Tries, lanyard dihapus
  plain: ['frames/s4-plain/s4-plain-01.webp'],
};

// frame video (urut angka), opsional diambil tiap N frame / sampai frame ke-`last` (hemat ukuran)
function videoFrames(dir, { every = 1, last = Infinity } = {}) {
  return fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.webp'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .filter((_, i) => i < last && i % every === 0)
    .map((f) => `${dir}/${f}`);
}

const { applyTone, despillAll, restoreSkirt, toLab } = require('./lib/greenkey.cjs');
// rok di walker-stand (dan frame turunannya) sisi kirinya pucat → warnai lagi (baris px rok)
const SKIRT_ROWS = { wave: [1045, 1922] }; // pinggang → ujung rok (di atas sepatu)
const { detectEyes } = require('./lib/eyes.cjs');
const TONE_FILE = path.join(__dirname, 'tone.json');
const TONE = fs.existsSync(TONE_FILE) ? JSON.parse(fs.readFileSync(TONE_FILE, 'utf8')).groups : {};

// grup yang posisinya sudah benar dari sumbernya (video) → titik tumpu tetap
// 'first' = titik tumpu & ukuran mengikuti frame pertama (pose depan), supaya sambungan dengan
// walker-stand pas; frame berikutnya bergerak relatif terhadapnya (gerak asli video tetap utuh)
const FIXED_ANCHOR = { full: 'first', sit: 'first', slide: 'group:sit', rise: 'group:sit', float: 'first', open: 'group:float' };
// gambar dari Gemini: pupil sedikit lebih terang → batas inti hitam dilonggarkan
const EYE_OPTS = { stand: { blackLum: 40 }, work: { blackLum: 34 }, plain: { blackLum: 40 }, tries: { blackLum: 40 }, genah: { blackLum: 40 } };
// pose diam di section pekerjaan: posisi mata diukur manual (deteksi otomatis hanya menemukan 0–1
// mata → kedip sebelah / tidak berkedip). Kunci = indeks frame dalam grup.
const EYES_TRIES_END = [
  { cx: 638.8, cy: 311, rx: 31, ry: 21, px: 640.3, py: 313.6, pr: 20.8, skin: [183, 133, 114] },
  { cx: 760, cy: 309, rx: 31, ry: 21, px: 754.9, py: 309.2, pr: 20.8, skin: [217, 168, 152] },
];
const EYES_SET = {
  fwd: { 47: EYES_TRIES_END },   // berdiri tegak dengan lanyard Tries
  open: {                        // berdiri tegak tanpa lanyard (Tercode, Telkom)
    13: [
      { cx: 917, cy: 516, rx: 37, ry: 24, px: 925, py: 517, pr: 22, skin: [170, 134, 110] },
      { cx: 1055, cy: 520, rx: 37, ry: 23, px: 1047, py: 522, pr: 22, skin: [211, 166, 153] },
    ],
  },
};
// mata yang tak lolos deteksi (bulu mata menyatu dengan iris) → diisi manual; ukuran = mata satunya
const EYES_ADD = {
  work: [{ cx: 562, cy: 273, rx: 44.5, ry: 30.3, px: 554.5, py: 273, pr: 30.3, skin: [214, 166, 147] }],
};
// tinggi badan (ujung hijab → sol sepatu) bila kotak frame memuat benda lain di atas kepala (payung)
const FIXED_CH = { float: 1521, fwd: 1000 }; // fwd: tinggi badan di frame PERTAMA (lalu membesar)

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
        .webp({ quality: ['full', 'sit', 'slide', 'rise', 'float', 'open', 'fwd'].includes(group) ? 78 : 88, alphaQuality: 90 }).toFile(path.join(OUT_DIR, name)); // frame video banyak → kompres sedikit lebih
      // posisi mata (untuk kilau mata & kedip di web)
      const eyes = detectEyes(data, info.width, info.height, EYE_OPTS[group]);
      if (EYES_ADD[group] && eyes.length < 2) eyes.push(...EYES_ADD[group].filter((e) => !eyes.some((d) => Math.abs(d.cx - e.cx) < e.rx)));
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
    if (!mode && FIXED_CH[group]) ch = FIXED_CH[group];
    if (mode) {
      if (mode.startsWith('group:')) {
        // kanvas & posisi sama persis dengan grup lain (video lanjutan yang diselaraskan ALIGN_TO)
        const ref = out[mode.slice(6)][0];
        ch = ref.ch;
        list.forEach((f) => { f.anchor = [...ref.anchor]; });
      } else {
        const ax = mode === 'first' ? list[0].anchor[0] : Math.round((list.reduce((s, f) => s + f.anchor[0], 0) / list.length) * 10) / 10;
        const ay = mode === 'first' ? list[0].anchor[1] : Math.max(...list.map((f) => f.anchor[1]));
        if (mode === 'first') ch = FIXED_CH[group] ?? list[0].bh;
        list.forEach((f) => { f.anchor = [ax, ay]; });
      }
    }
    for (const [i, eyes] of Object.entries(EYES_SET[group] ?? {})) if (list[i]) list[i].eyes = eyes;
    // buang "mata" palsu (bayangan di hijab / tangan): harus di area kepala (≤17% tinggi badan dari
    // atas) dan warna kelopak di atasnya harus kulit, bukan pink hijab → web tidak menggambar kilau
    // & kedip di tempat yang salah
    list.forEach((f) => {
      const H = f.bh, top = f.anchor[1] - H; // tinggi karakter sebenarnya di frame ini
      f.eyes = f.eyes.filter((e) => {
        const [L, a, b] = toLab(...e.skin);
        return e.cy < top + H * 0.17 && a > 5 && a < 32 && b > 10 && b < 36 && L > 45;
      });
    });
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
    '// dimuat di awal (loader): hanya frame hero; frame perosotan dimuat di latar belakang oleh canvas\n' +
    "export const FRAME_URLS: string[] = [FRAMES.stand, FRAMES.wave, FRAMES.full].flat().map((f) => f.src);\n";
  fs.writeFileSync(OUT_TS, ts);
  console.log('→', path.relative(ROOT, OUT_TS));
})();
