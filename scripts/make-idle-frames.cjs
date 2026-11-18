/*
 * Membuat frame idle (napas pelan, kepala miring, kedip) dari walker-stand.webp.
 * Tidak menggambar ulang karakter: hanya mendeformasi gambar asli secara halus
 * (warp) + melukis kelopak mata tertutup, jadi gaya ilustrasinya tetap identik.
 *
 * Pakai:  node scripts/make-idle-frames.cjs
 * Hasil:  frames/s1-idle/s1-idle-01..04.webp (+ .png untuk dicek)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../public/assets/walker-stand.webp');
const OUT = path.join(__dirname, '../frames/s1-idle');

/* ── Titik acuan di walker-stand (933 × 2092 px) ── */
const HEAD_C = [352, 330];   // pusat kepala
const NECK = [352, 560];     // poros miring kepala (leher)
const HEAD_R0 = 300;         // radius kepala penuh ikut miring
const HEAD_R1 = 560;         // di luar radius ini tidak ikut miring
const BREATH_TOP = 640;      // bahu: naik penuh di atas garis ini
const BREATH_BOTTOM = 1180;  // pinggang/rok: diam di bawah garis ini
// Mata untuk kedip: elips yang menutupi bukaan + sudut dalam/luar (untuk garis bulu mata)
const EYES = [
  { c: [261, 278], rx: 64, ry: 41, inner: [312, 294], outer: [208, 271] }, // kiri (di gambar)
  { c: [447, 271], rx: 64, ry: 41, inner: [397, 284], outer: [499, 261] }, // kanan (di gambar)
];

/* ── 4 frame loop: napas naik → puncak + kedip → turun ── */
const FRAMES = [
  // tilt dibiarkan 0: memiringkan kepala lewat warp membuat kepala/hijab terlihat penyok
  { name: 's1-idle-01', breath: 0.0, tilt: 0, blink: 0 },
  { name: 's1-idle-02', breath: 0.6, tilt: 0, blink: 0 },
  { name: 's1-idle-03', breath: 1.0, tilt: 0, blink: 1 },
  { name: 's1-idle-04', breath: 0.5, tilt: 0, blink: 0 },
];
const BREATH_PX = 7;      // bahu & kepala naik maksimal (px di resolusi asli), kepala tetap utuh
const CHEST_WIDEN = 0;    // 0 = dada tidak dilebarkan (menghindari bentuk berubah)

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function sample(src, W, H, x, y, out, o) {
  // bilinear, premultiplied alpha supaya tepi transparan tidak bergaris
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  let r = 0, g = 0, b = 0, a = 0;
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 2; i++) {
      const xx = x0 + i, yy = y0 + j;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const w = (i ? fx : 1 - fx) * (j ? fy : 1 - fy);
      const p = (yy * W + xx) * 4;
      const al = (src[p + 3] / 255) * w;
      r += src[p] * al; g += src[p + 1] * al; b += src[p + 2] * al; a += al;
    }
  }
  if (a > 1e-6) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; }
  else { out[o] = out[o + 1] = out[o + 2] = 0; }
  out[o + 3] = a * 255;
}

function warp(src, W, H, f) {
  const out = Buffer.alloc(W * H * 4);
  const th = (f.tilt * Math.PI) / 180;
  const cos = Math.cos(-th), sin = Math.sin(-th);
  const lift = f.breath * BREATH_PX;
  const widen = 1 + f.breath * CHEST_WIDEN;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // pemetaan terbalik: piksel output (x,y) mengambil dari sumber (sx,sy)
      let sx = x, sy = y;
      // 1) napas: tubuh atas naik, dada sedikit melebar
      const kb = 1 - smooth(BREATH_TOP, BREATH_BOTTOM, sy);
      const kChest = smooth(500, 760, sy) * (1 - smooth(900, BREATH_BOTTOM, sy));
      sy += lift * kb;
      sx = NECK[0] + (sx - NECK[0]) / (1 + (widen - 1) * kChest);
      // 2) kepala miring di sekitar leher, melemah menjauhi kepala
      const d = Math.hypot(sx - HEAD_C[0], sy - HEAD_C[1]);
      const kh = 1 - smooth(HEAD_R0, HEAD_R1, d);
      if (kh > 0 && th !== 0) {
        const px = sx - NECK[0], py = sy - NECK[1];
        const rx = NECK[0] + px * cos - py * sin;
        const ry = NECK[1] + px * sin + py * cos;
        sx += (rx - sx) * kh;
        sy += (ry - sy) * kh;
      }
      sample(src, W, H, sx, sy, out, (y * W + x) * 4);
    }
  }
  return out;
}

/* ── Kedip: tutup bukaan mata dengan kulit halus + garis bulu mata ── */
function isSkin(r, g, b) {
  // kulit hangat; hijab (pink, b ≈ g) & bulu mata (gelap) tidak lolos
  return r > 175 && g > 0.72 * r && b < g && r - b > 30;
}

// solve 6×6 least squares (normal equations) untuk model warna kuadratik
function fitQuadratic(pts) {
  const n = 6, A = Array.from({ length: n }, () => new Float64Array(n)), B = [0, 1, 2].map(() => new Float64Array(n));
  for (const [x, y, rgb] of pts) {
    const f = [1, x, y, x * x, y * y, x * y];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) A[i][j] += f[i] * f[j];
      for (let c = 0; c < 3; c++) B[c][i] += f[i] * rgb[c];
    }
  }
  return B.map((rhs) => {
    const M = A.map((r, i) => [...r, rhs[i]]);
    for (let i = 0; i < n; i++) {
      let p = i;
      for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
      [M[i], M[p]] = [M[p], M[i]];
      for (let k = 0; k < n; k++) if (k !== i) {
        const r = M[k][i] / M[i][i];
        for (let j = i; j <= n; j++) M[k][j] -= r * M[i][j];
      }
    }
    return M.map((r, i) => r[n] / r[i]);
  });
}

function blink(buf, W, H) {
  for (const e of EYES) {
    const [cx, cy] = e.c;
    const nr = (x, y) => Math.hypot((x - cx) / e.rx, (y - cy) / e.ry);
    // 1) isi bukaan mata dengan "harmonic fill": warna menyambung persis dari kulit di tepinya
    const x0 = Math.floor(cx - e.rx) - 1, y0 = Math.floor(cy - e.ry) - 1;
    const bw = Math.ceil(e.rx * 2) + 3, bh = Math.ceil(e.ry * 2) + 3;
    const fill = [0, 1, 2].map(() => new Float32Array(bw * bh));
    const inside = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const X = x + x0, Y = y + y0, p = (Y * W + X) * 4;
      inside[y * bw + x] = nr(X, Y) < 1 && x > 0 && y > 0 && x < bw - 1 && y < bh - 1 ? 1 : 0;
      for (let c = 0; c < 3; c++) fill[c][y * bw + x] = buf[p + c];
    }
    for (let it = 0; it < 1500; it++) for (let c = 0; c < 3; c++) {
      const F = fill[c];
      for (let y = 1; y < bh - 1; y++) for (let x = 1; x < bw - 1; x++) {
        const i = y * bw + x;
        if (!inside[i]) continue;
        const avg = (F[i - 1] + F[i + 1] + F[i - bw] + F[i + bw]) / 4;
        F[i] += 1.9 * (avg - F[i]); // SOR
      }
    }
    const model = (X, Y) => {
      const i = (Y - y0) * bw + (X - x0);
      return [fill[0][i], fill[1][i], fill[2][i]];
    };

    // garis kelopak tertutup: kurva kuadratik dalam → luar, melengkung ke bawah (⌣)
    const [ix, iy] = e.inner, [ox, oy] = e.outer;
    const ctrl = [(ix + ox) / 2, (iy + oy) / 2 + 12];
    const lidAt = (t) => [
      (1 - t) ** 2 * ix + 2 * (1 - t) * t * ctrl[0] + t * t * ox,
      (1 - t) ** 2 * iy + 2 * (1 - t) * t * ctrl[1] + t * t * oy,
    ];
    const curve = Array.from({ length: 200 }, (_, i) => lidAt(i / 199));
    const nearest = (x, y) => {
      let best = 1e9, bt = 0;
      curve.forEach(([px, py], i) => { const d = (px - x) ** 2 + (py - y) ** 2; if (d < best) { best = d; bt = i / 199; } });
      return [Math.sqrt(best), bt];
    };

    // 2) cat kelopak: kulit halus + bayangan lembut seperti kelopak 3D
    for (let y = y0 + 1; y < y0 + bh - 1; y++)
      for (let x = x0 + 1; x < x0 + bw - 1; x++) {
        const r = nr(x, y);
        if (r >= 1) continue;
        const a = 1;
        const u = (x - cx) / e.rx, v = (y - cy) / e.ry;
        let col = model(x, y);
        const [d, t] = nearest(x, y);
        const lidY = lidAt(t)[1];
        const above = y < lidY;
        // kelopak cembung (bola mata di baliknya): terang di tengah, bayangan tipis hanya di garis
        const bulge = 0.07 * Math.exp(-((u * 1.1) ** 2 + ((v + 0.1) * 1.5) ** 2)) * (above ? 1 : 0.5);
        const crease = 0.06 * Math.exp(-d / 2.5);
        col = col.map((c) => Math.min(255, c * (1 + bulge - crease)));
        const p = (y * W + x) * 4;
        for (let c = 0; c < 3; c++) buf[p + c] = buf[p + c] * (1 - a) + col[c] * a;
      }

    // 3) garis bulu mata: tipis di sudut dalam, tebal + sedikit kibasan di sudut luar
    const lash = [62, 36, 30];
    const SS = 4;
    const xs = [Math.min(ix, ox) - 10, Math.max(ix, ox) + 10];
    for (let y = Math.floor(Math.min(iy, oy) - 12); y <= Math.max(iy, oy) + 20; y++)
      for (let x = Math.floor(xs[0]); x <= xs[1]; x++) {
        let cov = 0;
        for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS, py = y + (sy + 0.5) / SS;
          const [d, t] = nearest(px, py);
          const thick = (1.4 + 3.6 * t ** 1.4) * (t > 0.92 ? 1 - (t - 0.92) / 0.1 : 1);
          if (d < thick && t > 0.01) cov++;
        }
        if (!cov) continue;
        const a = (cov / SS / SS) * 0.96, p = (y * W + x) * 4;
        for (let c = 0; c < 3; c++) buf[p + c] = buf[p + c] * (1 - a) + lash[c] * a;
      }
  }
}


(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  fs.mkdirSync(OUT, { recursive: true });
  // kedip dilukis di gambar asli dulu, baru di-warp (supaya ikut miring)
  const closed = Buffer.from(data);
  blink(closed, W, H);
  for (const f of FRAMES) {
    const out = warp(f.blink ? closed : data, W, H, f);
    const img = sharp(out, { raw: { width: W, height: H, channels: 4 } });
    await img.clone().webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(OUT, `${f.name}.webp`));
    await img.clone().png().toFile(path.join(OUT, `${f.name}.png`));
    console.log('✓', f.name);
  }
})();
