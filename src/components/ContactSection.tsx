import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOBILE_ANIM_MQ, THEME } from '../config';
import { FRAMES } from './frames';
import { drawIris, drawLid, drawSparkle, startBlinking } from './eyeFx';

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════════════════════════
   CONTACT — karakter menghadap depan (tangan terbuka mengarah ke teks) di kiri,
   teks ajakan dari fairuzatikah.com di kanan. Karakter "hidup": kedip, kilau mata,
   napas, sedikit bergoyang, dan condong mengikuti kursor.
   ════════════════════════════════════════════════════════════════════════════ */

const CONTENT = {
  title: ['Got a complex problem?', "Let's simplify it together."],
  desc: "I'm always open to discussing product design work or partnership opportunities.",
  email: 'fairuz.design22@gmail.com',
  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/fairuzatikah/' },
    { label: 'Dribbble', href: 'https://dribbble.com/fairuz_atikah' },
    { label: 'Upwork', href: 'https://www.upwork.com/freelancers/~013c299f81c267a6ae' },
    { label: 'Instagram', href: 'https://www.instagram.com/ur.dsgnr/' },
  ],
};

const CHAR = {
  height: 0.86,   // tinggi karakter (× tinggi section)
  centerX: 0.3,   // posisi tengah karakter (× lebar layar)
  bottom: -0.02,  // kaki sedikit di bawah tepi bawah
};
const FRAME = FRAMES.stand[0];

const Arrow = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 18L18 6M18 15V6H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ContactSection() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── gambar karakter + mata (kedip/kilau) di canvas ──
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const img = new Image();
    img.src = FRAME.src;
    let lid = 0;
    const render = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!img.complete || !img.naturalWidth) return;
      const k = (h * dpr) / FRAME.h;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, FRAME.w, FRAME.h);
      for (const e of FRAME.eyes) {
        drawIris(ctx, e);
        drawSparkle(ctx, e, false);
        drawLid(ctx, e, lid);
      }
    };
    img.onload = render;
    const stop = startBlinking((v) => { lid = v; render(); });
    const ro = new ResizeObserver(render);
    ro.observe(canvas);
    render();
    return () => { stop(); ro.disconnect(); };
  }, []);

  // ── animasi masuk + hidup (napas, goyang, condong ke kursor) ──
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      gsap.to('[data-contact-breathe]', { scaleY: 1.012, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 100%' });
      gsap.fromTo('[data-contact-sway]', { rotation: -0.6 }, { rotation: 0.6, duration: 2.65, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 100%' });

      const leanX = gsap.quickTo('[data-contact-lean]', 'x', { duration: 0.9, ease: 'power3.out' });
      const leanR = gsap.quickTo('[data-contact-lean]', 'rotation', { duration: 0.9, ease: 'power3.out' });
      gsap.set('[data-contact-lean]', { transformOrigin: '50% 100%' });
      const onMove = (e: MouseEvent) => {
        const r = root.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const mx = (e.clientX / window.innerWidth) * 2 - 1;
        leanX(mx * 18);
        leanR(mx * 1.6);
      };
      window.addEventListener('mousemove', onMove, { passive: true });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: 'top 65%', toggleActions: 'play none none reverse' },
      });
      tl.fromTo('[data-contact-char]', { yPercent: 14, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.3, ease: 'power4.out' }, 0)
        .fromTo('[data-contact-line]', { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.1 }, 0.15)
        .fromTo('[data-contact-fade]', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 0.4);

      // mobile: karakter naik pelan (parallax) saat section masuk layar
      const mm = gsap.matchMedia();
      mm.add(MOBILE_ANIM_MQ, () => {
        gsap.fromTo('[data-contact-lean]', { y: 140 }, {
          y: 0, ease: 'none', scrollTrigger: { trigger: '.contact-char', start: 'top bottom', end: 'bottom bottom', scrub: 0.5 },
        });
      });

      return () => { window.removeEventListener('mousemove', onMove); mm.revert(); };
    }, root);
    return () => ctx.revert();
  }, []);

  const charH = `${CHAR.height * 100}vh`;
  const charW = `calc(${CHAR.height * 100}vh * ${FRAME.w / FRAME.h})`;

  return (
    <section
      id="contact"
      ref={rootRef}
      className="contact-section"
      style={{
        position: 'relative', width: '100vw', height: '100vh', minHeight: 560, overflow: 'hidden',
        background: THEME.pageBg, color: THEME.text,
      }}
    >
      <style>{`
        .contact-social { color: ${THEME.text}; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 18px; border-radius: 9999px; border: 1.5px solid rgba(33,33,33,0.18); transition: border-color .2s, color .2s, background .2s; }
        .contact-social:hover { border-color: ${THEME.buttonBg}; color: ${THEME.logoCoral}; }
        .contact-cta { transition: transform .2s, box-shadow .2s; }
        .contact-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(220, 99, 65, 0.35) !important; }
        @media (max-width: 899px), (max-aspect-ratio: 6/5), (prefers-reduced-motion: reduce) {
          .contact-section { height: auto !important; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding-top: 14vh; padding-bottom: 6vh; }
          .contact-section .contact-char { position: relative !important; left: auto !important; bottom: auto !important; transform: none !important; height: 60vh !important; width: auto !important; }
          .contact-section .contact-char canvas { height: 60vh !important; width: calc(60vh * ${FRAME.w / FRAME.h}) !important; }
          .contact-section .contact-text { position: relative !important; right: auto !important; top: auto !important; transform: none !important; width: auto !important; padding: 0 6vw; }
          .contact-section .contact-text { order: 1; }
          .contact-section .contact-char { order: 2; margin-top: 4vh; }
          .contact-section .contact-copy { order: 3; position: absolute !important; right: 0 !important; left: 0; text-align: center; bottom: 2vh !important; z-index: 4; }
        }
      `}</style>

      {/* karakter */}
      <div
        className="contact-char"
        style={{
          position: 'absolute', left: `${CHAR.centerX * 100}vw`, bottom: `${CHAR.bottom * 100}vh`,
          transform: 'translateX(-50%)', height: charH, width: charW, zIndex: 2, pointerEvents: 'none',
        }}
      >
        <div data-contact-char style={{ width: '100%', height: '100%' }}>
          <div data-contact-lean style={{ width: '100%', height: '100%' }}>
            <div data-contact-sway style={{ width: '100%', height: '100%' }}>
              <div data-contact-breathe style={{ width: '100%', height: '100%' }}>
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="Faiz, karakter 3D, mengajak menghubungi"
                  style={{ display: 'block', width: '100%', height: '100%', filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.12))' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* teks di kanan, tepi kanan sejajar navbar */}
      <div
        className="contact-text"
        style={{
          position: 'absolute', right: '3vw', top: '50%', transform: 'translateY(-50%)',
          width: 'min(46vw, 780px)', zIndex: 3,
        }}
      >
        <h2
          style={{
            margin: 0, fontFamily: "'Montserrat', sans-serif", fontWeight: 500,
            fontSize: 'clamp(1.8rem, min(3.3vw, 6.4vh), 3.4rem)', lineHeight: 1.12, letterSpacing: '-0.02em',
          }}
        >
          {CONTENT.title.map((line, i) => (
            <span key={line} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}>
              <span data-contact-line style={{ display: 'block', color: i === 1 ? THEME.logoCoral : undefined }}>{line}</span>
            </span>
          ))}
        </h2>
        <p
          data-contact-fade
          style={{
            margin: '2.4vh 0 0', fontFamily: "'Inter', sans-serif", fontSize: 'clamp(1rem, 1.35vw, 1.3rem)',
            lineHeight: 1.6, color: 'rgba(33,33,33,0.72)', maxWidth: 520,
          }}
        >
          {CONTENT.desc}
        </p>
        <div data-contact-fade style={{ marginTop: '4vh' }}>
          <a
            href={`mailto:${CONTENT.email}`}
            className="contact-cta"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, background: THEME.buttonBg, color: THEME.buttonText,
              fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: 'clamp(1rem, 1.3vw, 1.2rem)',
              height: 'clamp(3rem, 7vh, 3.8rem)', padding: '0 clamp(1.6rem, 2.4vw, 2.4rem)', borderRadius: 9999,
              textDecoration: 'none', boxShadow: '0 2px 12px rgba(220, 99, 65, 0.2)',
            }}
          >
            Say Hello <Arrow />
          </a>
        </div>
        <div data-contact-fade style={{ marginTop: '4.5vh', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {CONTENT.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="contact-social"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(0.85rem, 1vw, 1rem)', fontWeight: 500 }}>
              {s.label} <Arrow size={13} />
            </a>
          ))}
        </div>
      </div>

      <p
        className="contact-copy"
        style={{
          position: 'absolute', right: '3vw', bottom: '3vh', margin: 0, zIndex: 3,
          fontFamily: "'Inter', sans-serif", fontSize: 'clamp(0.75rem, 0.9vw, 0.9rem)', color: 'rgba(33,33,33,0.5)',
        }}
      >
        © {new Date().getFullYear()} Faiz. All Rights Reserved.
      </p>
    </section>
  );
}
