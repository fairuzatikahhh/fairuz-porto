import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from './Hero';
import { FRAMES, type Eye, type Frame } from './frames';
import { SLIDE_PATH, TRACK_SIZE } from './slidePath';
import { THEME } from '../config';

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════════════════════════
   PARALLAX HERO
   bust → zoom-out (seluruh badan, melambai) → menoleh → berjalan ke sisi kanan
   → menunduk, perosotan muncul, duduk → meluncur ke bawah (kamera ikut turun) → berdiri.
   ════════════════════════════════════════════════════════════════════════════ */

/* ─── PENGATURAN (semua angka yang mungkin ingin kamu ubah ada di sini) ─── */
const MIN_WIDTH = 900;          // di bawah lebar ini animasi dimatikan (hanya Hero)
const SCROLL_LENGTH = '+=1335%'; // total panjang scroll untuk seluruh cerita
const SCRUB = 0.35;             // kehalusan scrub (detik); inersia utama sudah dari Lenis (src/smoothScroll.ts)

// Timeline dalam "unit waktu"; total = T.total. Ubah angka untuk mempercepat/memperlambat tiap fase.
const T = {
  zoom: [0.0, 2.0],      // zoom-out: bust ikut mengecil, berganti ke seluruh badan
  bustOut: [0.04, 0.45], // bust memudar di atas pose seluruh badan (mata tetap sejajar)
  wave: [1.6, 3.0],      // melambai
  textMove: [2.9, 4.0],  // nama naik ke tengah-kiri, deskripsi pindah ke bawah nama
  turn: [2.9, 3.45],     // berputar ke kanan, langsung lanjut jalan
  walk: [3.45, 6.5],     // berjalan ke sisi kanan
  turnBack: [6.5, 7.6],  // berhenti, menoleh kembali sampai menghadap depan
  textOut: [7.7, 8.3],   // nama & deskripsi menghilang
  sit: [7.7, 9.3],       // menunduk melihat ke bawah, lalu duduk di perosotan
  trackIn: [7.9, 8.8],   // perosotan muncul di bawahnya
  slide: [9.4, 12.6],    // meluncur dari atas ke ujung bawah
  rise: [12.8, 14.4],    // sampai di ujung, berdiri & menyapa
  trackOut: [14.0, 14.8], // perosotan menghilang
  intro: [14.6, 16.0],   // teks perkenalan muncul satu per satu (setelah perosotan hilang)
  open: [16.6, 18.0],    // di posisinya, mengeluarkan & membuka payung
  float: [18.0, 20.7],   // melayang turun dari posisinya ke tengah section riwayat pekerjaan
  introOut: [18.0, 19.3], // kamera turun: teks perkenalan naik keluar layar
  land: [20.4, 20.95],   // mendarat: payung memudar, sudah memakai lanyard Tries (sementara, sebelum ada video)
  approach: [20.95, 22.4], // berjalan maju mendekat, lalu berhenti berdiri tegak
  work: [22.2, 23.1],    // teks riwayat pekerjaan & titik carousel muncul (setelah ukurannya penuh)
  total: 23.4,
} as const;

// Ukuran & posisi dalam fraksi layar (W = lebar, H = tinggi)
const LAYOUT = {
  charHeight: 0.83,                 // tinggi karakter setelah zoom-out (× tinggi layar), kepala hampir menyentuh navbar
  standStart: { x: 0.5, y: 0.97 },  // kepala (x) & sol sepatu (y) setelah zoom-out
  walkEnd: { x: 0.82, y: 0.97 },    // titik berhenti setelah berjalan ke kanan
  walkCycle: 0.7,                   // jarak 1 siklus jalan (2 langkah) × tinggi karakter
  textTop: 0.36,                    // posisi atas nama setelah pindah (× tinggi layar)
  textGap: 0.03,                    // jarak nama → deskripsi (× tinggi layar)
};

// Perosotan (public/assets/slide-track.webp + jalur tengahnya di ./slidePath)
// Karakter tetap sebesar saat berdiri. Ia mulai duduk di bagian atas perosotan yang curam
// (di kanan, tempat ia berhenti berjalan); kamera ikut turun mengikutinya, dan di akhir tampak
// seluruh perosotan: ujung bawah di kiri-bawah, naik keluar layar di kanan-atas.
const SLIDE = {
  trackWidth: 1.5,   // lebar gambar perosotan × lebar layar (diperbesar otomatis di layar yang tinggi)
  edge: 0.03,        // tepi kiri karakter & kanan teks perkenalan di akhir = padding navbar (× lebar layar)
  startU: 76,        // titik jalur tempat ia mulai duduk (indeks 0–104; makin besar makin ke atas/curam)
  fadeAbove: 90,     // bagian atas gambar perosotan memudar, sudah penuh mulai px ini di atas titik duduk awal
  endU: 5,           // titik jalur tempat berhenti (indeks; 0 = bibir ujung)
  loops: 3,          // berapa kali siklus frame meluncur (syal berkibar) diputar
  tilt: 0.6,         // seberapa banyak badan ikut miring mengikuti kemiringan jalur (0–1)
  poseAngle: -22,    // kemiringan jalur yang cocok dengan pose meluncur apa adanya (derajat)
};
const SEAT = [1180, 1240]; // titik duduk (pantat) di frame duduk/meluncur (px frame)
// tengah badan (x) & sol sepatu (y) di frame, untuk menyambung pose antar grup di posisi badan yang sama
const BODY = { rise: [862.5, 1637], float: [979, 1899], open: [982, 1899], work: [648.5, 2091] } as const;
const RISE_LEFT = 605;     // tepi kiri badan di frame berdiri terakhir (rise-48, px frame)

// Section riwayat pekerjaan: karakter di tengah, teks di kiri & kanan → karakter lebih kecil
const WORK = {
  charHeight: 0.62, // tinggi badan (× tinggi layar); payung menambah ±13% di atas kepala
  feetY: 0.86,      // posisi sol sepatu setelah mendarat (× tinggi layar); di bawahnya titik carousel
  startY: -0.08,    // posisi sol sepatu saat mulai muncul dari atas layar
  finalFeetY: 0.915, // sol sepatu setelah berjalan maju (sedikit di atas lantai → titik carousel di bawahnya)
};

// Karakter "hidup" saat diam di section pekerjaan (berdasarkan waktu, tetap jalan tanpa scroll)
const IDLE = {
  breath: 0.007,   // seberapa besar badan merenggang saat menarik napas (× tinggi)
  breathSec: 3.6,  // durasi satu tarikan + hembusan napas (detik)
  sway: 0.25,      // goyangan badan kiri-kanan (derajat)
  swaySec: 5.3,
};

// video jalan maju (dipotong saat ia berhenti tegak, tangan di samping): tinggi badan di frame
// terakhir ÷ frame pertama (public/assets/frames/fwd-48 / fwd-01: 1381 / 1001)
const FWD_GROW = 1.38;
const FWD_WALK_END = 0.9; // bagian yang berisi langkah kaki (sisanya sudah berdiri diam)
const STILL_FROM = 0.92;  // mulai titik ini frame video memudar ke pose diam (gambar tajam)

// Riwayat pekerjaan (urut terbaru). Satu titik carousel per perusahaan; data lain menyusul.
// Satu entri = satu titik carousel (urut terbaru; sumber: fairuzatikah.com, bagian "My Journey").
// `look`: karakter untuk perusahaan itu: 'tries' (lanyard hitam), 'genah' (lanyard biru langit),
// 'plain' (tanpa lanyard).
const JOBS = [
  {
    company: 'Tries Digital Indonesia',
    role: 'UI/UX Designer',
    period: '2025 – Now',
    desc: 'I am designing and improving interface flows for digital products, focused on making user journeys clearer and easier.',
    look: 'tries',
  },
  {
    company: 'Tercode Indonesia',
    role: 'UI/UX Designer',
    period: '2024 – 2025',
    desc: 'I built interface layouts and design systems for web products, and improved consistency across multiple screens.',
    look: 'plain', // tanpa lanyard
  },
  {
    company: 'Gawe Becik Nadhah Anugrah',
    role: 'UI/UX Designer',
    period: '2023 – 2024',
    desc: 'I designed internal systems (CMS/HRIS) with complex user flows, and simplified their structure to reduce user confusion.',
    look: 'genah', // lanyard biru langit & kartu putih
  },
  {
    company: 'Telkom Indonesia',
    role: 'UI/UX Designer Intern',
    period: '2023',
    desc: 'I assisted in designing UI components and layouts, and learned real-world product design workflows and collaboration.',
    look: 'plain', // tanpa lanyard
  },
];
// pindah perusahaan: karakter jalan keluar ke kanan, karakter berikutnya masuk dari kiri, teks berganti
// (sementara memakai frame jalan dari hero — tanpa lanyard — sampai ada video jalan menyamping berlanyard)
const SWITCH = {
  sec: 3.6,      // durasi seluruh perpindahan (detik)
  dist: 0.62,    // jarak jalan keluar / masuk (× lebar layar)
  backEnd: 16,   // SEQ.back[0..16]: berbalik sampai hampir menghadap depan, tangan masih di bawah
};

// Teks perkenalan (muncul di kanan setelah perosotan hilang)
const INTRO = {
  title: 'I design digital experiences that feel clear, useful, and human.',
  body: [
    "Hi, I'm Faiz — a UI/UX Designer who enjoys simplifying complex ideas into clear, usable experiences.",
    'I started by questioning why some apps feel confusing, and that curiosity led me into design. Since then, I\'ve been focusing on improving user flows, especially in dashboards, CMS, and systems with complex structures.',
    "For me, good design isn't just about visuals — it's about helping users move faster, think less, and avoid frustration.",
  ],
};

// Mata hidup: kilau di iris + kedip otomatis (berdasarkan waktu, tetap jalan saat scroll berhenti)
const EYES = {
  blinkEvery: [2.2, 4.8] as const, // jeda acak antar kedip (detik)
  blinkClose: 0.07,                // durasi menutup (detik)
  blinkHold: 0.05,                 // tertutup penuh
  blinkOpen: 0.11,                 // membuka kembali
  doubleChance: 0.2,               // peluang kedip dua kali
  sparkle: 0.9,                    // kekuatan kilau mata (0 = mati)
  irisGlow: 0.6,                   // cincin karamel di iris supaya tatapan tidak kosong (0 = mati); serasi dengan iris bust
};

/* ─── DATA POSE (ukuran px aset; jangan diubah kecuali asetnya diganti) ─── */
const BUST = { w: 1790, h: 2400, eye: [903, 768], eyeDist: 406 }; // base.png
// titik tengah kedua pupil & jaraknya di pose berdiri (frames/s1-stand: gambar Gemini) — dipakai
// menyejajarkan bust dengan pose badan penuh saat zoom-out
const STAND_EYE = { eye: [649.7, 270.1], eyeDist: 177.5 };

/* Urutan frame. Data & anchor (kepala, sol sepatu) dari ./frames (dibuat otomatis). */
const [S] = FRAMES.stand;
const FULL = [...FRAMES.full] as Frame[];
// Potongan video utuh (frames/s2-full-video): indeks frame di FULL
const FULL_CUT = {
  turn: [12, 33],   // langsung berputar ke kanan (0–11 masih menghadap depan & berkedip → dilewati); 27–33 berdiri menyamping, kaki rapat
  intro: [34, 47],  // langkah pertama (posisi baru bergeser di sini → tidak 'meluncur' sebelum melangkah)
  loop: [48, 76],   // satu siklus jalan (diulang sesuai jarak)
  outro: [77, 90],  // langkah terakhir (fasenya sama dengan awal loop → sambung mulus)
  back: [91, 129],  // berhenti, berbalik ke depan, mengangkat tangan lagi
} as const;
const cut = ([a, b]: readonly [number, number]) => FULL.slice(a, b + 1);
const SEQ = {
  // (frame melambai lama dibuat untuk pose berdiri lama → tidak dipakai; pose baru sudah menyapa)
  wave: [S] as Frame[],
  turn: cut(FULL_CUT.turn),
  intro: cut(FULL_CUT.intro),
  loop: cut(FULL_CUT.loop),
  outro: cut(FULL_CUT.outro),
  back: cut(FULL_CUT.back),
  sit: [...FRAMES.sit] as Frame[],     // menunduk → duduk (berakhir di pose meluncur)
  slide: [...FRAMES.slide] as Frame[], // siklus meluncur (diulang)
  rise: [...FRAMES.rise] as Frame[],   // meluncur sampai ujung → berdiri → menyapa
  float: [...FRAMES.float] as Frame[], // melayang turun dengan payung (diputar sekali sepanjang turun)
  // mengeluarkan & membuka payung (video menyusul; selama belum ada → pose berdiri memudar ke pose berpayung)
  open: [...(((FRAMES as unknown) as Record<string, readonly Frame[]>).open ?? [])] as Frame[],
  work: [...FRAMES.work] as Frame[],   // berdiri dengan lanyard Tries (gambar diam; cadangan)
  fwd: [...FRAMES.fwd] as Frame[],     // berjalan maju mendekat dengan lanyard (membesar alami)
  tries: [...FRAMES.tries] as Frame[], // pose diam Tries (lanyard hitam) — gambar Gemini
  genah: [...FRAMES.genah] as Frame[], // pose diam Genah (gambar yang sama, lanyard biru langit)
  plain: [...FRAMES.plain] as Frame[], // pose akhir tanpa lanyard (Tercode, Telkom) — gambar Gemini
};
const pickK = (seq: Frame[], k: number) => seq[Math.min(seq.length - 1, Math.max(0, Math.round(clamp01(k) * (seq.length - 1))))];

/* ─── util ─── */
// frame + opacity (+ geser x, y px layar) (+ pengali skala lapisan ini)
type Layer = [Frame, number] | [Frame, number, number, number] | [Frame, number, number, number, number];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const E = {
  out3: gsap.parseEase('power3.out'),
  out2: gsap.parseEase('power2.out'),
  in2: gsap.parseEase('power2.in'),
  inOut2: gsap.parseEase('power2.inOut'),
  inOutSine: gsap.parseEase('sine.inOut'),
};
const seg = (t: number, [a, b]: readonly [number, number] | readonly number[], e = (x: number) => x) =>
  e(clamp01((t - a) / (b - a)));

// ── jalur perosotan ──
// sudut dihaluskan (ujung bibir agak bergerigi) supaya badan tidak bergoyang patah-patah
const PATH_ANGLE = SLIDE_PATH.angle.map((_, i, a) => {
  let sum = 0, n = 0;
  for (let j = Math.max(0, i - 4); j <= Math.min(a.length - 1, i + 4); j++) { sum += a[j]; n++; }
  return ((sum / n) * Math.PI) / 180;
});
// titik di jalur pada indeks pecahan u (0 = bibir bawah-kiri), dalam pecahan ukuran gambar
function pathAt(u: number) {
  const n = SLIDE_PATH.x.length;
  const c = Math.min(n - 1.001, Math.max(0, u));
  const i = Math.floor(c), f = c - i;
  const at = (a: readonly number[]) => a[i] + (a[i + 1] - a[i]) * f;
  return { x: at(SLIDE_PATH.x), y: at(SLIDE_PATH.y), angle: at(PATH_ANGLE), len: at(SLIDE_PATH.len) };
}
// indeks pecahan tempat nilai `key` jalur pertama kali mencapai v (key naik: x, len; turun: y)
function pathFind(key: 'x' | 'y' | 'len', v: number) {
  const a = SLIDE_PATH[key];
  const up = key !== 'y';
  for (let i = 0; i < a.length - 1; i++) {
    if (up ? a[i + 1] >= v : a[i + 1] <= v) return i + (v - a[i]) / (a[i + 1] - a[i] || 1);
  }
  return a.length - 1;
}

// untuk gerakan dengan sedikit pose (menoleh): pose berikutnya membaur TERUS-MENERUS
// sepanjang langkah (tidak ditahan dulu lalu berganti cepat) → terasa seperti satu gerakan
function blendSoft(seq: Frame[], k: number): Layer[] {
  const p = clamp01(k) * (seq.length - 1);
  const i = Math.min(seq.length - 2, Math.floor(p));
  const r = clamp01(p - i);
  const f = r * r * (3 - 2 * r);
  return f < 0.02 ? [[seq[i], 1]] : f > 0.98 ? [[seq[i + 1], 1]] : [[seq[i], 1], [seq[i + 1], f]];
}

interface Layout {
  W: number;
  H: number;
  bustEye: { x: number; y: number }; // posisi mata bust di layar (tanpa animasi)
  bustOrigin: string;                // titik mata dalam koordinat elemen bust
  sMatch: number;                    // skala pose badan agar mata = bust
  sA: number;                        // skala setelah zoom-out
  A: { x: number; y: number };
  E: { x: number; y: number };
  name: { dy: number };
  desc: { dx: number; dy: number };
}

function computeLayout(stage: HTMLElement): Layout {
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const sr = stage.getBoundingClientRect();

  // bust: diukur dari pembungkus luar (tidak terpengaruh animasi intro / zoom)
  const charEl = stage.querySelector<HTMLElement>('[data-reveal="character"]');
  const box = (charEl?.parentElement ?? charEl)?.getBoundingClientRect();
  const bw = box?.width ?? W * 0.4;
  const bh = box?.height ?? (bw * BUST.h) / BUST.w;
  const bl = (box?.left ?? sr.left + W / 2 - bw / 2) - sr.left;
  const bt = (box?.top ?? sr.bottom - bh) - sr.top;
  const ex = (BUST.eye[0] / BUST.w) * bw;
  const ey = (BUST.eye[1] / BUST.h) * bh;

  // teks hero: posisi asli (offset* tidak terpengaruh transform) → target di kiri
  const nameEl = stage.querySelector<HTMLElement>('[data-hero="name"]');
  const descEl = stage.querySelector<HTMLElement>('[data-hero="desc"]');
  const nameTop = LAYOUT.textTop * H;

  return {
    W,
    H,
    bustEye: { x: bl + ex, y: bt + ey },
    bustOrigin: `${ex}px ${ey}px`,
    sMatch: (bw / BUST.w) * (BUST.eyeDist / STAND_EYE.eyeDist),
    sA: (LAYOUT.charHeight * H) / S.h,
    A: { x: LAYOUT.standStart.x * W, y: LAYOUT.standStart.y * H },
    E: { x: LAYOUT.walkEnd.x * W, y: LAYOUT.walkEnd.y * H },
    name: { dy: nameEl ? nameTop - nameEl.offsetTop : 0 },
    desc: {
      dx: nameEl && descEl ? nameEl.offsetLeft - descEl.offsetLeft : 0,
      dy: nameEl && descEl ? nameTop + nameEl.offsetHeight + LAYOUT.textGap * H - descEl.offsetTop : 0,
    },
  };
}

// Geometri perosotan. Koordinat "dunia" = layar di akhir (kamera di 0). Saat mulai duduk, kamera
// bergeser cam0 sehingga titik duduk jatuh tepat di posisi karakter setelah berjalan.
interface SlideGeo {
  off: { x: number; y: number };   // titik duduk − anchor (px)
  sigma: number;                   // skala gambar perosotan
  O: { x: number; y: number };     // pojok kiri-atas gambar perosotan (dunia)
  uP: number; uE: number;          // indeks jalur: titik duduk awal → titik berhenti
  cam0: { x: number; y: number };  // geseran kamera saat mulai duduk
}
function computeSlide(L: Layout): SlideGeo {
  const f = FRAMES.sit[0];
  const k = L.sA * (S.ch / f.ch);
  const off = { x: (SEAT[0] - f.anchor[0]) * k, y: (SEAT[1] - f.anchor[1]) * k };
  const seat0 = { x: L.E.x + off.x, y: L.E.y + off.y }; // titik duduk di layar setelah berjalan
  const uE = SLIDE.endU;
  const pE = pathAt(uE);
  const sigma = (SLIDE.trackWidth * L.W) / TRACK_SIZE.w;
  const tw = sigma * TRACK_SIZE.w, th = sigma * TRACK_SIZE.h;
  // di akhir: tepi kiri badannya lurus dengan logo navbar (SLIDE.edge), sol sepatu di tinggi yang
  // sama seperti sebelumnya; perosotan diletakkan mengikuti titik itu
  const standX = SLIDE.edge * L.W + (f.anchor[0] - RISE_LEFT) * k;
  const O = { x: standX + off.x - pE.x * tw, y: seat0.y - pE.y * th };
  const uP = SLIDE.startU;
  const pP = pathAt(uP);
  return {
    off, sigma, O, uP, uE,
    cam0: { x: O.x + pP.x * tw - seat0.x, y: O.y + pP.y * th - seat0.y },
  };
}

// Masker CSS: bagian atas gambar perosotan memudar ke atas sampai sedikit di atas titik duduk awal,
// jadi perosotan seolah dimulai di bawahnya & potongan tepi atas gambar tidak pernah terlihat.
function trackMask() {
  const top = pathAt(SLIDE.startU).y * TRACK_SIZE.h - SLIDE.fadeAbove; // px dari atas gambar
  return `linear-gradient(to bottom, transparent 0px, #000 ${Math.max(1, top).toFixed(0)}px)`;
}
const TRACK_MASK = trackMask();

export default function SlideStory() {
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const mm = gsap.matchMedia();
    mm.add(
      `(min-width: ${MIN_WIDTH}px) and (prefers-reduced-motion: no-preference)`,
      () => {
        const q = <T extends HTMLElement>(s: string) => stage.querySelector<T>(s)!;

        const bustInner = q('[data-reveal="character"]');           // diskalakan (zoom)
        const bustWrap = bustInner.parentElement as HTMLElement;      // dipudarkan
        const heroName = q('[data-hero="name"]');
        const heroDesc = q('[data-hero="desc"]');
        const track = q<HTMLImageElement>('[data-story="track"]');
        const introItems = Array.from(stage.querySelectorAll<HTMLElement>('[data-intro]'));
        const workItems = Array.from(stage.querySelectorAll<HTMLElement>('[data-work]'));
        const jobCos = Array.from(stage.querySelectorAll<HTMLElement>('[data-job-co]'));
        const jobDescs = Array.from(stage.querySelectorAll<HTMLElement>('[data-job-desc]'));
        const jobDots = Array.from(stage.querySelectorAll<HTMLButtonElement>('[data-job-dot]'));
        // carousel perusahaan (berdasarkan waktu, tidak ikut scroll): jobFrom → jobTo mulai jobT0
        let jobFrom = 0, jobTo = 0, jobT0 = -1;
        const jobProgress = () => {
          if (jobT0 < 0) return 1;
          const p = clamp01((performance.now() - jobT0) / 1000 / SWITCH.sec);
          if (p >= 1) jobT0 = -1;
          return p;
        };
        const paintDots = (i: number) => jobDots.forEach((d, k) => {
          d.style.width = k === i ? '28px' : '10px';
          d.style.background = k === i ? THEME.logoCoral : 'rgba(33,33,33,0.22)';
        });
        const goToJob = (i: number) => {
          if (i === jobTo) return;
          jobFrom = jobTo; jobTo = i; jobT0 = performance.now();
          paintDots(i);
          ensureIdle();
        };
        const setJob = (i: number) => { jobFrom = jobTo = i; jobT0 = -1; paintDots(i); }; // langsung, tanpa animasi
        const dotHandlers = jobDots.map((d, i) => { const h = () => goToJob(i); d.addEventListener('click', h); return h; });
        const ctaEl = stage.querySelector<HTMLElement>('[data-work="cta"]')!;

        // geser horizontal untuk pindah perusahaan: swipe trackpad / roda horizontal, drag mouse,
        // geser jari, atau tombol panah kiri-kanan — hanya saat section pekerjaan sudah tampil
        const inWork = () => proxy.p * T.total >= T.work[1] - 0.1;
        const step = (dir: number) => {
          if (!inWork() || jobT0 >= 0) return; // tunggu perpindahan sebelumnya selesai
          const i = Math.min(JOBS.length - 1, Math.max(0, jobTo + dir));
          goToJob(i);
        };
        let wheelX = 0, wheelT = 0;
        const onWheel = (e: WheelEvent) => {
          if (!inWork() || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // gulir vertikal tetap normal
          e.preventDefault();
          const now = performance.now();
          if (now - wheelT > 400) wheelX = 0; // gerakan baru
          wheelT = now;
          wheelX += e.deltaX;
          if (Math.abs(wheelX) > 60) { step(Math.sign(wheelX)); wheelX = -1e6 * Math.sign(wheelX); } // satu swipe = satu langkah
        };
        let downX = 0, downY = 0, dragging = false;
        const onDown = (e: PointerEvent) => {
          if (!inWork() || (e.target as HTMLElement).closest('a, button')) return;
          dragging = true; downX = e.clientX; downY = e.clientY;
        };
        const onUp = (e: PointerEvent) => {
          if (!dragging) return;
          dragging = false;
          const dx = e.clientX - downX, dy = e.clientY - downY;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1); // geser ke kiri = berikutnya
        };
        const onKey = (e: KeyboardEvent) => {
          if (!inWork()) return;
          if (e.key === 'ArrowRight') step(1);
          else if (e.key === 'ArrowLeft') step(-1);
        };
        stage.addEventListener('wheel', onWheel, { passive: false });
        stage.addEventListener('pointerdown', onDown);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('keydown', onKey);

        // ── Canvas karakter (frame sequence) ──
        const canvas = q<HTMLCanvasElement>('[data-story="char"]');
        const ctx = canvas.getContext('2d')!;
        const images = new Map<string, HTMLImageElement>();
        let lastKey = '';
        const imgOf = (f: Frame) => {
          let im = images.get(f.src);
          if (!im) {
            im = new Image();
            im.src = f.src;
            im.decode().then(() => { lastKey = ''; render(proxy.p); }).catch(() => {});
            images.set(f.src, im);
          }
          return im;
        };
        Object.values(SEQ).flat().forEach(imgOf);

        let L = computeLayout(stage);
        let G = computeSlide(L);
        let dpr = 1;
        const sizeCanvas = () => {
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.round(L.W * dpr);
          canvas.height = Math.round(L.H * dpr);
          canvas.style.width = `${L.W}px`;
          canvas.style.height = `${L.H}px`;
          lastKey = '';
        };
        sizeCanvas();

        // ── Mata: kilau & kelopak (digambar dalam koordinat frame, di atas gambar frame) ──
        // iris "hidup": cincin karamel di sekeliling pupil (lebih terang di bawah) → pupil terlihat
        // lebih kecil & tatapan tidak kosong. Dibatasi ke bukaan mata supaya kelopak tidak ikut.
        const drawIris = (e: Eye) => {
          if (EYES.irisGlow <= 0) return;
          const r = e.pr;
          const ring = (a: number) => {
            const g = ctx.createRadialGradient(e.px, e.py, 0, e.px, e.py, r);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(0.44, 'rgba(0,0,0,0)');
            g.addColorStop(0.6, `rgba(196,128,70,${a})`);
            g.addColorStop(0.86, `rgba(176,108,56,${a * 0.6})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(e.px, e.py, r, 0, Math.PI * 2);
            ctx.fill();
          };
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(e.cx, e.cy, e.rx, e.ry, 0, 0, Math.PI * 2);
          ctx.clip();
          ctx.globalCompositeOperation = 'screen';
          ring(0.3 * EYES.irisGlow);
          ctx.beginPath();
          ctx.rect(e.px - r, e.py, r * 2, r); // separuh bawah lebih terang (pantulan cahaya)
          ctx.clip();
          ring(0.28 * EYES.irisGlow);
          ctx.restore();
        };
        const drawSparkle = (e: Eye, side: boolean) => {
          if (EYES.sparkle <= 0) return;
          // pose menyamping (hanya 1 mata terlihat): kilau lebih ke tengah iris supaya tidak jatuh di tepi kelopak
          const r = e.pr * (side ? 0.8 : 1.12);
          const ox = side ? 0.12 : 0.32, oy = side ? 0.2 : 0.34;
          const sx = e.px + r * ox, sy = e.py - r * oy;
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.3);
          glow.addColorStop(0, `rgba(255,255,255,${0.95 * EYES.sparkle})`);
          glow.addColorStop(0.55, `rgba(255,255,255,${0.75 * EYES.sparkle})`);
          glow.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
          if (side) return;
          ctx.fillStyle = `rgba(255,255,255,${0.55 * EYES.sparkle})`;
          ctx.beginPath();
          ctx.arc(e.px - r * 0.28, e.py + r * 0.3, r * 0.1, 0, Math.PI * 2);
          ctx.fill();
        };
        // c: 0 = terbuka, 1 = tertutup penuh. Kelopak atas turun menutup bukaan mata.
        const drawLid = (e: Eye, c: number) => {
          if (c <= 0.01) return;
          const rx = e.rx * 1.18, ry = e.ry * 1.14; // sedikit lebih besar dari bukaan; tepinya memudar
          const top = e.cy - ry, lidY = top + c * ry * 2;
          const [r, g, b] = e.skin;
          ctx.save();
          ctx.beginPath();
          ctx.rect(e.cx - rx, top, rx * 2, lidY - top); // kelopak turun sampai lidY
          ctx.clip();
          ctx.translate(e.cx, e.cy);
          ctx.scale(1, ry / rx);
          // kelopak cembung: tengah sedikit terang, pinggir sedikit gelap lalu memudar ke kulit asli
          const grad = ctx.createRadialGradient(0, -rx * 0.2, 0, 0, 0, rx);
          grad.addColorStop(0, `rgba(${Math.min(255, Math.round(r * 1.02))},${Math.min(255, Math.round(g * 1.02))},${Math.min(255, Math.round(b * 1.02))},1)`);
          grad.addColorStop(0.7, `rgba(${r},${g},${b},1)`);
          grad.addColorStop(0.86, `rgba(${Math.round(r * 0.96)},${Math.round(g * 0.93)},${Math.round(b * 0.93)},0.85)`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, rx, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          const ryO = e.ry * 1.06; // garis bulu mata mengikuti bukaan mata asli
          const lidO = e.cy - ryO + c * ryO * 2;
          // garis bulu mata di tepi kelopak (melengkung ke bawah saat tertutup)
          if (c > 0.2) {
            ctx.strokeStyle = `rgba(52,32,28,${Math.min(1, (c - 0.2) * 1.6)})`;
            ctx.lineWidth = Math.max(1, e.ry * 0.2);
            ctx.lineCap = 'round';
            ctx.beginPath();
            const ly = lidO - ryO * 0.18; // sedikit di atas tepi bawah bukaan
            ctx.moveTo(e.cx - e.rx * 1.02, ly - ryO * 0.18);
            ctx.quadraticCurveTo(e.cx, ly + ryO * 0.2 * c, e.cx + e.rx * 1.02, ly - ryO * 0.18);
            ctx.stroke();
          }
        };

        // gambar lapisan frame: anchor frame (kepala, sol sepatu) diletakkan di (x, y)
        // rot (radian) = putaran di sekitar titik pivot (mis. titik duduk saat meluncur)
        const draw = (layers: Layer[], x: number, y: number, scale: number, alpha: number, rot = 0, pivot = { x, y }, breath = 1) => {
          const lid = blinkAmount();
          const key =
            alpha > 0
              ? layers.map(([f, a, dx = 0, dy = 0, ks = 1]) => `${f.src}:${a.toFixed(3)}:${dx.toFixed(1)}:${dy.toFixed(1)}:${ks.toFixed(4)}`).join('+') +
                `|${x.toFixed(1)}|${y.toFixed(1)}|${scale.toFixed(4)}|${alpha.toFixed(3)}|${lid.toFixed(2)}|${rot.toFixed(4)}|${breath.toFixed(4)}`
              : 'none';
          if (key === lastKey) return;
          lastKey = key;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (alpha <= 0) return;
          ctx.imageSmoothingQuality = 'high';
          for (const [f, a, dx = 0, dy = 0, ks = 1] of layers) {
            const im = imgOf(f);
            if (!im.complete || !im.naturalWidth) { lastKey = ''; continue; } // belum siap → coba lagi nanti
            ctx.globalAlpha = Math.min(1, alpha * a);
            // resolusi tiap grup beda (mis. frame video lebih kecil) → samakan lewat tinggi karakter
            const k = scale * ks * (S.ch / f.ch);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (rot || breath !== 1) {
              ctx.translate(pivot.x, pivot.y);
              ctx.rotate(rot);
              ctx.scale(1, breath); // napas: badan sedikit merenggang ke atas dari kaki
              ctx.translate(-pivot.x, -pivot.y);
            }
            ctx.translate(x + dx - f.anchor[0] * k, y + dy - f.anchor[1] * k);
            ctx.scale(k, k);
            ctx.drawImage(im, 0, 0);
            for (const e of f.eyes) {
              drawIris(e);
              drawSparkle(e, f.eyes.length === 1);
              drawLid(e, lid);
            }
          }
          ctx.globalAlpha = 1;
        };

        // ── Kedip otomatis (berbasis waktu) ──
        let blinkStart = -1;
        let blinkTimer = 0;
        let raf = 0;
        const blinkLen = EYES.blinkClose + EYES.blinkHold + EYES.blinkOpen;
        function blinkAmount() {
          if (blinkStart < 0) return 0;
          const e = (performance.now() - blinkStart) / 1000;
          if (e < EYES.blinkClose) return e / EYES.blinkClose;
          if (e < EYES.blinkClose + EYES.blinkHold) return 1;
          if (e < blinkLen) return 1 - (e - EYES.blinkClose - EYES.blinkHold) / EYES.blinkOpen;
          return 0;
        }
        // kedip menggambar ulang dari posisi scroll SAAT INI (bukan argumen lama yang mungkin basi
        // setelah refresh/resize → dulu bisa membuat karakter "hilang" sampai di-scroll lagi)
        const animateBlink = () => {
          render(proxy.p);
          if ((performance.now() - blinkStart) / 1000 < blinkLen) raf = requestAnimationFrame(animateBlink);
          else { blinkStart = -1; render(proxy.p); }
        };
        const scheduleBlink = (soon = false) => {
          const [a, b] = EYES.blinkEvery;
          const wait = soon ? 0.18 : a + Math.random() * (b - a);
          blinkTimer = window.setTimeout(() => {
            blinkStart = performance.now();
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(animateBlink);
            scheduleBlink(!soon && Math.random() < EYES.doubleChance);
          }, (wait + (soon ? blinkLen : 0)) * 1000);
        };
        scheduleBlink();

        // napas & goyangan berjalan terus selama karakter diam di section pekerjaan
        let idleRaf = 0;
        const idleTick = () => {
          idleRaf = 0;
          render(proxy.p); // render memanggil ensureIdle lagi selama masih di section itu
        };
        function ensureIdle() {
          if (!idleRaf) idleRaf = requestAnimationFrame(idleTick);
        }

        let touched = false;
        const render = (p: number) => {
          const t = p * T.total;

          // ── Zoom-out: pose badan & bust bergerak bersama (mata tetap sejajar) ──
          // cepat di awal → pose besar tidak sempat "diam" terlihat, lalu melambat
          const kZoom = seg(t, T.zoom, E.out3);
          const s = L.sMatch * Math.pow(L.sA / L.sMatch, kZoom);
          const fx0 = L.bustEye.x - L.sMatch * (STAND_EYE.eye[0] - S.anchor[0]);
          const fy0 = L.bustEye.y - L.sMatch * (STAND_EYE.eye[1] - S.anchor[1]);
          let x = lerp(fx0, L.A.x, kZoom);
          const y = lerp(fy0, L.A.y, kZoom);
          // posisi mata pose badan saat ini → bust diskalakan di sekitar matanya ke titik yang sama
          const eyeX = x + s * (STAND_EYE.eye[0] - S.anchor[0]);
          const eyeY = y + s * (STAND_EYE.eye[1] - S.anchor[1]);
          const kBust = seg(t, T.bustOut);

          // ── Teks hero pindah ke kiri ──
          const kMove = seg(t, T.textMove, E.inOut2);

          if (t > 0 || touched) {
            touched = t > 0;
            gsap.set(bustInner, {
              transformOrigin: L.bustOrigin,
              x: eyeX - L.bustEye.x,
              y: eyeY - L.bustEye.y,
              scale: s / L.sMatch,
            });
            bustWrap.style.opacity = String(1 - kBust);
            // menjelang perosotan: teks memudar & naik sedikit
            const kOut = seg(t, T.textOut, E.inOut2);
            gsap.set(heroName, { y: L.name.dy * kMove - 40 * kOut, opacity: 1 - kOut });
            // deskripsi tidak melintas di depan karakter: memudar → pindah saat tak terlihat → muncul
            const kRaw = seg(t, T.textMove);
            const kPos = seg(kRaw, [0.4, 0.55]);
            const descAlpha = 1 - seg(kRaw, [0.1, 0.4]) + seg(kRaw, [0.55, 0.9], E.inOut2);
            gsap.set(heroDesc, {
              x: L.desc.dx * kPos,
              y: L.desc.dy * kPos + 24 * (1 - seg(kRaw, [0.55, 0.9], E.inOut2)) * kPos,
              opacity: descAlpha * (1 - kOut),
            });
          }

          // ── Kamera & perosotan ──
          // kamera mengikuti: titik duduk di layar bergeser mulus dari posisi awal (kanan) ke posisi
          // akhir (kiri-bawah), dunia (perosotan) bergerak di bawahnya
          const kS = seg(t, T.slide, E.inOutSine);
          const uNow = t >= T.rise[0] ? G.uE : pathFind('len', lerp(pathAt(G.uP).len, pathAt(G.uE).len, kS));
          const tw = TRACK_SIZE.w * G.sigma, th = TRACK_SIZE.h * G.sigma;
          const world = (u: number) => { const pt = pathAt(u); return { x: G.O.x + pt.x * tw, y: G.O.y + pt.y * th }; };
          const wP = world(G.uP), wE = world(G.uE), wN = world(uNow);
          const kC = E.inOut2(kS);
          const camX = t < T.slide[0] ? G.cam0.x : wN.x - lerp(wP.x - G.cam0.x, wE.x, kC);
          const camY = t < T.slide[0] ? G.cam0.y : wN.y - lerp(wP.y - G.cam0.y, wE.y, kC);
          const kTrack = seg(t, T.trackIn, E.out3) * (1 - seg(t, T.trackOut, E.inOut2));
          if (kTrack > 0 || track.style.opacity !== '0') {
            track.style.opacity = String(kTrack);
            track.style.transform =
              `translate3d(${G.O.x - camX}px, ${G.O.y - camY + (1 - kTrack) * 0.08 * L.H}px, 0) scale(${G.sigma})`;
          }
          const onPath = (u: number) => { const w = world(u); return { x: w.x - camX, y: w.y - camY }; };

          // ── Teks perkenalan: muncul satu per satu dari bawah ──
          // lalu naik keluar layar bersama karakter (kamera turun ke section berikutnya)
          const kOutI = seg(t, T.introOut, E.inOut2);
          introItems.forEach((el, i) => {
            const a = T.intro[0] + i * 0.22;
            const k = seg(t, [a, a + 0.8], E.out3);
            el.style.opacity = String(k);
            el.style.transform = `translate3d(0, ${(1 - k) * 40 - kOutI * L.H}px, 0)`;
          });

          // ── Riwayat pekerjaan: muncul satu per satu setelah ia mendarat ──
          workItems.forEach((el, i) => {
            const a = T.work[0] + i * 0.18;
            const k = seg(t, [a, a + 0.7], E.out3);
            el.style.opacity = String(k);
            el.style.transform = `translate3d(0, ${(1 - k) * 30}px, 0)`;
            el.style.visibility = k > 0.01 ? 'visible' : 'hidden'; // tak terlihat → tak bisa diklik
          });

          // ── Carousel perusahaan: teks lama memudar & naik, teks baru muncul dari bawah ──
          // scroll kembali ke atas sebelum ia sampai → kembali ke perusahaan pertama
          if (t < T.approach[1] && (jobTo !== 0 || jobT0 >= 0)) setJob(0);
          const jp = jobProgress();
          const jobAlpha = (i: number) =>
            jp >= 1 ? (i === jobTo ? 1 : 0)
              : i === jobFrom ? 1 - seg(jp, [0, 0.2], E.inOut2)
              : i === jobTo ? seg(jp, [0.78, 0.98], E.inOut2) : 0;
          [jobCos, jobDescs].forEach((els) => els.forEach((el, i) => {
            const a = jobAlpha(i);
            el.style.opacity = String(a);
            el.style.transform = `translate3d(0, ${i === jobFrom && jp < 1 ? -14 * (1 - a) : 14 * (1 - a)}px, 0)`;
          }));
          // tombol "View Project" ikut memudar selama pindah perusahaan (bersama teks)
          if (jp < 1) {
            const vis = Math.max(1 - seg(jp, [0, 0.2], E.inOut2), seg(jp, [0.78, 0.98], E.inOut2));
            const base = parseFloat(ctaEl.style.opacity || '0');
            ctaEl.style.opacity = String(base * vis);
            if (vis < 0.05) ctaEl.style.visibility = 'hidden';
          }

          // ── Frame karakter ──
          let layers: Layer[] = [[S, 1]];
          let yc = y;
          let sc = s;
          let rot = 0;
          let breath = 1;
          let pivot: { x: number; y: number } | undefined;
          const rotAt = (u: number) => (pathAt(u).angle - (SLIDE.poseAngle * Math.PI) / 180) * SLIDE.tilt;
          // posisi badan (tengah x, sol sepatu y) di akhir perkenalan, & penempatan frame per badan
          const kR = s * (S.ch / SEQ.rise[0].ch);
          const seatE = onPath(G.uE);
          const introBody = {
            x: seatE.x - G.off.x + (BODY.rise[0] - SEQ.rise[0].anchor[0]) * kR,
            y: seatE.y - G.off.y + (BODY.rise[1] - SEQ.rise[0].anchor[1]) * kR,
          };
          const bodyKey = (f: Frame) =>
            (SEQ.float.includes(f) ? 'float' : SEQ.open.includes(f) ? 'open' : SEQ.work.includes(f) ? 'work' : 'rise') as keyof typeof BODY;
          // geseran supaya badan frame f (skala sc) tepat di (bx, by), relatif terhadap titik (x, yc)
          const placeAt = (f: Frame, bx: number, by: number, scl: number) => {
            const kk = scl * (S.ch / f.ch), b = BODY[bodyKey(f)];
            return { x: bx - (b[0] - f.anchor[0]) * kk, y: by - (b[1] - f.anchor[1]) * kk };
          };
          if (t >= T.float[0]) {
            // melayang turun dari posisinya ke tengah section bawah (kamera ikut turun: teks naik keluar),
            // sambil mengecil ke ukuran section pekerjaan; sedikit terangkat angin di tengah jalan
            const k = seg(t, T.float);
            const ke = E.inOut2(k);
            const f = pickK(SEQ.float, k);
            sc = lerp(s, (WORK.charHeight * L.H) / S.h, E.out2(k)); // cepat mengecil → payung tidak keluar layar
            const bx = lerp(introBody.x, 0.5 * L.W, ke);
            const by = lerp(introBody.y, WORK.feetY * L.H, ke) - Math.sin(Math.PI * k) * 0.05 * L.H;
            ({ x, y: yc } = placeAt(f, bx, by, sc));
            layers = [[f, 1]];
            // sambungan: posisi payung di akhir video membuka payung sedikit beda → memudar singkat
            const fade = 1 - E.inOut2(seg(k, [0, 0.1]));
            if (SEQ.open.length && fade > 0.02) {
              const o = SEQ.open[SEQ.open.length - 1], po = placeAt(o, bx, by, sc);
              layers.push([o, fade, po.x - x, po.y - yc]);
            }
            // mendarat: pose berpayung memudar ke frame pertama video jalan maju (sudah memakai lanyard)
            const kl = E.inOut2(seg(t, T.land));
            if (kl > 0) {
              // berjalan maju: frame video (membesar alami) + kaki bergeser ke lantai depan;
              // skala disetel supaya di akhir tinggi badan = sebelum berpayung (LAYOUT.charHeight)
              const kaRaw = seg(t, T.approach), ka = seg(kaRaw, [0, FWD_WALK_END]); // langkah = laju tetap
              const w = pickK(SEQ.fwd, kaRaw);
              const scW = lerp(sc, (LAYOUT.charHeight * L.H) / S.h / FWD_GROW, ka);
              const fx = 0.5 * L.W, fy = lerp(by, WORK.finalFeetY * L.H, ka); // anchor frame = kepala x, kaki y
              let px = fx, py = fy; // poros napas & goyangan (ikut bergeser saat pindah perusahaan)
              if (kl >= 0.98) {
                x = fx; yc = fy; sc = scW; layers = [[w, 1]];
                // akhir jalan maju: frame video memudar ke pose diam perusahaan pertama
                if (kaRaw >= STILL_FROM && kaRaw < 1) {
                  const kb = E.inOut2(seg(kaRaw, [STILL_FROM, 1]));
                  layers = [[w, 1 - kb, 0, 0, 1], [SEQ.tries[0], kb, 0, 0, s / scW]];
                }
                if (kaRaw >= 1) {
                  // lapisan relatif terhadap (fx, fy, skala s); masing-masing dengan skala sendiri
                  sc = s; x = fx; yc = fy;
                  const lookLayer = (i: number, a: number): Layer => {
                    const look = JOBS[i].look;
                    // pose diam per perusahaan (anchor = kepala x & kaki, tinggi badan = ch)
                    const still = look === 'plain' ? SEQ.plain[0] : look === 'genah' ? SEQ.genah[0] : SEQ.tries[0];
                    return [still, a, 0, 0, 1];
                  };
                  if (jp >= 1) layers = [lookLayer(jobTo, 1)];
                  else {
                    // pindah perusahaan: menoleh ke kanan → berjalan keluar → (berikutnya) berjalan masuk
                    // dari kiri → berbalik ke depan. Frame langkah sesuai jarak tempuh (kaki tidak meluncur).
                    const D = SWITCH.dist * L.W;
                    const nI = SEQ.intro.length, nL = SEQ.loop.length, nO = SEQ.outro.length;
                    const perFrame = (LAYOUT.walkCycle * S.ch * s) / nL;
                    const walkL = (f: Frame, a: number, dx: number): Layer => [f, a, dx, 0, 1];
                    if (jp < 0.5) {
                      const q = jp / 0.5;
                      if (q < 0.25) {
                        const k = q / 0.25, fb = seg(k, [0, 0.3]);
                        const f = pickK(SEQ.turn, k);
                        layers = fb >= 1 ? [walkL(f, 1, 0)] : [lookLayer(jobFrom, 1 - fb), walkL(f, fb, 0)];
                      } else {
                        const dx = ((q - 0.25) / 0.75) * D;
                        const j = Math.floor(dx / perFrame);
                        layers = [walkL(j < nI ? SEQ.intro[j] : SEQ.loop[(j - nI) % nL], 1, dx)];
                        x = fx; px += dx;
                      }
                    } else {
                      const q = (jp - 0.5) / 0.5;
                      const back = SEQ.back.slice(0, SWITCH.backEnd + 1);
                      if (q < 0.7) {
                        const kk = q / 0.7, dx = -(1 - kk) * D;
                        const m = Math.max(0, Math.round((D / perFrame - nO) / nL)), total = nL * m + nO;
                        const j = Math.min(total - 1, Math.floor(kk * total));
                        layers = [walkL(j < nL * m ? SEQ.loop[j % nL] : SEQ.outro[j - nL * m], 1, dx)];
                        px += dx;
                      } else if (q < 0.92) {
                        layers = [walkL(pickK(back, (q - 0.7) / 0.22), 1, 0)];
                      } else {
                        const fb = E.inOut2(seg(q, [0.92, 1]));
                        layers = [walkL(back[back.length - 1], 1 - fb, 0), lookLayer(jobTo, fb)];
                      }
                    }
                  }
                }
              } else {
                // saat memudar skalanya masih sama (approach belum mulai) → cukup geser ke anchor frame jalan
                layers = [[f, 1 - kl], [w, kl, fx - x, fy - yc]];
              }
              // hidup: bernapas & sedikit bergoyang, berporos di kaki (berhenti selama melangkah)
              const amt = kl * Math.max(1 - seg(kaRaw, [0, 0.04]), seg(kaRaw, [FWD_WALK_END, FWD_WALK_END + 0.1])) * (jp < 1 ? 0 : 1);
              const now = performance.now() / 1000;
              breath = 1 + IDLE.breath * amt * Math.sin((2 * Math.PI * now) / IDLE.breathSec);
              rot = ((IDLE.sway * Math.PI) / 180) * amt * Math.sin((2 * Math.PI * now) / IDLE.swaySec);
              pivot = { x: px, y: py };
              ensureIdle();
            }
          } else if (t >= T.open[0]) {
            // di posisinya: mengeluarkan & membuka payung
            const k = seg(t, T.open);
            if (SEQ.open.length) {
              const f = pickK(SEQ.open, k);
              ({ x, y: yc } = placeAt(f, introBody.x, introBody.y, s));
              layers = [[f, 1]];
            } else {
              // sementara (belum ada video): pose berdiri memudar ke pose berpayung pertama
              const a = SEQ.rise[SEQ.rise.length - 1], b = SEQ.float[0];
              const pa = placeAt(a, introBody.x, introBody.y, s), pb = placeAt(b, introBody.x, introBody.y, s);
              const fb = E.inOut2(seg(k, [0.2, 0.8]));
              x = pa.x; yc = pa.y;
              layers = fb < 0.02 ? [[a, 1]] : fb > 0.98 ? [[b, 1, pb.x - pa.x, pb.y - pa.y]] : [[a, 1 - fb], [b, fb, pb.x - pa.x, pb.y - pa.y]];
            }
          } else if (t >= T.rise[0]) {
            // sampai di ujung → berdiri → menyapa (badan kembali tegak)
            const k = seg(t, T.rise);
            layers = [[pickK(SEQ.rise, k), 1]];
            const seat = onPath(G.uE);
            x = seat.x - G.off.x;
            yc = seat.y - G.off.y;
            rot = rotAt(G.uE) * (1 - seg(k, [0, 0.3], E.inOut2));
            pivot = seat;
          } else if (t >= T.slide[0]) {
            // meluncur: titik duduk mengikuti jalur (berdasarkan panjang lintasan), badan ikut miring
            const u = uNow;
            const seat = onPath(u);
            const n = SEQ.slide.length;
            layers = [[SEQ.slide[Math.min(n * SLIDE.loops - 1, Math.floor(seg(t, T.slide) * n * SLIDE.loops)) % n], 1]];
            x = seat.x - G.off.x;
            yc = seat.y - G.off.y;
            rot = rotAt(u);
            pivot = seat;
          } else if (t >= T.sit[0]) {
            // menunduk melihat perosotan muncul, lalu duduk di atasnya (badan mulai mengikuti kemiringan)
            const k = seg(t, T.sit);
            layers = [[pickK(SEQ.sit, k), 1]];
            x = L.E.x;
            rot = rotAt(G.uP) * seg(k, [0.6, 1], E.inOut2);
            pivot = onPath(G.uP);
          } else if (t >= T.turnBack[0]) {
            // berhenti, berbalik ke depan & angkat tangan (frame video, urut sesuai scroll)
            layers = [[pickK(SEQ.back, seg(t, T.turnBack)), 1]];
            x = L.E.x;
          } else if (t >= T.walk[0]) {
            // posisi menentukan frame: kaki "menapak" sesuai jarak tempuh, tidak meluncur.
            // langkah awal → siklus diulang m kali → langkah akhir; jumlah frame dibulatkan
            // supaya jalan selalu berakhir tepat di awal "outro" (fase langkah pas)
            x = lerp(L.A.x, L.E.x, seg(t, T.walk, E.inOutSine));
            const D = L.E.x - L.A.x;
            const nI = SEQ.intro.length, nL = SEQ.loop.length, nO = SEQ.outro.length;
            const perFrame = (LAYOUT.walkCycle * S.ch * s) / nL; // jarak per frame langkah
            const m = Math.max(0, Math.round((D / perFrame - nI - nO) / nL)); // 0 = langsung awal → akhir (fasenya sambung)
            const total = nI + nL * m + nO;
            const j = Math.min(total - 1, Math.floor(((x - L.A.x) / (D || 1)) * total));
            const fr = j < nI ? SEQ.intro[j] : j < nI + nL * m ? SEQ.loop[(j - nI) % nL] : SEQ.outro[j - nI - nL * m];
            layers = [[fr, 1]];
          } else if (t >= T.turn[0]) {
            // pose berdiri (menyapa) → frame video pertama dibaurkan, lalu video berjalan
            const k = seg(t, T.turn);
            layers = k < 0.2 ? blendSoft([S, SEQ.turn[0]], k / 0.2) : [[pickK(SEQ.turn, (k - 0.2) / 0.8), 1]];
          }
          // muncul begitu scroll dimulai, di BAWAH bust (bust memudar di atasnya)
          draw(layers, x, yc, sc, clamp01(t / 0.04), rot, pivot, breath);
        };

        const proxy = { p: 0 };
        let tween: gsap.core.Tween | null = null; // dibuat di bawah; refresh bisa dipanggil saat pembuatan
        const refresh = () => {
          L = computeLayout(stage);
          G = computeSlide(L);
          sizeCanvas();
          // setelah refresh, samakan progres dengan posisi scroll sebenarnya (bukan nilai sementara)
          const st = tween?.scrollTrigger;
          if (st) proxy.p = st.progress;
          render(proxy.p);
        };

        render(0);
        tween = gsap.to(proxy, {
          p: 1,
          ease: 'none',
          onUpdate: () => render(proxy.p),
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: SCROLL_LENGTH,
            pin: true,
            scrub: SCRUB,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: refresh,
          },
        });

        return () => {
          window.clearTimeout(blinkTimer);
          cancelAnimationFrame(idleRaf);
          jobDots.forEach((d, i) => d.removeEventListener('click', dotHandlers[i]));
          stage.removeEventListener('wheel', onWheel);
          stage.removeEventListener('pointerdown', onDown);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('keydown', onKey);
          cancelAnimationFrame(raf);
          tween?.scrollTrigger?.kill();
          tween?.kill();
          // kembalikan elemen Hero ke keadaan semula
          gsap.set([heroName, heroDesc], { clearProps: 'x,y,opacity' });
          gsap.set(bustInner, { x: 0, y: 0, scale: 1 });
          bustWrap.style.opacity = '';
          track.style.opacity = '0';
          introItems.forEach((el) => { el.style.opacity = '0'; el.style.transform = ''; });
          workItems.forEach((el) => { el.style.opacity = '0'; el.style.transform = ''; });
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={stageRef}
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
    >
      <Hero />

      {/* Perosotan: muncul saat karakter menunduk, digeser kamera saat ia meluncur (di bawah karakter) */}
      <img
        data-story="track"
        src="/assets/slide-track.webp"
        alt=""
        aria-hidden
        draggable={false}
        style={{
          position: 'absolute', left: 0, top: 0, zIndex: 8, pointerEvents: 'none',
          width: TRACK_SIZE.w, height: TRACK_SIZE.h, maxWidth: 'none',
          transformOrigin: '0 0', opacity: 0, willChange: 'transform, opacity',
          maskImage: TRACK_MASK, WebkitMaskImage: TRACK_MASK,
        }}
      />

      {/* Karakter: zoom-out, melambai, menoleh, berjalan (frame sequence di canvas).
          z-index 9 = di bawah bust (10) supaya bust memudar di atasnya, di bawah teks (20). */}
      <canvas
        data-story="char"
        style={{ position: 'absolute', left: 0, top: 0, zIndex: 9, pointerEvents: 'none' }}
      />

      {/* Riwayat pekerjaan: karakter di tengah, perusahaan & posisi di kiri, deskripsi di kanan */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
          color: THEME.text, fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ position: 'absolute', right: '3vw', top: '42%', width: 'min(28vw, 420px)' }}>
          {/* deskripsi tiap perusahaan ditumpuk di tempat yang sama; yang aktif terlihat (diatur di efek) */}
          <div data-work="desc" style={{ opacity: 0, display: 'grid' }}>
            {JOBS.map((j, i) => (
              <p
                key={j.company}
                data-job-desc={i}
                style={{
                  gridArea: '1 / 1', margin: 0, opacity: i === 0 ? 1 : 0,
                  fontSize: 'clamp(0.9rem, min(1.3vw, 2.6vh), 1.2rem)', lineHeight: 1.65, color: THEME.descriptionText,
                }}
              >
                {j.desc}
              </p>
            ))}
          </div>
          {/* tombol outline (warna = tombol utama "Lets Contact"); bisa diklik hanya saat terlihat */}
          <div data-work="cta" style={{ opacity: 0, marginTop: '1.6em' }}>
            <a
              href="#project"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.55em',
                border: `1.5px solid ${THEME.buttonBg}`, color: THEME.buttonBg, background: 'transparent',
                fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(0.85rem, 1.25vw, 1.1rem)', fontWeight: 500,
                height: 'clamp(2.4rem, 6vh, 3.4rem)', padding: '0 clamp(1.2rem, 2.3vw, 2.2rem)',
                borderRadius: '9999px', textDecoration: 'none', pointerEvents: 'auto',
                transition: 'background 0.2s, color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = THEME.buttonBg;
                e.currentTarget.style.color = THEME.buttonText;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = THEME.buttonBg;
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span>View Project</span>
              {/* panah kanan */}
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 'clamp(12px, 1.2vw, 16px)', height: 'clamp(12px, 1.2vw, 16px)' }}>
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
        <div style={{ position: 'absolute', left: '3vw', top: '50%', transform: 'translateY(-50%)', width: 'min(32vw, 520px)' }}>
        <div data-work="company" style={{ opacity: 0, display: 'grid', alignItems: 'center' }}>
          {JOBS.map((j, i) => (
            <div key={j.company} data-job-co={i} style={{ gridArea: '1 / 1', opacity: i === 0 ? 1 : 0 }}>
              <h2
                style={{
                  margin: '0 0 0.45em', fontSize: 'clamp(1.8rem, min(3.6vw, 6.5vh), 3.6rem)', fontWeight: 400,
                  lineHeight: 1.15, letterSpacing: '-0.01em',
                }}
              >
                {j.company}
              </h2>
              <p style={{ margin: 0, fontSize: 'clamp(0.95rem, min(1.4vw, 2.8vh), 1.3rem)', lineHeight: 1.5 }}>
                {j.role}
                <span style={{ marginLeft: '0.8em', color: THEME.logoCoral }}>{j.period}</span>
              </p>
            </div>
          ))}
        </div>
        </div>
        {/* titik carousel: di tengah bawah, tepat di bawah kaki karakter */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '2.6vh', display: 'flex', justifyContent: 'center' }}>
        <div data-work="dots" style={{ opacity: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
          {JOBS.map((j, i) => (
            <button
              key={j.company}
              type="button"
              data-job-dot={i}
              aria-label={`View ${j.company}`}
              style={{
                width: i === 0 ? 28 : 10, height: 10, borderRadius: 5, border: 0, padding: 0, cursor: 'pointer',
                background: i === 0 ? THEME.logoCoral : 'rgba(33,33,33,0.22)', pointerEvents: 'auto',
                transition: 'width 0.35s ease, background 0.35s ease',
              }}
            />
          ))}
        </div>
        </div>
      </div>

      {/* Perkenalan: di kanan karakter setelah ia berdiri */}
      <div
        style={{
          // kanan lurus dengan tombol navbar (padding 3vw), jarak ke karakter mengikuti sisa ruang
          position: 'absolute', right: '3vw', top: '55%', transform: 'translateY(-50%)',
          width: 'min(54vw, 820px)', zIndex: 20, pointerEvents: 'none',
          color: THEME.text, fontFamily: "'Inter', sans-serif",
        }}
      >
        <h2
          data-intro="title"
          style={{
            margin: '0 0 1.1em', opacity: 0, maxWidth: '12em',
            fontSize: 'clamp(1.6rem, min(3.3vw, 6vh), 3.4rem)', fontWeight: 400, lineHeight: 1.32,
            letterSpacing: '-0.01em',
          }}
        >
          {INTRO.title}
        </h2>
        {INTRO.body.map((para) => (
          <p
            key={para.slice(0, 16)}
            data-intro="body"
            style={{
              margin: '0 0 1.1em', opacity: 0,
              fontSize: 'clamp(0.85rem, min(1.2vw, 2.5vh), 1.15rem)', lineHeight: 1.6,
              color: THEME.descriptionText,
            }}
          >
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
