/*
 * Menyamakan color tone semua frame seluruh badan dengan bust di hero (base.png).
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
// contoh frame per grup (cukup beberapa, mewakili)
const GROUPS = {
  stand: ['public/assets/walker-stand.webp'],
  full: [1, 12, 26, 40, 55, 70, 85, 105, 128].map((i) => `frames/s2-full-video/s2-full-${String(i).padStart(2, '0')}.png`),
};
const GROUP_TONE = { stand: 'stand', wave: 'stand', full: 'full' };

// rentang Lab tiap bahan
const MATERIALS = {
  krem: (L, a, b) => L > 78 && L < 93 && Math.hypot(a, b) < 22 && b > 2 && a < 9,
  kulit: (L, a, b) => L > 62 && L < 85 && a > 9 && a < 26 && b > 13 && b < 32,
  pink: (L, a, b) => L > 55 && L < 78 && a > 12 && b > -4 && b < 9,
};
const med = (arr) => { const s = [...arr].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

async function stats(files, upperOnly) {
  const acc = Object.fromEntries(Object.keys(MATERIALS).map((m) => [m, { a: [], b: [] }]));
  for (const f of files) {
    const { data, info } = await sharp(path.join(ROOT, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (upperOnly) despillAll(data); // grup frame diukur setelah despill (sama seperti saat disalin ke web); bust acuan tidak diubah
    // badan atas saja (yang juga terlihat di bust): kepala, hijab, sweater
    const yMax = upperOnly ? info.height * 0.5 : info.height;
    for (let y = 0; y < yMax; y += 2) for (let x = 0; x < info.width; x += 2) {
      const p = (y * info.width + x) * 4;
      if (data[p + 3] < 250) continue;
      const [L, a, b] = toLab(data[p], data[p + 1], data[p + 2]);
      for (const [m, test] of Object.entries(MATERIALS)) if (test(L, a, b)) { acc[m].a.push(a); acc[m].b.push(b); break; }
    }
  }
  return Object.fromEntries(Object.entries(acc).map(([m, v]) => [m, [med(v.a), med(v.b)]]));
}

(async () => {
  const target = await stats(BUST, false);
  console.log('bust  ', JSON.stringify(target));
  const fits = {};
  for (const [g, files] of Object.entries(GROUPS)) {
    const src = await stats(files, true);
    // titik koreksi: rona bahan di grup ini → geser (Δa, Δb) ke rona bust
    fits[g] = Object.keys(MATERIALS).map((m) => ({
      material: m,
      ab: src[m].map((v) => +v.toFixed(2)),
      d: [+(target[m][0] - src[m][0]).toFixed(2), +(target[m][1] - src[m][1]).toFixed(2)],
    }));
    console.log(g.padEnd(6), fits[g].map((f) => `${f.material} Δa ${f.d[0]} Δb ${f.d[1]}`).join(' | '));
  }
  const groups = Object.fromEntries(Object.entries(GROUP_TONE).map(([g, s]) => [g, fits[s]]));
  fs.writeFileSync(path.join(__dirname, 'tone.json'), JSON.stringify({ note: 'koreksi rona Lab per bahan agar tone = base.png (dibuat fit-tone.cjs)', groups }, null, 1));
  console.log('→ scripts/tone.json');
})();
