import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from './Hero';
import { FRAMES, type Eye, type Frame } from './frames';

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════════════════════════
   PARALLAX HERO
   bust → zoom-out (seluruh badan, melambai) → menoleh → berjalan ke sisi kanan.
   Parallax berhenti saat karakter sampai di pinggir.
   ════════════════════════════════════════════════════════════════════════════ */

/* ─── PENGATURAN (semua angka yang mungkin ingin kamu ubah ada di sini) ─── */
const MIN_WIDTH = 900;          // di bawah lebar ini animasi dimatikan (hanya Hero)
const SCROLL_LENGTH = '+=440%'; // total panjang scroll untuk seluruh cerita
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
  total: 7.9,
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

// Mata hidup: kilau di iris + kedip otomatis (berdasarkan waktu, tetap jalan saat scroll berhenti)
const EYES = {
  blinkEvery: [2.2, 4.8] as const, // jeda acak antar kedip (detik)
  blinkClose: 0.07,                // durasi menutup (detik)
  blinkHold: 0.05,                 // tertutup penuh
  blinkOpen: 0.11,                 // membuka kembali
  doubleChance: 0.2,               // peluang kedip dua kali
  sparkle: 0.9,                    // kekuatan kilau mata (0 = mati)
};

/* ─── DATA POSE (ukuran px aset; jangan diubah kecuali asetnya diganti) ─── */
const BUST = { w: 1790, h: 2400, eye: [903, 768], eyeDist: 406 }; // base.png
const STAND_EYE = { eye: [349.9, 269.2], eyeDist: 168.3 };          // mata di walker-stand

/* Urutan frame. Data & anchor (kepala, sol sepatu) dari ./frames (dibuat otomatis). */
const [S] = FRAMES.stand;
const [W1, W2, W3, W4, W5] = FRAMES.wave;
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
  wave: [S, W1, W2, W3, W4, W3, W4, W5, S] as Frame[],
  turn: cut(FULL_CUT.turn),
  intro: cut(FULL_CUT.intro),
  loop: cut(FULL_CUT.loop),
  outro: cut(FULL_CUT.outro),
  back: cut(FULL_CUT.back),
};
const pickK = (seq: Frame[], k: number) => seq[Math.min(seq.length - 1, Math.max(0, Math.round(clamp01(k) * (seq.length - 1))))];

/* ─── util ─── */
type Layer = [Frame, number]; // frame + opacity
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const E = {
  out3: gsap.parseEase('power3.out'),
  inOut2: gsap.parseEase('power2.inOut'),
  inOutSine: gsap.parseEase('sine.inOut'),
};
const seg = (t: number, [a, b]: readonly [number, number] | readonly number[], e = (x: number) => x) =>
  e(clamp01((t - a) / (b - a)));

// posisi pecahan dalam urutan → 2 frame bertumpuk (frame berikutnya membaur masuk)
function blend(seq: Frame[], pos: number, loop = false): Layer[] {
  const n = seq.length;
  const p = loop ? ((pos % n) + n) % n : Math.min(n - 1, Math.max(0, pos));
  const i = Math.floor(p);
  // frame tetap tegas di sebagian besar waktunya, baru membaur di 40% terakhir (mengurangi bayangan)
  const r = clamp01((p - i - 0.6) / 0.4);
  const f = r * r * (3 - 2 * r);
  const j = loop ? (i + 1) % n : Math.min(n - 1, i + 1);
  return f > 0.02 && j !== i ? [[seq[i], 1], [seq[j], f]] : [[seq[i], 1]];
}
const blendSeg = (seq: Frame[], k: number) => blend(seq, k * (seq.length - 1));
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
        const drawSparkle = (e: Eye) => {
          if (EYES.sparkle <= 0) return;
          const r = e.pr;
          const glow = ctx.createRadialGradient(e.px + r * 0.32, e.py - r * 0.34, 0, e.px + r * 0.32, e.py - r * 0.34, r * 0.3);
          glow.addColorStop(0, `rgba(255,255,255,${0.95 * EYES.sparkle})`);
          glow.addColorStop(0.55, `rgba(255,255,255,${0.75 * EYES.sparkle})`);
          glow.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(e.px + r * 0.32, e.py - r * 0.34, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
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
        const draw = (layers: Layer[], x: number, y: number, scale: number, alpha: number) => {
          const lid = blinkAmount();
          const key =
            alpha > 0
              ? layers.map(([f, a]) => `${f.src}:${a.toFixed(3)}`).join('+') +
                `|${x.toFixed(1)}|${y.toFixed(1)}|${scale.toFixed(4)}|${alpha.toFixed(3)}|${lid.toFixed(2)}`
              : 'none';
          if (key === lastKey) return;
          lastKey = key;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (alpha <= 0) return;
          ctx.imageSmoothingQuality = 'high';
          for (const [f, a] of layers) {
            const im = imgOf(f);
            if (!im.complete || !im.naturalWidth) { lastKey = ''; continue; } // belum siap → coba lagi nanti
            ctx.globalAlpha = Math.min(1, alpha * a);
            // resolusi tiap grup beda (mis. frame video lebih kecil) → samakan lewat tinggi karakter
            const k = scale * (S.ch / f.ch);
            ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (x - f.anchor[0] * k), dpr * (y - f.anchor[1] * k));
            ctx.drawImage(im, 0, 0);
            for (const e of f.eyes) {
              drawSparkle(e);
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
            gsap.set(heroName, { y: L.name.dy * kMove });
            // deskripsi tidak melintas di depan karakter: memudar → pindah saat tak terlihat → muncul
            const kRaw = seg(t, T.textMove);
            const kPos = seg(kRaw, [0.4, 0.55]);
            const descAlpha = 1 - seg(kRaw, [0.1, 0.4]) + seg(kRaw, [0.55, 0.9], E.inOut2);
            gsap.set(heroDesc, {
              x: L.desc.dx * kPos,
              y: L.desc.dy * kPos + 24 * (1 - seg(kRaw, [0.55, 0.9], E.inOut2)) * kPos,
              opacity: descAlpha,
            });
          }

          // ── Frame karakter ──
          let layers: Layer[] = [[S, 1]];
          if (t >= T.turnBack[0]) {
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
            // pose depan (walker-stand) → frame video pertama dibaurkan singkat, lalu video berjalan
            const k = seg(t, T.turn);
            layers = k < 0.1 ? blendSoft([S, SEQ.turn[0]], k / 0.1) : [[pickK(SEQ.turn, (k - 0.1) / 0.9), 1]];
          } else if (t >= T.wave[0]) {
            layers = blendSeg(SEQ.wave, seg(t, T.wave));
          }
          // muncul begitu scroll dimulai, di BAWAH bust (bust memudar di atasnya)
          draw(layers, x, y, s, clamp01(t / 0.04));
        };

        const proxy = { p: 0 };
        let tween: gsap.core.Tween | null = null; // dibuat di bawah; refresh bisa dipanggil saat pembuatan
        const refresh = () => {
          L = computeLayout(stage);
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
          cancelAnimationFrame(raf);
          tween?.scrollTrigger?.kill();
          tween?.kill();
          // kembalikan elemen Hero ke keadaan semula
          gsap.set([heroName, heroDesc], { clearProps: 'x,y,opacity' });
          gsap.set(bustInner, { x: 0, y: 0, scale: 1 });
          bustWrap.style.opacity = '';
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

      {/* Karakter: zoom-out, melambai, menoleh, berjalan (frame sequence di canvas).
          z-index 9 = di bawah bust (10) supaya bust memudar di atasnya, di bawah teks (20). */}
      <canvas
        data-story="char"
        style={{ position: 'absolute', left: 0, top: 0, zIndex: 9, pointerEvents: 'none' }}
      />
    </div>
  );
}
