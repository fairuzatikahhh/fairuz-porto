/*
 * Menyamakan color tone SEMUA karakter (frame + bust hero) dengan ACUAN: gambar Tercode
 * (frames/s4-plain/s4-plain-01.png — cerah, kontras tegas, pink hidup).
 *
 * Di ruang warna Lab, untuk tiap grup frame diukur rona (a* merah-hijau, b* kuning-biru)
 * median 3 "bahan": sweater krem terang, kulit, dan hijab/syal pink. Selisihnya dengan bust
 * jadi titik koreksi; setiap piksel digeser mengikuti bahan yang ronanya paling dekat
 * (interpolasi halus), warna netral (putih/abu: sepatu, gelas) tidak disentuh.
 *
 * Pakai:  node scripts/fit-tone.cjs   → scripts/tone.json (dipakai build-frame-manifest.cjs)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { toLab, despillAll } = require('./lib/greenkey.cjs');

const ROOT = path.join(__dirname, '..');
const BUST = ['public/assets/base.png'];
const TARGET = ['frames/s4-plain/s4-plain-01.png']; // acuan warna
// contoh frame per grup (cukup beberapa, mewakili)
const GROUPS = {
  stand: ['frames/s1-stand/s1-stand-01.png'],
  full: [1, 12, 26, 40, 55, 70, 85, 105, 128].map((i) => `frames/s2-full-video/s2-full-${String(i).padStart(2, '0')}.png`),
  // melayang dengan payung: diukur sendiri (payung oranye besar tidak ikut dihitung: bukan krem/kulit/pink)
  float: [1, 20, 40, 60, 80, 100, 118].map((i) => `frames/s4-float-video/s4-float-${String(i).padStart(3, '0')}.png`),
  open: [1, 30, 60, 90, 120, 159].map((i) => `frames/s4-open-video/s4-open-${String(i).padStart(3, '0')}.png`),
  work: ['frames/s4-work/s4-work-01.png'],
  plain: ['frames/s4-plain/s4-plain-01.png'],
  tries: ['frames/s4-tries/s4-tries-01.png'],
  genah: ['frames/s4-genah/s4-genah-01.png'],
  fwd: [1, 12, 24, 36, 48].map((i) => `frames/s4-fwd-video/s4-fwd-${String(i).padStart(2, '0')}.png`),
};
const GROUP_TONE = { bust: 'bust', stand: 'stand', wave: 'stand', full: 'full', sit: 'full', slide: 'full', rise: 'full', float: 'float', open: 'open', work: 'work', fwd: 'fwd', tries: 'tries', genah: 'genah', plain: 'plain' };

// rentang Lab tiap bahan
const MATERIALS = {
  krem: (L, a, b) => L > 78 && L < 93 && Math.hypot(a, b) < 22 && b > 2 && a < 9,
  kulit: (L, a, b) => L > 62 && L < 85 && a > 9 && a < 26 && b > 13 && b < 32,
  pink: (L, a, b) => L > 55 && L < 78 && a > 12 && b > -4 && b < 9,
};
const q = (arr, t) => { const s = [...arr].sort((x, y) => x - y); return s[Math.floor((s.length - 1) * t)]; };
const med = (arr) => q(arr, 0.5);
const QS = Array.from({ length: 21 }, (_, i) => 0.02 + (i / 20) * 0.96); // kuantil kurva kecerahan

// isFrame: despill (seperti saat disalin ke web). upper: hanya separuh atas badan (untuk bust)
async function stats(files, isFrame, upper = !isFrame) {
  const acc = Object.fromEntries(Object.keys(MATERIALS).map((m) => [m, { a: [], b: [], L: [] }]));
  const allC = [], allL = []; // seluruh badan (termasuk rok): saturasi & kecerahan
  for (const f of files) {
    const { data, info } = await sharp(path.join(ROOT, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (isFrame) despillAll(data); // grup frame diukur setelah despill (sama seperti saat disalin ke web)
    // bust hanya berisi badan atas → dibandingkan dengan badan atas acuan; frame: seluruh badan (rok ikut)
    const yMax = upper ? info.height * 0.5 : info.height;
    for (let y = 0; y < info.height; y += 3) for (let x = 0; x < info.width; x += 3) {
      const p = (y * info.width + x) * 4;
      if (data[p + 3] < 250) continue;
      const [L, a, b] = toLab(data[p], data[p + 1], data[p + 2]);
      const C = Math.hypot(a, b);
      if (C > 6 && L > 35 && L < 95) { allC.push(C); allL.push(L); }
    }
    for (let y = 0; y < yMax; y += 2) for (let x = 0; x < info.width; x += 2) {
      const p = (y * info.width + x) * 4;
      if (data[p + 3] < 250) continue;
      const [L, a, b] = toLab(data[p], data[p + 1], data[p + 2]);
      for (const [m, test] of Object.entries(MATERIALS)) if (test(L, a, b)) { acc[m].a.push(a); acc[m].b.push(b); acc[m].L.push(L); break; }
    }
  }
  // per bahan: rona (a*, b*) median, kecerahan median & sebaran (kontras, jarak kuartil)
  const out = Object.fromEntries(Object.entries(acc).map(([m, v]) => [m, { ab: [med(v.a), med(v.b)], L: med(v.L), iqr: q(v.L, 0.75) - q(v.L, 0.25) }]));
  out.all = { C: med(allC), L: med(allL), iqr: q(allL, 0.8) - q(allL, 0.2), Lq: QS.map((t) => q(allL, t)) };
  return out;
}

(async () => {
  const targetFull = await stats(TARGET, true, false);
  const targetUpper = await stats(TARGET, true, true);
  const fits = {};
  const all = { bust: [BUST, false], ...Object.fromEntries(Object.entries(GROUPS).map(([g, f]) => [g, [f, true]])) };
  for (const [g, [files, isFrame]] of Object.entries(all)) {
    const src = await stats(files, isFrame);
    const target = isFrame ? targetFull : targetUpper;
    // titik koreksi per bahan: rona (Δa, Δb) + kecerahan (median → median, sebaran diskalakan)
    fits[g] = [{
      // seluruh badan: saturasi (×) & kontras kecerahan — hanya dinaikkan, tidak diturunkan
      global: {
        cs: +Math.min(1.5, Math.max(1, target.all.C / src.all.C)).toFixed(3),
        L: [+src.all.L.toFixed(2), +src.all.L.toFixed(2), 1],
        // kurva kecerahan piksel berwarna: kuantil sumber → kuantil acuan (seperti histogram, hanya L)
        Lq: [src.all.Lq.map((v) => +v.toFixed(2)), target.all.Lq.map((v) => +v.toFixed(2))],
      },
    }, ...Object.keys(MATERIALS).map((m) => ({
      material: m,
      ab: src[m].ab.map((v) => +v.toFixed(2)),
      d: [+(target[m].ab[0] - src[m].ab[0]).toFixed(2), +(target[m].ab[1] - src[m].ab[1]).toFixed(2)],
      L: [+src[m].L.toFixed(2), +target[m].L.toFixed(2), +Math.min(1.3, Math.max(1, target[m].iqr / (src[m].iqr || 1))).toFixed(3)],
    }))];
    const [gl, ...mats] = fits[g];
    console.log(g.padEnd(6), `saturasi ×${gl.global.cs} kontras ×${gl.global.L[2]} |`, mats.map((f) => `${f.material} Δa ${f.d[0]} Δb ${f.d[1]} L ${f.L[0]}→${f.L[1]}`).join(' | '));
  }
  const groups = Object.fromEntries(Object.entries(GROUP_TONE).map(([g, s]) => [g, fits[s]]));
  fs.writeFileSync(path.join(__dirname, 'tone.json'), JSON.stringify({ note: 'koreksi warna Lab per bahan (rona + kecerahan) agar tone = acuan Tercode (dibuat fit-tone.cjs)', groups }, null, 1));
  console.log('→ scripts/tone.json');
})();
