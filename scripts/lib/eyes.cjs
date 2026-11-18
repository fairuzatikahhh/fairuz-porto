/*
 * Mendeteksi mata di frame karakter (untuk kedip & kilau mata di web).
 *
 * Pupil/iris = gumpalan piksel paling gelap di daerah wajah (alis cokelat & lipatan hijab
 * tidak segelap itu). Dari gumpalan itu diambil 2 terbesar = 2 mata. Bukaan mata (untuk
 * kelopak saat kedip) diperkirakan dari bagian putih mata di sekitar iris.
 *
 * Hasil per mata (px frame):
 *   cx, cy, rx, ry   pusat & jari-jari bukaan mata
 *   px, py, pr       pusat & jari-jari iris (untuk kilau)
 *   skin [r,g,b]     warna kulit kelopak (di atas mata) untuk kelopak saat kedip
 */
function detectEyes(data, W, H, { blackLum = 24 } = {}) { // blackLum: batas inti pupil hitam
  let y0 = H, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const ch = y1 - y0;
  const fy0 = Math.round(y0 + ch * 0.05), fy1 = Math.round(y0 + ch * 0.22); // daerah wajah
  const P = (x, y) => (y * W + x) * 4;
  const lum = (p) => 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  const dark = (x, y) => { const p = P(x, y); return data[p + 3] > 250 && lum(p) < 55; };
  const light = (x, y) => {
    const p = P(x, y);
    const c = Math.max(data[p], data[p + 1], data[p + 2]) - Math.min(data[p], data[p + 1], data[p + 2]);
    return data[p + 3] > 250 && lum(p) > 140 && c < 45;
  };

  // gumpalan gelap (flood fill)
  const seen = new Uint8Array(W * H);
  const blobs = [];
  for (let y = fy0; y < fy1; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (seen[i] || !dark(x, y)) continue;
    const st = [i];
    seen[i] = 1;
    let n = 0, sx = 0, sy = 0, a = W, b = 0, c = H, d = 0;
    while (st.length) {
      const j = st.pop(), xx = j % W, yy = (j - xx) / W;
      n++; sx += xx; sy += yy;
      if (xx < a) a = xx; if (xx > b) b = xx; if (yy < c) c = yy; if (yy > d) d = yy;
      for (const [kx, ky] of [[xx - 1, yy], [xx + 1, yy], [xx, yy - 1], [xx, yy + 1]]) {
        if (kx < 0 || kx >= W || ky < fy0 || ky >= fy1) continue;
        const k = ky * W + kx;
        if (!seen[k] && dark(kx, ky)) { seen[k] = 1; st.push(k); }
      }
    }
    // bentuk iris: tidak terlalu pipih (bulu mata/alis) dan tidak tinggi-tipis (bayangan tepi kerudung)
    const w = b - a + 1, h = d - c + 1;
    if (n > ch * ch * 0.00003 && h > w * 0.45 && h < w * 1.6) blobs.push({ n, cx: sx / n, cy: sy / n, w, h });
  }
  // mata asli selalu punya PUPIL yang hampir hitam pekat; lipatan kerudung/alis paling gelap
  // pun masih cokelat-pink → gumpalan tanpa inti hitam dibuang
  for (let k = blobs.length - 1; k >= 0; k--) {
    const bl = blobs[k], R = Math.sqrt(bl.n / Math.PI) * 1.3;
    let black = 0;
    for (let y = Math.round(bl.cy - R); y <= bl.cy + R; y++) for (let x = Math.round(bl.cx - R); x <= bl.cx + R; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const p = P(x, y);
      if (data[p + 3] > 250 && lum(p) < blackLum) black++;
    }
    if (black < Math.max(6, bl.n * 0.04)) blobs.splice(k, 1);
  }
  blobs.sort((p, q) => q.n - p.n);
  // mata kedua harus mirip ukuran & sejajar dengan mata pertama; kalau tidak (pose profil:
  // hanya 1 mata terlihat), jangan ambil gumpalan gelap lain (lipatan hijab/alis) sebagai mata
  const irises = blobs.slice(0, 1);
  const b2 = blobs[1];
  if (b2 && b2.n > blobs[0].n * 0.3 && Math.abs(b2.cy - blobs[0].cy) < Math.sqrt(blobs[0].n) * 1.6 &&
      Math.abs(b2.cx - blobs[0].cx) < Math.sqrt(blobs[0].n) * 8) irises.push(b2);

  const r1 = (v) => Math.round(v * 10) / 10;
  return irises.map((ir) => {
    const pr = Math.sqrt(ir.n / Math.PI) * 1.25; // iris sedikit lebih besar dari inti gelapnya
    // bukaan mata: telusuri bagian putih/iris ke kiri-kanan & atas-bawah dari pusat iris
    const reach = (dx, dy) => {
      let s = 0, gap = 0;
      for (let k = 1; k < pr * 5; k++) {
        const x = Math.round(ir.cx + dx * k), y = Math.round(ir.cy + dy * k);
        if (x < 0 || y < 0 || x >= W || y >= H) break;
        if (light(x, y) || dark(x, y)) { s = k; gap = 0; } else if (++gap > pr * 0.35) break;
      }
      return Math.max(s, pr);
    };
    const left = reach(-1, 0), right = reach(1, 0), up = reach(0, -1), down = reach(0, 1);
    const cx = ir.cx + (right - left) / 2, cy = ir.cy + (down - up) / 2;
    const rx = (left + right) / 2, ry = Math.min((up + down) / 2, rx * 0.95);
    // warna kulit KELOPAK: di antara mata dan alis (pipi di bawah mata lebih merah karena blush)
    const sample = (yc) => {
      let sr = 0, sg = 0, sb = 0, sn = 0;
      for (let y = Math.round(yc) - 2; y <= yc + 2; y++) for (let x = Math.round(cx - rx * 0.35); x <= cx + rx * 0.35; x++) {
        if (y < 0 || y >= H) continue;
        const p = P(x, y);
        if (data[p + 3] < 250 || lum(p) < 140) continue; // lewati bulu mata/alis
        sr += data[p]; sg += data[p + 1]; sb += data[p + 2]; sn++;
      }
      return sn ? [sr / sn, sg / sn, sb / sn] : null;
    };
    const lidCol = sample(cy - ry * 1.45) || sample(cy - ry * 1.25) || sample(cy + ry * 1.6);
    const [sr, sg, sb, sn] = lidCol ? [...lidCol, 1] : [0, 0, 0, 0];
    return {
      cx: r1(cx), cy: r1(cy), rx: r1(rx), ry: r1(ry),
      px: r1(ir.cx), py: r1(ir.cy), pr: r1(pr),
      skin: sn ? [Math.round(sr), Math.round(sg), Math.round(sb)] : [228, 178, 158],
    };
  }).sort((a, b) => a.cx - b.cx);
}

module.exports = { detectEyes };
