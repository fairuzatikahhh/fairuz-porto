/*
 * Menempel desain kartu ID asli (dari foto mockup) ke kartu di gambar karakter hasil Gemini,
 * supaya desain kartunya persis (logo, nama, foto). Perspektif foto diluruskan (homografi),
 * sudut dibulatkan, diberi gradasi cahaya & bayangan halus agar menyatu dengan render 3D.
 *
 * Foto orang di kartu diganti dengan potret 3D karakternya sendiri (CFG.portrait), supaya
 * gayanya sama (3D Pixar).
 *
 * Pakai: node scripts/place-card.cjs <gambar-karakter> <foto-kartu> <out.png>
 *        CARD_ONLY=<png> CARD_W=<px> node scripts/place-card.cjs - <foto-kartu> -
 *          → hanya menyimpan desain kartunya (resolusi CARD_W×4), untuk ditempel ke frame video
 *   pengaturan posisi ada di CFG di bawah.
 */
const sharp = require('sharp');

const [, , CHAR, PHOTO, OUT] = process.argv;
const path = require('path');
const CFG = {
  // 4 sudut kartu di foto (TL, TR, BR, BL), px
  src: [[1202, 518], [1602, 485], [1590, 1080], [1200, 1122]],
  // kartu di gambar karakter: tengah-atas (x, y) & lebar; tinggi mengikuti rasio kartu asli
  top: [442.5, 576], width: 84, ratio: 600 / 400,
  radius: 0.07,       // sudut membulat (× lebar)
  clipBox: [430, 560, 456, 588], // area klip lanyard yang dikembalikan dari gambar asli (x0,y0,x1,y1)
  // potret 3D: frame karakter transparan, dipotong dari ujung hijab sampai `cut` × tinggi badan
  portrait: 'frames/s3-stand-video/s3-stand-48.png', cut: 0.4, // kepala & bahu
  portraitBox: { right: 0.02, height: 0.62 }, // di kartu: menempel kanan-bawah, tinggi × tinggi kartu
  // area foto asli yang dihapus (pecahan kartu): [x mulai, y mulai] — beberapa kotak agar teks kiri aman
  erase: [[0.56, 0.16], [0.43, 0.45], [0.36, 0.55]],         // [x, y mulai]: piksel terang dihapus
  wipe: [[0.56, 0.3, 1, 1], [0.43, 0.5, 1, 1], [0.36, 0.6, 1, 1], [0.58, 0.19, 0.84, 0.3], [0.84, 0.235, 1, 0.3]],                         // [x0, y0, x1, y1]: dihapus seluruhnya
};

// homografi: titik tujuan (u,v) di persegi panjang → titik sumber (x,y) di foto
function homography(dst, src) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = dst[i], [x, y] = src[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); b.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); b.push(y);
  }
  for (let c = 0; c < 8; c++) { // eliminasi Gauss
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
  }
  const h = b.map((v, i) => v / A[i][i]);
  return (u, v) => { const w = h[6] * u + h[7] * v + 1; return [(h[0] * u + h[1] * v + h[2]) / w, (h[3] * u + h[4] * v + h[5]) / w]; };
}

(async () => {
  const photo = await sharp(PHOTO).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const PW = photo.info.width;
  const SS = 4; // supersampling
  const w = Number(process.env.CARD_W || CFG.width), h = Math.round(w * CFG.ratio);
  const BW = w * SS, BH = h * SS;
  const map = homography([[0, 0], [BW, 0], [BW, BH], [0, BH]], CFG.src);
  const card = Buffer.alloc(BW * BH * 4);
  const R = CFG.radius * BW;
  for (let v = 0; v < BH; v++) for (let u = 0; u < BW; u++) {
    const [x, y] = map(u + 0.5, v + 0.5);
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, o = (v * BW + u) * 4;
    for (let c = 0; c < 3; c++) {
      let s = 0;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) s += photo.data[((y0 + j) * PW + x0 + i) * 3 + c] * (i ? fx : 1 - fx) * (j ? fy : 1 - fy);
      card[o + c] = s;
    }
    // sudut membulat
    const cx = Math.min(Math.max(u, R), BW - R), cy = Math.min(Math.max(v, R), BH - R);
    const d = Math.hypot(u - cx, v - cy);
    card[o + 3] = 255 * Math.min(1, Math.max(0, R + 0.5 - d));
  }
  // lubang tali di tengah atas → isi hitam (klip asli dikembalikan nanti)
  const hx = BW / 2, hy = BH * 0.055, hr = BW * 0.06;
  for (let v = 0; v < BH; v++) for (let u = 0; u < BW; u++) if (Math.hypot(u - hx, v - hy) < hr * 1.4) {
    const o = (v * BW + u) * 4; card[o] = 30; card[o + 1] = 30; card[o + 2] = 32;
  }
  // hapus foto asli (piksel yang tidak gelap di area foto) → warna dasar kartu
  // warna dasar kartu: median piksel gelap di sekitar area foto
  const bg = [0, 1, 2].map((c) => {
    const vals = [];
    for (let v = Math.round(BH * 0.55); v < BH * 0.9; v += 3) for (let u = Math.round(BW * 0.05); u < BW * 0.3; u += 3) {
      const o = (v * BW + u) * 4;
      if ((card[o] + card[o + 1] + card[o + 2]) / 3 < 52) vals.push(card[o + c]);
    }
    vals.sort((a, b) => a - b);
    return vals[vals.length >> 1] ?? 30;
  });
  const inErase = (u, v) => CFG.erase.some(([ex, ey, ey1 = 1]) => u >= ex * BW && v >= ey * BH && v < ey1 * BH);
  const kill = new Uint8Array(BW * BH);
  for (let v = 0; v < BH; v++) for (let u = 0; u < BW; u++) {
    const o = (v * BW + u) * 4;
    if (inErase(u, v) && (card[o] + card[o + 1] + card[o + 2]) / 3 > 52) kill[v * BW + u] = 1;
  }
  for (let v = 0; v < BH; v++) for (let u = 0; u < BW; u++) { // + pelebaran 3 px (sisa tepi)
    let k = 0;
    for (let j = -3; j <= 3 && !k; j++) for (let i = -3; i <= 3 && !k; i++) {
      const yy = v + j, xx = u + i;
      if (yy >= 0 && yy < BH && xx >= 0 && xx < BW && kill[yy * BW + xx]) k = 1;
    }
    if (k && inErase(u, v)) { const o = (v * BW + u) * 4; card[o] = bg[0]; card[o + 1] = bg[1]; card[o + 2] = bg[2]; }
  }
  for (const [a0, b0, a1, b1] of CFG.wipe) for (let v = Math.round(b0 * BH); v < b1 * BH; v++) for (let u = Math.round(a0 * BW); u < a1 * BW; u++) {
    const o = (v * BW + u) * 4; card[o] = bg[0]; card[o + 1] = bg[1]; card[o + 2] = bg[2];
  }
  // potret 3D karakter
  {
    const pm = await sharp(CFG.portrait).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
    for (let y = 0; y < pm.info.height; y++) for (let x = 0; x < pm.info.width; x++) if (pm.data[(y * pm.info.width + x) * 4 + 3] > 40) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    const ch = Math.round((y1 - y0) * CFG.cut);
    // lebar potongan berpusat di kepala (rata-rata x piksel di 12% teratas)
    let sx = 0, n = 0;
    for (let y = y0; y < y0 + (y1 - y0) * 0.12; y++) for (let x = x0; x <= x1; x++) if (pm.data[(y * pm.info.width + x) * 4 + 3] > 40) { sx += x; n++; }
    const hc = sx / n, cw = Math.round(ch * 0.8);
    const cx0 = Math.max(0, Math.round(hc - cw / 2));
    const ph = Math.round(BH * CFG.portraitBox.height);
    const bust = await sharp(CFG.portrait).extract({ left: cx0, top: y0, width: Math.min(cw, pm.info.width - cx0), height: ch })
      .resize({ height: ph, kernel: 'lanczos3' }).png().toBuffer();
    const bm = await sharp(bust).metadata();
    const bl = Math.round(BW - bm.width - CFG.portraitBox.right * BW), bt = BH - ph;
    const alphaKeep = Buffer.alloc(BW * BH);
    for (let i = 0; i < BW * BH; i++) alphaKeep[i] = card[i * 4 + 3];
    const comp = await sharp(card, { raw: { width: BW, height: BH, channels: 4 } })
      .composite([{ input: bust, left: Math.max(0, bl), top: bt }]).raw().toBuffer();
    comp.copy(card);
    for (let i = 0; i < BW * BH; i++) card[i * 4 + 3] = alphaKeep[i]; // sudut membulat tetap
  }
  // cahaya: sedikit lebih terang di kiri-atas, lebih gelap di kanan-bawah (seperti render 3D)
  for (let v = 0; v < BH; v++) for (let u = 0; u < BW; u++) {
    const o = (v * BW + u) * 4, k = 1.06 - 0.16 * (0.5 * u / BW + 0.5 * v / BH);
    for (let c = 0; c < 3; c++) card[o + c] = Math.min(255, card[o + c] * k);
  }
  if (process.env.CARD_ONLY) {
    await sharp(card, { raw: { width: BW, height: BH, channels: 4 } }).png().toFile(process.env.CARD_ONLY);
    console.log('→', process.env.CARD_ONLY, `${BW}×${BH}`);
    return;
  }
  const small = await sharp(card, { raw: { width: BW, height: BH, channels: 4 } })
    .resize(w, h, { kernel: 'lanczos3' }).blur(0.4).png().toBuffer();

  const base = sharp(CHAR).removeAlpha();
  const { data: orig, info } = await base.clone().raw().toBuffer({ resolveWithObject: true });
  const left = Math.round(CFG.top[0] - w / 2), top = Math.round(CFG.top[1]);
  // bayangan lembut di bawah kartu
  const shadow = await sharp({ create: { width: w + 24, height: h + 24, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp({ create: { width: w, height: h, channels: 4, background: { r: 60, g: 30, b: 30, alpha: 0.22 } } }).png().toBuffer(), left: 12, top: 12 }])
    .blur(6).png().toBuffer();
  const out = await sharp(orig, { raw: info })
    .composite([{ input: shadow, left: left - 12 + 1, top: top - 12 + 3 }, { input: small, left, top }])
    .removeAlpha().raw().toBuffer();
  // kembalikan klip logam asli (piksel terang di area klip) di atas kartu
  const [x0, y0, x1, y1] = CFG.clipBox;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const o = (y * info.width + x) * 3, lum = (orig[o] + orig[o + 1] + orig[o + 2]) / 3;
    const green = orig[o + 1] > orig[o] + 40;
    if (lum > 95 && !green) for (let c = 0; c < 3; c++) out[o + c] = orig[o + c];
  }
  await sharp(out, { raw: info }).png().toFile(OUT);
  console.log('→', OUT, `kartu ${w}×${h} di (${left}, ${top})`);
})();
