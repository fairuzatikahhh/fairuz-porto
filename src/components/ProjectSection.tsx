import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DESKTOP_MQ, MOBILE_ANIM_MQ, THEME } from '../config';

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

const SCROLL_LENGTH = '+=160%'; // panjang scroll section (kartu menyebar, lalu diam sebentar)

export default function ProjectSection() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(DESKTOP_MQ, () => {
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

    // ── Mobile: section dipin, scroll ke bawah menggeser deretan kartu ke samping ──
    // kartu sedikit berputar & mengecil saat menjauh dari tengah; karakter menoleh mengikuti
    mm.add(MOBILE_ANIM_MQ, () => {
      root.classList.add('is-hscroll');
      const stage = root.querySelector<HTMLElement>('[data-project-stage]')!;
      const cards = gsap.utils.toArray<HTMLElement>('[data-project-card]', root);
      const lean = root.querySelector<HTMLElement>('[data-char-lean]');
      const breathe = root.querySelector<HTMLElement>('[data-char-breathe]');
      const sway = root.querySelector<HTMLElement>('[data-char-sway]');
      gsap.to(breathe, { scaleY: 1.012, scaleX: 0.996, transformOrigin: '50% 100%', duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.fromTo(sway, { rotation: -0.7 }, { rotation: 0.7, transformOrigin: '50% 100%', duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      // ukuran kartu: sebesar mungkin, tapi tepi bawahnya tetap di atas kepala karakter
      const charImg = root.querySelector<HTMLElement>('[data-char-breathe]')!;
      // layar pendek: ruang di bawah judul dibagi antara kartu & karakter (karakter boleh mengecil),
      // kartu kecil → deskripsi disembunyikan supaya gambar proyek tetap terlihat
      const sizeCards = () => {
        root.style.removeProperty('--m-card');
        root.style.removeProperty('--m-char');
        const rr = root.getBoundingClientRect(), H = rr.height;
        const cardTop = stage.getBoundingClientRect().top - rr.top + parseFloat(getComputedStyle(stage).paddingTop); // tanpa skala kartu
        const room = H - cardTop - 18; // ruang untuk kartu + karakter yang terlihat
        const max = Math.min(root.clientWidth * 0.78, 420);
        let charH = charImg.offsetHeight;
        let card = Math.min(max, room - charH * 0.97); // charwrap: bottom -3vh ≈ 3% gambar di bawah layar
        if (card < max) {
          card = Math.min(max, Math.max(room - charH * 0.97, room * 0.56));
          charH = Math.max(0.2 * H, (room - card) / 0.97);
          root.style.setProperty('--m-char', `${Math.round(charH)}px`);
          card = Math.min(card, room - charH * 0.97);
        }
        root.style.setProperty('--m-card', `${Math.round(card)}px`);
        root.classList.toggle('is-compact', card < 250);
      };
      sizeCards();
      const dist = () => Math.max(0, stage.scrollWidth - root.clientWidth);
      const tiltCards = () => {
        const cx = root.clientWidth / 2;
        cards.forEach((c) => {
          const r = c.getBoundingClientRect();
          const d = (r.left + r.width / 2 - cx) / root.clientWidth; // -1 … 1
          gsap.set(c, { rotationY: -d * 28, scale: 1 - Math.min(0.12, Math.abs(d) * 0.14), transformOrigin: '50% 50%' });
        });
      };
      const tw = gsap.to(stage, {
        x: () => -dist(), ease: 'none',
        onUpdate() {
          tiltCards();
          const k = this.progress() - 0.5;
          gsap.set(lean, { x: k * 36, rotation: k * 3, transformOrigin: '50% 100%' });
        },
        scrollTrigger: {
          trigger: root, start: 'top top', end: () => `+=${dist() * 1.3}`, pin: true, scrub: 0.5,
          invalidateOnRefresh: true, onRefreshInit: sizeCards, onRefresh: tiltCards,
        },
      });
      tiltCards();

      // geser kiri/kanan (jari atau mouse) juga menggerakkan deretan kartu: diterjemahkan ke posisi
      // scroll di dalam rentang pin (scroll & kartu tetap sinkron), lalu berhenti di kartu terdekat
      const st = tw.scrollTrigger!;
      const scrollFor = (x: number) => st.start + (Math.min(dist(), Math.max(0, x)) / (dist() || 1)) * (st.end - st.start);
      const cardX = (c: HTMLElement) => c.offsetLeft + c.offsetWidth / 2 - root.clientWidth / 2; // geseran supaya kartu di tengah
      let snapTw: gsap.core.Tween | null = null;
      const snapTo = (y: number) => {
        const from = { y: window.scrollY };
        snapTw = gsap.to(from, { y, duration: 0.55, ease: 'power3.out', onUpdate: () => window.scrollTo(0, from.y) });
      };
      let drag: { x: number; y: number; s: number; axis: '' | 'x' | 'y'; id: number } | null = null;
      const onDown = (e: PointerEvent) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        snapTw?.kill();
        drag = { x: e.clientX, y: e.clientY, s: window.scrollY, axis: '', id: e.pointerId };
      };
      const onMove = (e: PointerEvent) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.axis) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          if (drag.axis === 'x') stage.setPointerCapture(e.pointerId);
        }
        if (drag.axis !== 'x') return;
        const ratio = (st.end - st.start) / (dist() || 1);
        window.scrollTo(0, Math.min(st.end, Math.max(st.start, drag.s - dx * ratio)));
      };
      const onUp = (e: PointerEvent) => {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        if (d.axis !== 'x') return;
        const dx = e.clientX - d.x;
        // kartu yang paling dekat ke tengah; sentakan cepat → maju/mundur satu kartu
        const nowX = (window.scrollY - st.start) / (st.end - st.start || 1) * dist();
        const xs = cards.map(cardX);
        let i = xs.reduce((best, x, k) => (Math.abs(x - nowX) < Math.abs(xs[best] - nowX) ? k : best), 0);
        const startX = (d.s - st.start) / (st.end - st.start || 1) * dist();
        const startI = xs.reduce((best, x, k) => (Math.abs(x - startX) < Math.abs(xs[best] - startX) ? k : best), 0);
        if (i === startI && Math.abs(dx) > 40) i = Math.min(cards.length - 1, Math.max(0, startI + (dx < 0 ? 1 : -1)));
        snapTo(scrollFor(xs[i]));
      };
      stage.style.touchAction = 'pan-y';
      stage.addEventListener('pointerdown', onDown);
      stage.addEventListener('pointermove', onMove);
      stage.addEventListener('pointerup', onUp);
      stage.addEventListener('pointercancel', onUp);
      stage.addEventListener('dragstart', (e) => e.preventDefault());

      const titleTw = gsap.fromTo('[data-project-title]', { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top 90%', end: 'top 30%', scrub: 0.5 },
      });
      return () => {
        tw.scrollTrigger?.kill(); tw.kill();
        titleTw.scrollTrigger?.kill(); titleTw.kill();
        stage.removeEventListener('pointerdown', onDown);
        stage.removeEventListener('pointermove', onMove);
        stage.removeEventListener('pointerup', onUp);
        stage.removeEventListener('pointercancel', onUp);
        stage.style.touchAction = '';
        root.classList.remove('is-hscroll', 'is-compact');
        root.style.removeProperty('--m-card');
        root.style.removeProperty('--m-char');
        gsap.set([stage, ...cards, lean, breathe, sway, '[data-project-title]'], { clearProps: 'transform,opacity' });
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      id="project"
      ref={rootRef}
      className="project-section"
      style={{
        position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden',
        background: THEME.pageBg, color: THEME.text, fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="project-title-wrap" style={{ position: 'absolute', top: '7vh', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 3 }}>{/* top diatur layout() */}
        <h2
          data-project-title
          style={{
            width: 'min(90vw, 1560px)', margin: 0, textAlign: 'center', fontWeight: 400, lineHeight: 1.25,
            letterSpacing: '-0.01em', fontSize: 'clamp(1.2rem, min(2.3vw, 4.6vh), 2.4rem)',
          }}
        >
          {TITLE}
        </h2>
      </div>

      {/* panggung 3D: kamera sedikit dari atas (perspectiveOrigin tinggi) seperti referensi */}
      <div data-project-persp className="project-persp" style={{ position: 'absolute', inset: 0, perspective: `${RING.perspective}px`, perspectiveOrigin: '50% 20%' }}>
        <div data-project-stage className="project-stage" style={{ position: 'absolute', left: '50%', top: '20%', transformStyle: 'preserve-3d' }}>
          {PROJECTS.map((p) => (
            <article
              key={p.name}
              data-project-card
              className="project-card"
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
                  className="project-card-edge"
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
      <div data-project-charwrap className="project-charwrap" style={{ position: 'absolute', left: 0, right: 0, bottom: `${RING.charBottom * 100}vh`, display: 'flex', justifyContent: 'center', zIndex: 4, pointerEvents: 'none' }}>
        {/* lapisan: muncul saat scroll → condong ke kursor → goyang → napas */}
        <div data-project-char>
          <div data-char-lean>
            <div data-char-sway>
              <img
                data-char-breathe
                className="project-char-img"
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
