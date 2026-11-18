/*
 * Membuat desain kartu ID (600×900, sudut membulat, transparan di luar kartu) untuk perusahaan
 * yang belum punya desain kartu asli: latar + aksen warna, nama, posisi, nama perusahaan,
 * potret 3D karakter (sama dengan kartu Tries).
 *
 * Pakai: node scripts/make-card.cjs <out.png> <latar> <aksen> <teks-gelap> "<perusahaan>"
 * Contoh: node scripts/make-card.cjs frames/raw/job2-card.png "#ffffff" "#7cc6ee" "#1f3b57" "Perusahaan 2"
 */
const sharp = require('sharp');

const [, , OUT, BG = '#ffffff', ACCENT = '#7cc6ee', INK = '#1f3b57', COMPANY = 'Company'] = process.argv;
const W = 600, H = 900, R = 42;
const PORTRAIT = 'frames/s3-stand-video/s3-stand-48.png';
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

(async () => {
  // potret: kepala & bahu karakter (40% atas badan), tengah di kepala
  const pm = await sharp(PORTRAIT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
  for (let y = 0; y < pm.info.height; y++) for (let x = 0; x < pm.info.width; x++) if (pm.data[(y * pm.info.width + x) * 4 + 3] > 40) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const ch = Math.round((y1 - y0) * 0.4);
  let sx = 0, n = 0;
  for (let y = y0; y < y0 + (y1 - y0) * 0.12; y++) for (let x = x0; x <= x1; x++) if (pm.data[(y * pm.info.width + x) * 4 + 3] > 40) { sx += x; n++; }
  const cw = Math.round(ch * 0.8), cx0 = Math.max(0, Math.round(sx / n - cw / 2));
  const ph = Math.round(H * 0.6);
  const bust = await sharp(PORTRAIT).extract({ left: cx0, top: y0, width: Math.min(cw, pm.info.width - cx0), height: ch })
    .resize({ height: ph }).png().toBuffer();
  const bm = await sharp(bust).metadata();

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="c"><rect width="${W}" height="${H}" rx="${R}"/></clipPath></defs>
    <g clip-path="url(#c)">
      <rect width="${W}" height="${H}" fill="${BG}"/>
      <rect width="${W}" height="${H * 0.2}" fill="${ACCENT}"/>
      <circle cx="${W / 2}" cy="${H * 0.055}" r="${W * 0.06}" fill="#2a2f36"/>
      <text x="${W * 0.07}" y="${H * 0.155}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.min(40, Math.floor((W * 0.86) / (COMPANY.length * 0.6)))}" font-weight="700" fill="#ffffff">${esc(COMPANY)}</text>
      <text x="${W * 0.07}" y="${H * 0.3}" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="600" fill="${INK}">Fairuz Atikah</text>
      <text x="${W * 0.07}" y="${H * 0.36}" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="${ACCENT}">UI/UX Designer</text>
      <rect x="${W * 0.52}" y="${H * 0.4}" width="${W * 0.44}" height="${H * 0.56}" rx="22" fill="${ACCENT}" opacity="0.25"/>
      <rect y="${H * 0.965}" width="${W}" height="${H * 0.035}" fill="${ACCENT}"/>
    </g>
  </svg>`;
  await sharp(Buffer.from(svg))
    .composite([{ input: bust, left: Math.round(W - bm.width - W * 0.02), top: Math.round(H * 0.965 - ph) }])
    .png().toFile(OUT);
  // potret jangan keluar dari sudut membulat: potong ulang dengan masker kartu
  const mask = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${R}" fill="#fff"/></svg>`);
  const buf = await sharp(OUT).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp(buf).toFile(OUT);
  console.log('→', OUT);
})();
