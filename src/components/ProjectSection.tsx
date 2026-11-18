import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { THEME } from '../config';

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════════════════════════
   PROJECT — karakter (tampak belakang) berdiri di tengah, dikelilingi kartu proyek yang
   melengkung seperti galeri 3D. Kartu menyebar dari belakang saat di-scroll.
   Konten: fairuzatikah.com (bagian proyek).
   ════════════════════════════════════════════════════════════════════════════ */

const TITLE = 'Thoughtfully crafted interfaces built for real users and real workflows.';

const PROJECTS = [
  {
    name: 'Buckstore',
    desc: 'A streetwear e-commerce concept designed to create a bold, clean, and immersive shopping experience.',
    img: '/assets/projects/buckstore.webp',
  },
  {
    name: 'Rayspeed Asia',
    desc: 'Designing a clearer and more efficient international package delivery experience for customers and operational workflows.',
    img: '/assets/projects/rayspeed.webp',
  },
  {
    name: 'Nashir',
    desc: 'A commerce platform built from scratch to simplify product sales, stock management, and business operations.',
    img: '/assets/projects/nashir.webp',
  },
  {
    name: 'Company Profile Tries',
    desc: 'A well-crafted company profile that reflects the brand identity and communicates services clearly.',
    img: '/assets/projects/compro-tries.webp',
  },
  {
    name: 'Jannah',
    desc: 'A mobile app designed to support daily worship and guide users through structured Hajj journeys.',
    img: '/assets/projects/jannah.webp',
  },
];

/* Kartu berdiri di satu lingkaran (setengah) dengan karakter sebagai pusat, semua menghadap ke
   karakter. Jarak antar tepi kartu yang bersebelahan = RING.gap; sudutnya dihitung dari situ. */
const RING = {
  radius: 0.56,     // jari-jari lingkaran (× lebar layar)
  forward: 0.1,     // seluruh lingkaran digeser mendekat (× jari-jari) supaya kartu tengah tidak terlalu kecil
  edge: 0.03,       // tepi luar kartu paling kiri/kanan = padding navbar (× lebar layar) — sejajar navbar
  gap: 8,           // jarak antar kartu (px)
  thick: 14,        // ketebalan kartu (px)
  titleTop: 0.05,   // jarak navbar → judul (× tinggi layar)
  charH: 0.48,      // tinggi karakter (× tinggi layar); kepalanya jadi batas bawah area kartu
  charBottom: -0.04,
  perspective: 1400,
};
// kartu persegi (1:1); lebarnya dihitung di layout() supaya tepi luar sejajar navbar
let cardW = 240;
const ringPos = (i: number, W: number, w = cardW) => {
  const R = RING.radius * W;
  const step = 2 * Math.asin(Math.min(1, (w + RING.gap) / (2 * R))); // sudut antar pusat kartu
  const a = (i - 2) * step;
  return { x: R * Math.sin(a), z: -R * Math.cos(a) + R * RING.forward, rot: (-a * 180) / Math.PI, a };
};
// lebar kartu supaya tepi luar kartu paling kanan (setelah perspektif) tepat di garis navbar
function fitCardWidth(W: number) {
  const target = W * (0.5 - RING.edge), P = RING.perspective;
  const edgeX = (w: number) => {
    const { x, z, a } = ringPos(4, W, w);
    const X = x + (w / 2) * Math.cos(a), Z = z + (w / 2) * Math.sin(a);
    return (X * P) / (P - Z);
  };
  let lo = 40, hi = W * 0.4;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (edgeX(m) < target) lo = m; else hi = m; }
  return lo;
}

const MIN_WIDTH = 900;
const SCROLL_LENGTH = '+=160%'; // panjang scroll section (kartu menyebar, lalu diam sebentar)

export default function ProjectSection() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(`(min-width: ${MIN_WIDTH}px) and (prefers-reduced-motion: no-preference)`, () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-project-card]', root);
      const char = root.querySelector<HTMLElement>('[data-project-char]');
      const charWrap = root.querySelector<HTMLElement>('[data-project-charwrap]');
      const title = root.querySelector<HTMLElement>('[data-project-title]');
      const titleWrap = title?.parentElement as HTMLElement;
      const persp = root.querySelector<HTMLElement>('[data-project-persp]')!;
      const stage = root.querySelector<HTMLElement>('[data-project-stage]')!;
      // kartu persegi selebar hasil fitCardWidth; diletakkan di TENGAH antara judul dan kepala
      // karakter. Titik pandang 3D setinggi tepi atas kartu → tepi atas semua kartu segaris.
      const layout = () => {
        const W = root.clientWidth, H = root.clientHeight;
        cardW = fitCardWidth(W);
        cards.forEach((c) => { c.style.width = `${cardW}px`; c.style.height = `${cardW}px`; });
        // judul di bawah navbar fixed (top 3.2vh + tinggi tombol clamp(2.4rem, 6vh, 3.4rem))
        const navBottom = 0.032 * H + Math.min(54.4, Math.max(38.4, 0.06 * H));
        const titleTop = navBottom + RING.titleTop * H;
        titleWrap.style.top = `${titleTop}px`;
        const titleBottom = titleTop + titleWrap.offsetHeight;
        let charTop = H * (1 - RING.charH - RING.charBottom);
        // tinggi kartu tengah SETELAH perspektif (dia paling jauh → tampak paling kecil)
        const zMid = ringPos(2, W).z;
        const hMid = cardW * (RING.perspective / (RING.perspective - zMid));
        // jarak minimum judul↔kartu & kartu↔kepala supaya tidak mepet
        const gapMin = Math.max(32, 0.06 * H);
        const top = Math.max(titleBottom + gapMin, (titleBottom + charTop) / 2 - hMid / 2);
        // layar pendek: kalau kartu jadi terlalu dekat kepala, karakter diturunkan (maks 22% layar)
        const push = Math.min(0.22 * H, Math.max(0, top + hMid + gapMin - charTop));
        charTop += push;
        if (charWrap) charWrap.style.bottom = `${RING.charBottom * H - push}px`;
        stage.style.top = `${top}px`;
        persp.style.perspectiveOrigin = `50% ${top}px`;
      };
      layout();
      // posisi awal: semua kartu bertumpuk jauh di belakang tengah, tak terlihat
      cards.forEach((c) => gsap.set(c, { xPercent: -50, yPercent: 0, x: 0, z: -900, rotationY: 0, opacity: 0 }));
      gsap.set(char, { yPercent: 35, opacity: 0 });
      gsap.set(title, { y: 30, opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: root, start: 'top top', end: SCROLL_LENGTH, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, onRefresh: layout },
      });
      tl.to(title, { y: 0, opacity: 1, duration: 0.5 }, 0)
        .to(char, { yPercent: 0, opacity: 1, duration: 0.8 }, 0.1);
      // kartu menyebar ke lengkungan: tengah dulu, lalu ke kiri-kanan berpasangan
      const order = [2, 1, 3, 0, 4];
      order.forEach((i, n) => {
        tl.to(cards[i], {
          x: () => ringPos(i, root.clientWidth).x,
          z: () => ringPos(i, root.clientWidth).z,
          rotationY: () => ringPos(i, root.clientWidth).rot,
          opacity: 1, duration: 0.9,
        }, 0.25 + n * 0.18);
      });
      tl.to({}, { duration: 0.6 }); // diam sebentar setelah semua kartu terpasang

      // karakter "hidup": napas (badan naik-turun dari kaki), goyang halus, condong ke arah kursor
      const breathe = root.querySelector<HTMLElement>('[data-char-breathe]');
      const sway = root.querySelector<HTMLElement>('[data-char-sway]');
      const lean = root.querySelector<HTMLElement>('[data-char-lean]');
      gsap.to(breathe, { scaleY: 1.012, scaleX: 0.996, transformOrigin: '50% 100%', duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to(sway, { rotation: 0.7, transformOrigin: '50% 100%', duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.set(sway, { rotation: -0.7 });
      const onMove = (e: MouseEvent) => {
        const r = root.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width - 0.5;
        gsap.to(lean, { x: mx * 26, rotation: mx * 2.2, transformOrigin: '50% 100%', duration: 0.9, ease: 'power2.out' });
      };
      const onLeave = () => gsap.to(lean, { x: 0, rotation: 0, duration: 1.2, ease: 'power2.out' });
      root.addEventListener('mousemove', onMove);
      root.addEventListener('mouseleave', onLeave);
      return () => { root.removeEventListener('mousemove', onMove); root.removeEventListener('mouseleave', onLeave); };
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      id="project"
      ref={rootRef}
      style={{
        position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden',
        background: THEME.pageBg, color: THEME.text, fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ position: 'absolute', top: '7vh', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 3 }}>{/* top diatur layout() */}
        <h2
          data-project-title
          style={{
            width: 'min(90vw, 1200px)', margin: 0, textAlign: 'center', fontWeight: 400, lineHeight: 1.25,
            letterSpacing: '-0.01em', fontSize: 'clamp(1.2rem, min(2.3vw, 4.6vh), 2.4rem)',
          }}
        >
          {TITLE}
        </h2>
      </div>

      {/* panggung 3D: kamera sedikit dari atas (perspectiveOrigin tinggi) seperti referensi */}
      <div data-project-persp style={{ position: 'absolute', inset: 0, perspective: `${RING.perspective}px`, perspectiveOrigin: '50% 20%' }}>
        <div data-project-stage style={{ position: 'absolute', left: '50%', top: '20%', transformStyle: 'preserve-3d' }}>
          {PROJECTS.map((p) => (
            <article
              key={p.name}
              data-project-card
              style={{
                position: 'absolute', left: 0, top: 0, width: '18vw', height: '18vw', // ukuran pasti diatur layout()
                transformStyle: 'preserve-3d', willChange: 'transform, opacity',
              }}
              onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.04, duration: 0.35, ease: 'power2.out' })}
              onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.35, ease: 'power2.out' })}
            >
              {/* tebal kartu: sisi kiri & kanan (lempengan 3D) */}
              {[0, 1].map((side) => (
                <span
                  key={side}
                  aria-hidden
                  style={{
                    position: 'absolute', top: 6, bottom: 6, width: RING.thick,
                    [side ? 'right' : 'left']: 0,
                    transformOrigin: side ? 'right center' : 'left center',
                    transform: `rotateY(${side ? -90 : 90}deg)`,
                    background: 'linear-gradient(180deg, #ebe6e2, #d9d2cd)', borderRadius: 4,
                  }}
                />
              ))}
              {/* muka kartu */}
              <div
                style={{
                  position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
                  background: '#fdfcfb', borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 24px 50px rgba(60, 40, 40, 0.16), inset 0 0 0 1px rgba(0,0,0,0.04)',
                }}
              >
                {/* bilah browser kecil */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '12px 14px 10px' }}>
                  {[0, 1, 2].map((d) => <span key={d} style={{ width: 7, height: 7, borderRadius: 4, background: 'rgba(33,33,33,0.28)' }} />)}
                  <span style={{ marginLeft: 'auto', width: 14, height: 2, borderRadius: 1, background: 'rgba(33,33,33,0.2)', boxShadow: '0 4px 0 rgba(33,33,33,0.2)' }} />
                </div>
                <div style={{ margin: '0 12px', borderRadius: 10, overflow: 'hidden', flex: '1 1 auto', minHeight: 0, background: '#eef0f4' }}>
                  <img src={p.img} alt={p.name} loading="lazy" draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
                </div>
                <div style={{ padding: '12px 16px 14px', flex: '0 0 auto' }}>
                  <h3 style={{ margin: 0, fontSize: 'clamp(0.95rem, 1.2vw, 1.2rem)', fontWeight: 600 }}>{p.name}</h3>
                  <p style={{
                    margin: '6px 0 0', fontSize: 'clamp(0.7rem, 0.85vw, 0.85rem)', lineHeight: 1.5, color: 'rgba(33,33,33,0.72)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* karakter tampak belakang, di depan kartu */}
      <div data-project-charwrap style={{ position: 'absolute', left: 0, right: 0, bottom: `${RING.charBottom * 100}vh`, display: 'flex', justifyContent: 'center', zIndex: 4, pointerEvents: 'none' }}>
        {/* lapisan: muncul saat scroll → condong ke kursor → goyang → napas */}
        <div data-project-char>
          <div data-char-lean>
            <div data-char-sway>
              <img
                data-char-breathe
                src="/assets/char-back.webp"
                alt=""
                aria-hidden
                draggable={false}
                style={{ display: 'block', height: `${RING.charH * 100}vh`, filter: 'drop-shadow(0 18px 24px rgba(60,40,40,0.12))' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
