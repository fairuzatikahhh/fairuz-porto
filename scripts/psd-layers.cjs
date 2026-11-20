/*
 * Bongkar layer PSD (8-bit RGB, PSD v1) → PNG per layer + info JSON (nama, posisi, blend mode, opasitas).
 * Pakai: node scripts/psd-layers.cjs <file.psd> <folder-out>
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const [, , IN, OUT] = process.argv;
const b = fs.readFileSync(IN);
let p = 0;
const u8 = () => b[p++], u16 = () => { const v = b.readUInt16BE(p); p += 2; return v; }, i16 = () => { const v = b.readInt16BE(p); p += 2; return v; };
const u32 = () => { const v = b.readUInt32BE(p); p += 4; return v; }, i32 = () => { const v = b.readInt32BE(p); p += 4; return v; };
const str = (n) => { const s = b.toString('latin1', p, p + n); p += n; return s; };
if (str(4) !== '8BPS') throw 'not psd';
const ver = u16(); p += 6; const nch = u16(), H = u32(), W = u32(), depth = u16(), mode = u16();
console.log({ ver, nch, W, H, depth, mode });
{ const n = u32(); p += n; } { const n = u32(); p += n; } // color mode, resources
const lmEnd = u32() + p; const liLen = u32(); const liEnd = p + liLen;
let count = Math.abs(i16());
const layers = [];
for (let L = 0; L < count; L++) {
  const top = i32(), left = i32(), bottom = i32(), right = i32();
  const nc = u16(); const chans = []; for (let c = 0; c < nc; c++) chans.push({ id: i16(), len: u32() });
  str(4); const blend = str(4), opacity = u8(), clip = u8(), flags = u8(); p++;
  const exEnd = u32() + p;
  const maskLen = u32(); let mask = null;
  if (maskLen) { const s = p; mask = { top: i32(), left: i32(), bottom: i32(), right: i32(), def: u8(), flags: u8() }; p = s + maskLen; }
  { const n = u32(); p += n; } // blending ranges
  const nl = u8(); let name = str(nl); p += (3 - (nl % 4)) & 3; // pascal padded to 4 (incl length byte)
  let sect = null;
  while (p < exEnd) {
    str(4); const key = str(4); const len = u32(); const s = p;
    if (key === 'luni') { const n = u32(); name = Buffer.from(b.subarray(p, p + n * 2)).swap16().toString("utf16le"); }
    if (key === 'lsct' || key === 'lsdk') { sect = b.readUInt32BE(p); }
    p = s + len;
  }
  p = exEnd;
  layers.push({ name, top, left, bottom, right, chans, blend, opacity, clip, hidden: !!(flags & 2), sect, mask });
}
// channel data
for (const l of layers) {
  const w = l.right - l.left, h = l.bottom - l.top;
  l.data = {};
  for (const c of l.chans) {
    const s = p; const comp = u16();
    if (c.id === -2) { const mw = l.mask.right - l.mask.left, mh = l.mask.bottom - l.mask.top; l.data[c.id] = decode(comp, mw, mh); }
    else if (w > 0 && h > 0) l.data[c.id] = decode(comp, w, h);
    p = s + c.len;
  }
}
function decode(comp, w, h) {
  const out = Buffer.alloc(w * h);
  if (comp === 0) { b.copy(out, 0, p, p + w * h); return out; }
  if (comp !== 1) { console.warn('compression', comp); return out; }
  const counts = []; for (let y = 0; y < h; y++) counts.push(u16());
  let o = 0;
  for (let y = 0; y < h; y++) {
    const end = p + counts[y];
    while (p < end) {
      const n = b.readInt8(p++);
      if (n >= 0) { b.copy(out, o, p, p + n + 1); p += n + 1; o += n + 1; }
      else if (n !== -128) { out.fill(b[p++], o, o + 1 - n); o += 1 - n; }
    }
  }
  return out;
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const info = [];
  for (let i = 0; i < layers.length; i++) {
    const l = layers[i]; const w = l.right - l.left, h = l.bottom - l.top;
    const rec = { i, name: l.name, blend: l.blend, opacity: l.opacity, clip: l.clip, hidden: l.hidden, sect: l.sect, top: l.top, left: l.left, w, h, mask: l.mask ? { ...l.mask } : null };
    if (w > 0 && h > 0 && l.data[0]) {
      const raw = Buffer.alloc(w * h * 4);
      for (let k = 0; k < w * h; k++) {
        raw[k * 4] = l.data[0][k]; raw[k * 4 + 1] = (l.data[1] || l.data[0])[k]; raw[k * 4 + 2] = (l.data[2] || l.data[0])[k];
        raw[k * 4 + 3] = l.data[-1] ? l.data[-1][k] : 255;
      }
      rec.file = `${String(i).padStart(2, '0')}.png`;
      await sharp(raw, { raw: { width: w, height: h, channels: 4 } }).png().toFile(path.join(OUT, rec.file));
    }
    if (l.data[-2] && l.data[-2].length) { const m = l.mask; rec.maskFile = `${String(i).padStart(2, '0')}-mask.png`; await sharp(l.data[-2], { raw: { width: m.right - m.left, height: m.bottom - m.top, channels: 1 } }).png().toFile(path.join(OUT, rec.maskFile)); }
    info.push(rec);
  }
  fs.writeFileSync(path.join(OUT, 'layers.json'), JSON.stringify(info, null, 1));
  for (const r of info) console.log(r.i, JSON.stringify(r.name), r.blend, r.opacity, 'clip' + r.clip, r.hidden ? 'HIDDEN' : '', r.sect ?? '', r.w + 'x' + r.h, '@' + r.left + ',' + r.top, r.maskFile ? 'mask' : '');
})();
