import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from './Hero';
import { THEME } from '../config';
import { SLIDE_PATH, TRACK_SIZE } from './slidePath';

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════════════════════════
   KONTEN SECTION PERKENALAN (ganti sesuai kebutuhan)
   ════════════════════════════════════════════════════════════════════════════ */
const INTRO = {
  eyebrow: 'About me',
  title: ['Hi, I’m Fairuz,', 'a designer who loves', 'telling stories.'],
  body:
    'Placeholder: tulis perkenalan singkat di sini. Siapa kamu, apa yang kamu kerjakan, ' +
    'dan apa yang membuat karyamu berbeda.',
};

/* ════════════════════════════════════════════════════════════════════════════
   PENGATURAN (semua angka yang mungkin ingin kamu ubah ada di sini)
   ════════════════════════════════════════════════════════════════════════════ */
const MIN_WIDTH = 900;          // di bawah lebar ini animasi dimatikan (hanya Hero)
const SCROLL_LENGTH = '+=520%'; // total panjang scroll untuk seluruh cerita
const SCRUB = 0.8;              // kehalusan scrub (detik)

// Timeline dalam "unit waktu"; total = T.total. Ubah angka untuk mempercepat/memperlambat tiap fase.
const T = {
  textOut: [0.0, 0.9],   // nama + deskripsi hero keluar (slide up)
  fade: [0.2, 0.9],      // crossfade bust → pose berdiri (kepala disejajarkan lewat mata)
  zoom: [0.9, 3.6],      // zoom-out: karakter mengecil
  trackIn: [1.2, 3.2],   // perosotan muncul
  jump: 3.7,             // ganti ke pose lompat
  arc: [3.7, 4.9],       // lompat naik ke perosotan (keluar frame kanan-atas)
  sitIn: 4.75,           // pose duduk muncul di ujung atas perosotan
  slide: [4.75, 8.9],    // meluncur sepanjang jalur
  hop: 8.9,              // ganti ke pose lompat di ujung bawah perosotan
  hopArc: [8.9, 10.1],   // lompat turun ke section perkenalan
  land: 10.1,            // mendarat: pose berdiri
  trackOut: [8.6, 10.0], // perosotan memudar
  intro: [9.7, 11.3],    // teks perkenalan muncul
  total: 11.6,
} as const;

// Ukuran & posisi dalam fraksi layar (W = lebar, H = tinggi)
const LAYOUT = {
  trackWidth: 1.12,          // lebar gambar track = 1.12 × lebar layar
  lip: { x: 0.1, y: 0.8 },   // ujung bawah perosotan
  standStart: { x: 0.6, y: 0.955 }, // posisi kaki saat berdiri kecil (sebelum lompat)
  standHeight: 0.4,          // tinggi karakter setelah mengecil (× tinggi layar)
  exit: { x: 0.97, y: -0.28 },      // titik lompatan keluar frame
  sitWidth: 0.18,            // lebar pose duduk (× lebar layar)
  sitLift: 0.006,            // angkat pose duduk sedikit di atas lantai (× tinggi layar)
  landing: { x: 0.25, y: 0.965 },   // posisi kaki saat mendarat
  landingHeight: 0.56,       // tinggi karakter akhir (× tinggi layar)
  hopApex: 0.13,             // tinggi puncak lompatan turun (× tinggi layar)
};

/* ════════════════════════════════════════════════════════════════════════════
   DATA POSE (ukuran px aset hasil crop; jangan diubah kecuali asetnya diganti)
   ════════════════════════════════════════════════════════════════════════════ */
const BUST = { w: 1790, h: 2400, eye: [903, 768], eyeDist: 406 };       // base.png
const STAND = { w: 933, h: 2092, eye: [349.9, 269.2], eyeDist: 168.3, anchor: [466.5, 2092] };
const JUMP = { w: 1029, h: 2060, anchor: [514.5, 2060], headScale: 0.91 }; // 0.91 = samakan ukuran kepala dgn STAND
const SIT = { w: 521, h: 693, anchor: [234.5, 644.5], baked: -44 };

/* ─── util ─── */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const E = {
  lin: (x: number) => x,
  inOut2: gsap.parseEase('power2.inOut'),
  in1: gsap.parseEase('power1.in'),
  out2: gsap.parseEase('power2.out'),
  out1: gsap.parseEase('power1.out'),
  inOutSine: gsap.parseEase('sine.inOut'),
  // luncuran: hampir konstan, sedikit akselerasi di awal
  slide: (x: number) => 0.65 * x + 0.35 * x * x,
  out4: gsap.parseEase('power4.out'),
};
const seg = (t: number, [a, b]: readonly [number, number] | readonly number[], e = E.lin) =>
  e(clamp01((t - a) / (b - a)));
const fade = (t: number, at: number, d = 0.08) => clamp01((t - at) / d);

interface Layout {
  W: number;
  H: number;
  track: { left: number; top: number; w: number; h: number };
  sx: number[];
  sy: number[];
  iStart: number;
  iEnd: number;
  bustEye: { x: number; y: number };
  sMatch: number;
  sA: number;
  A: { x: number; y: number };
  X: { x: number; y: number };
  sitScale: number;
  G: { x: number; y: number };
  sG: number;
}

function computeLayout(stage: HTMLElement): Layout {
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const sr = stage.getBoundingClientRect();

  // posisi mata bust hero (diukur dari wrapper luar, jadi tidak terpengaruh animasi intro/parallax)
  const charEl = stage.querySelector<HTMLElement>('[data-reveal="character"]');
  const box = (charEl?.parentElement ?? charEl)?.getBoundingClientRect();
  const bw = box?.width ?? W * 0.4;
  const bh = box?.height ?? (bw * BUST.h) / BUST.w;
  const bl = (box?.left ?? sr.left + W / 2 - bw / 2) - sr.left;
  const bt = (box?.top ?? sr.bottom - bh) - sr.top;
  const bustEye = {
    x: bl + (BUST.eye[0] / BUST.w) * bw,
    y: bt + (BUST.eye[1] / BUST.h) * bh,
  };
  const sMatch = (bw / BUST.w) * (BUST.eyeDist / STAND.eyeDist);

  // track
  const tw = LAYOUT.trackWidth * W;
  const th = (tw * TRACK_SIZE.h) / TRACK_SIZE.w;
  const left = LAYOUT.lip.x * W - SLIDE_PATH.x[0] * tw;
  const top = LAYOUT.lip.y * H - SLIDE_PATH.y[0] * th;
  const sx = SLIDE_PATH.x.map((v) => left + v * tw);
  const sy = SLIDE_PATH.y.map((v) => top + v * th);

  // rentang jalur yang dilalui pose duduk: dari tepat di atas layar sampai dekat lip
  let iStart = sx.length - 1;
  for (let i = sx.length - 1; i >= 0; i--) {
    if (sy[i] >= -0.02 * H) {
      iStart = i;
      break;
    }
  }
  let iEnd = 0;
  for (let i = 0; i < SLIDE_PATH.x.length; i++) {
    if (SLIDE_PATH.x[i] >= 0.09) {
      iEnd = i;
      break;
    }
  }

  return {
    W,
    H,
    track: { left, top, w: tw, h: th },
    sx,
    sy,
    iStart,
    iEnd,
    bustEye,
    sMatch,
    sA: (LAYOUT.standHeight * H) / STAND.h,
    A: { x: LAYOUT.standStart.x * W, y: LAYOUT.standStart.y * H },
    X: { x: LAYOUT.exit.x * W, y: LAYOUT.exit.y * H },
    sitScale: (LAYOUT.sitWidth * W) / SIT.w,
    G: { x: LAYOUT.landing.x * W, y: LAYOUT.landing.y * H },
    sG: (LAYOUT.landingHeight * H) / STAND.h,
  };
}

function samplePath(L: Layout, u: number) {
  const len = SLIDE_PATH.len;
  let j = 0;
  while (j < len.length - 2 && len[j + 1] < u) j++;
  const k = clamp01((u - len[j]) / (len[j + 1] - len[j] || 1));
  return {
    x: lerp(L.sx[j], L.sx[j + 1], k),
    y: lerp(L.sy[j], L.sy[j + 1], k),
    angle: lerp(SLIDE_PATH.angle[j], SLIDE_PATH.angle[j + 1], k),
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
        const qa = (s: string) => Array.from(stage.querySelectorAll<HTMLElement>(s));

        const track = q('[data-story="track"]');
        const wStand = q('[data-story="stand"]');
        const wJump = q('[data-story="jump"]');
        const wSit = q('[data-story="sit"]');
        const heroLines = qa('[data-reveal="line"]');
        const heroDesc = q('[data-reveal="desc"]');
        const heroBust = q('[data-reveal="character"]');
        const introItems = qa('[data-intro]');

        let L = computeLayout(stage);
        let heroTouched = false;

        const place = (
          el: HTMLElement,
          anchor: readonly number[],
          x: number,
          y: number,
          scale: number,
          rotation: number,
          alpha: number
        ) => {
          gsap.set(el, {
            x: x - anchor[0],
            y: y - anchor[1],
            scale,
            rotation,
            autoAlpha: alpha,
            transformOrigin: `${anchor[0]}px ${anchor[1]}px`,
          });
        };

        const render = (p: number) => {
          const t = p * T.total;

          // ── Hero: nama & deskripsi keluar, bust memudar ───────────────────
          const kText = seg(t, T.textOut, E.inOut2);
          const kFade = seg(t, T.fade);
          if (t > 0 || heroTouched) {
            heroTouched = t > 0;
            gsap.set(heroLines, { yPercent: -120 * kText });
            gsap.set(heroDesc, { y: -50 * kText, opacity: 1 - kText });
            gsap.set(heroBust, { opacity: 1 - kFade });
          }

          // ── Perosotan ─────────────────────────────────────────────────────
          const kIn = seg(t, T.trackIn, E.out4);
          const kOut = seg(t, T.trackOut, E.inOut2);
          gsap.set(track, {
            x: L.track.left + (1 - kIn) * L.W * 0.12 - kOut * L.W * 0.04,
            y: L.track.top,
            width: L.track.w,
            height: L.track.h,
            autoAlpha: kIn * (1 - kOut),
          });

          // ── Pose berdiri: crossfade dari bust, zoom-out, lalu mendarat di akhir ──
          const kZoom = seg(t, T.zoom, E.inOut2);
          const fx0 = L.bustEye.x - L.sMatch * (STAND.eye[0] - STAND.anchor[0]);
          const fy0 = L.bustEye.y - L.sMatch * (STAND.eye[1] - STAND.anchor[1]);
          const sStand = L.sMatch * Math.pow(L.sA / L.sMatch, kZoom);
          const standEarly = seg(t, T.fade) * (1 - fade(t, T.jump));
          const standEnd = fade(t, T.land);
          if (t < T.land) {
            place(wStand, STAND.anchor, lerp(fx0, L.A.x, kZoom), lerp(fy0, L.A.y, kZoom), sStand, 0, Math.max(standEarly, 0));
          } else {
            place(wStand, STAND.anchor, L.G.x, L.G.y, L.sG, 0, standEnd);
          }

          // ── Pose lompat (naik ke perosotan, lalu turun ke section perkenalan) ──
          const jScale0 = L.sA * JUMP.headScale;
          const kArc = seg(t, T.arc);
          const arcX = lerp(L.A.x, L.X.x, E.inOutSine(kArc));
          const arcY = lerp(L.A.y, L.X.y, E.out2(kArc));
          const arcS = lerp(jScale0, L.sitScale * 0.36, kArc);
          const arcRot = lerp(0, 10, E.inOutSine(kArc));
          const alphaJump1 = fade(t, T.jump) * (1 - fade(t, T.sitIn));

          const lipP = samplePath(L, SLIDE_PATH.len[L.iEnd]);
          const kHop = seg(t, T.hopArc);
          const hopX = lerp(lipP.x, L.G.x, E.out1(kHop));
          const hopY = lerp(lipP.y, L.G.y, kHop) - 4 * LAYOUT.hopApex * L.H * kHop * (1 - kHop);
          const hopS = lerp(L.sitScale * 0.36, L.sG * JUMP.headScale, E.inOut2(kHop));
          const hopRot = lerp(-8, 0, kHop);
          const alphaJump2 = fade(t, T.hop) * (1 - fade(t, T.land));

          if (t < T.hop) {
            place(wJump, JUMP.anchor, arcX, arcY, arcS, arcRot, alphaJump1);
          } else {
            place(wJump, JUMP.anchor, hopX, hopY, hopS, hopRot, alphaJump2);
          }

          // ── Pose duduk meluncur sepanjang jalur ───────────────────────────
          const uStart = SLIDE_PATH.len[L.iStart];
          const uEnd = SLIDE_PATH.len[L.iEnd];
          const kSlide = seg(t, T.slide, E.slide);
          const sp = samplePath(L, lerp(uStart, uEnd, kSlide));
          const sitRot = Math.max(-10, Math.min(24, (sp.angle - SIT.baked) * 0.5));
          place(
            wSit,
            SIT.anchor,
            sp.x,
            sp.y - LAYOUT.sitLift * L.H,
            L.sitScale,
            sitRot,
            fade(t, T.sitIn) * (1 - fade(t, T.hop))
          );

          // ── Teks perkenalan ───────────────────────────────────────────────
          introItems.forEach((el, i) => {
            const a = T.intro[0] + i * 0.18;
            const k = seg(t, [a, a + 0.9], E.out4);
            gsap.set(el, { y: (1 - k) * 60, opacity: k });
          });
        };

        const refresh = () => {
          L = computeLayout(stage);
          render(proxy.p);
        };

        const proxy = { p: 0 };
        render(0);
        const tween = gsap.to(proxy, {
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
          tween.scrollTrigger?.kill();
          tween.kill();
          // kembalikan elemen Hero ke keadaan semula
          gsap.set([...heroLines, heroDesc, heroBust], { clearProps: 'opacity,y,yPercent' });
        };
      }
    );

    return () => mm.revert();
  }, []);

  const walker: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 15,
    pointerEvents: 'none',
    opacity: 0,
    visibility: 'hidden',
    willChange: 'transform',
  };
  const img: React.CSSProperties = { display: 'block', width: '100%', height: '100%', userSelect: 'none' };

  return (
    <div
      ref={stageRef}
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
    >
      <Hero />

      {/* Perosotan */}
      <img
        data-story="track"
        src="/assets/slide-track.webp"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 5,
          pointerEvents: 'none',
          opacity: 0,
          visibility: 'hidden',
          willChange: 'transform',
        }}
      />

      {/* Karakter: berdiri → lompat → duduk (meluncur) → lompat → berdiri */}
      <div data-story="stand" style={{ ...walker, width: 933, height: 2092 }}>
        <img src="/assets/walker-stand.webp" alt="" draggable={false} style={img} />
      </div>
      <div data-story="jump" style={{ ...walker, width: 1029, height: 2060 }}>
        <img src="/assets/walker-jump.webp" alt="" draggable={false} style={img} />
      </div>
      <div data-story="sit" style={{ ...walker, width: 521, height: 693 }}>
        <img src="/assets/walker-sit.webp" alt="" draggable={false} style={img} />
      </div>

      {/* Section perkenalan */}
      <div
        style={{
          position: 'absolute',
          right: '6vw',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 'min(44vw, 640px)',
          zIndex: 25,
          pointerEvents: 'none',
          color: THEME.text,
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <p
          data-intro="eyebrow"
          style={{
            margin: '0 0 1.2rem',
            opacity: 0,
            color: THEME.logoCoral,
            fontSize: 'clamp(0.85rem, 1.15vw, 1.05rem)',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {INTRO.eyebrow}
        </p>
        <h2
          data-intro="title"
          style={{
            margin: '0 0 1.6rem',
            opacity: 0,
            fontSize: 'clamp(2.2rem, 4.2vw, 4.2rem)',
            fontWeight: 450,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          {INTRO.title.map((line) => (
            <span key={line} style={{ display: 'block' }}>
              {line}
            </span>
          ))}
        </h2>
        <p
          data-intro="body"
          style={{
            margin: 0,
            opacity: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(0.95rem, 1.3vw, 1.2rem)',
            lineHeight: 1.7,
            color: THEME.descriptionText,
            maxWidth: '34em',
          }}
        >
          {INTRO.body}
        </p>
      </div>
    </div>
  );
}
