import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { THEME } from '../config';
import { PROJECT_DETAILS, type ProjectDetail as Detail } from '../projectDetails';
import { FRAMES, type Frame } from './frames';
import LiveChar from './LiveChar';
import ProcessCarousel from './ProcessCarousel';

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════════════════════════
   Halaman detail project (/project/<slug>) — desain ulang dari website lama dengan gaya
   portfolio baru: latar terang #DAD8D6, Montserrat + Inter, aksen coral, teks & gambar
   muncul mengikuti scroll, karakter 3D di bagian refleksi.
   ════════════════════════════════════════════════════════════════════════════ */

const STAND = FRAMES.stand[0] as Frame;
const pad2 = (n: number) => String(n).padStart(2, '0');

const ArrowUpRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 18L18 6M18 15V6H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ProjectDetail({ project }: { project: Detail }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const idx = PROJECT_DETAILS.findIndex((p) => p.slug === project.slug);
  const next = PROJECT_DETAILS[(idx + 1) % PROJECT_DETAILS.length];
  const isMobileApp = project.platform === 'Mobile App';

  useLayoutEffect(() => {
    document.title = `${project.name} — Faiz`;
    window.scrollTo(0, 0);
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // hero: nama & teks naik satu per satu, mockup muncul lalu bergerak pelan saat di-scroll
      gsap.fromTo('[data-pd-hero-line]', { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.08, delay: 0.15 });
      gsap.fromTo('[data-pd-hero-fade]', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.4 });
      gsap.fromTo('[data-pd-hero-img]', { y: 60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 1.4, ease: 'power4.out', delay: 0.25 });

      // pesawat (ilustrasi 3D): muncul di bawah mockup, lalu saat di-scroll terbang turun dan
      // mendarat di tepi atas gambar overview
      const prop = root.querySelector<HTMLElement>('[data-pd-prop]');
      const land = root.querySelector<HTMLElement>('[data-pd-land]');
      if (prop && land) {
        gsap.fromTo(prop, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.6 });
        const at = (el: HTMLElement) => {
          const r = el.getBoundingClientRect(), rr = root.getBoundingClientRect();
          return { x: r.left - rr.left, y: r.top - rr.top, w: r.width, h: r.height };
        };
        let start = at(prop), end = { x: 0, y: 0, s: 1 };
        const measure = () => {
          gsap.set(prop, { x: 0, y: 0, rotation: 0, scale: 1 });
          start = at(prop);
          const img = at(land.querySelector<HTMLElement>('img') ?? land); // foto sebenarnya (bukan kolomnya)
          const s = Math.min(1, (img.w * 0.42) / start.w); // di atas foto: ±40% lebar foto
          // roda di tepi atas foto, agak ke kanan
          end = { x: img.x + img.w * 0.72 - (start.w * s) / 2 - start.x, y: img.y - start.h * s * 0.78 - start.y, s };
        };
        measure();
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '[data-pd-hero]', start: 'top top', endTrigger: land, end: 'top 45%', scrub: 0.8,
            invalidateOnRefresh: true, onRefreshInit: measure,
          },
        });
        tl.to(prop, { x: () => end.x, ease: 'power1.inOut', duration: 1 }, 0)
          .to(prop, { y: () => end.y, ease: 'power2.in', duration: 1 }, 0)
          .to(prop, { scale: () => end.s, ease: 'none', duration: 1 }, 0)
          .to(prop, { rotation: -12, ease: 'sine.out', duration: 0.45 }, 0)  // hidung turun (pesawat menghadap kiri)
          .to(prop, { rotation: 0, ease: 'sine.inOut', duration: 0.35 }, 0.65) // mendatar saat mendarat
          .to(prop, { opacity: 0, scale: () => end.s * 0.6, ease: 'power2.in', duration: 0.18 }, 0.84); // masuk ke foto, lalu hilang
        // sedikit melayang naik-turun selama di udara
        gsap.to(prop.firstElementChild, { y: -8, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      }
      // isi halaman: tiap blok naik & muncul saat masuk layar
      gsap.set('[data-pd-reveal]', { opacity: 0 });
      ScrollTrigger.batch('[data-pd-reveal]', {
        start: 'top 88%',
        onEnter: (els) => gsap.fromTo(els, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }),
      });
      // gambar besar: parallax halus
      gsap.utils.toArray<HTMLElement>('[data-pd-parallax]').forEach((el) => {
        gsap.fromTo(el, { yPercent: 6 }, {
          yPercent: -6, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
        });
      });
    }, root);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, [project]);

  // teks kanan hero selebar nama project di kiri (mis. "RAYSPEED")
  useLayoutEffect(() => {
    const root = rootRef.current, name = root?.querySelector<HTMLElement>('.pd-name');
    if (!root || !name) return;
    const words = [...name.querySelectorAll<HTMLElement>('[data-pd-hero-line]')];
    // lebar kata terpanjang (offsetWidth: tidak terpengaruh transform animasi masuk)
    const sync = () => root.style.setProperty('--pd-name-w', `${Math.max(...words.map((w) => w.offsetWidth))}px`);
    sync();
    const ro = new ResizeObserver(sync);
    words.forEach((w) => ro.observe(w));
    return () => ro.disconnect();
  }, [project]);

  return (
    <div ref={rootRef} className="pd" style={{ background: THEME.pageBg, color: THEME.text, fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      <style>{CSS}</style>

      {/* ── Hero: nama di kiri-bawah, mockup tegak di tengah (+ ilustrasi 3D), judul & info di kanan-bawah ── */}
      <section data-pd-hero className="pd-hero">
        <a href="/#project" className="pd-back pd-hero-back" data-pd-hero-fade><ArrowLeft /> All projects</a>
        <div className={`pd-hero-media${isMobileApp ? ' is-phone' : ''}`}>
          <div className="pd-hero-frame">
            <img data-pd-hero-img src={project.heroFront} alt={`${project.name} mockup`} />
            {project.prop && (
              <div data-pd-prop className="pd-prop" aria-hidden>
                <img src={project.prop} alt="" />
              </div>
            )}
          </div>
        </div>
        <h1 className={`pd-name${project.name.length > 14 ? ' is-long' : Math.max(...project.name.split(' ').map((w) => w.length)) > 8 ? ' is-wide' : ''}`}>
          {project.name.split(' ').map((w, i) => (
            <span key={i} className="pd-line"><span data-pd-hero-line>{w}</span></span>
          ))}
        </h1>
        <div className="pd-hero-info" data-pd-hero-fade>
          <p className="pd-lead">{project.mainTitle}</p>
          <dl className="pd-meta">
            <div><dt>Role</dt><dd>UI/UX Designer</dd></div>
            <div><dt>Platform</dt><dd>{project.platform}</dd></div>
          </dl>
        </div>
      </section>

      {/* ── Overview ── */}
      <section className={`pd-section pd-overview${project.overview.image ? '' : ' no-media'}`}>
        {project.overview.image ? (
          <div className="pd-card-media" data-pd-land>
            <img src={project.overview.image} alt={`${project.name} overview`} data-pd-reveal />
          </div>
        ) : <span data-pd-land className="pd-land-fallback" aria-hidden />}
        <div data-pd-reveal>
          <h2 className="pd-h2">What it is</h2>
          <p className="pd-body">{project.overview.text}</p>
        </div>
      </section>

      {/* ── Goals ── */}
      <section className="pd-section">
        <div className="pd-center" data-pd-reveal>
          <p className="pd-label">02 — Goals</p>
          <h2 className="pd-h2">What we set out to do</h2>
          <p className="pd-body pd-narrow">{project.goals.text}</p>
        </div>
        <div className={`pd-goals${project.goals.image ? '' : ' no-media'}${isMobileApp ? ' is-phone' : ''}`}>
          {project.goals.items.map((g, i) => (
            <div key={g} className={`pd-goal pd-goal-${i}`} data-pd-reveal>
              <span className="pd-num">{pad2(i + 1)}</span>
              <p>{g}</p>
            </div>
          ))}
          {project.goals.image && (
            <div className="pd-goals-media" data-pd-reveal>
              <div className="pd-goals-media-in">
                <img src={project.goals.image} alt={`${project.name} goals`} loading="lazy" data-pd-parallax />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Proses: carousel seperti riwayat pekerjaan (karakter berjalan saat pindah langkah) ── */}
      <section className="pd-section pd-process-wrap">
        <ProcessCarousel label={project.process.title} steps={project.process.cards} />
      </section>

      {/* ── Refleksi / tantangan: karakter menunjuk ke teks ── */}
      <section className="pd-reflect">
        <div className="pd-reflect-char" data-pd-reveal>
          <LiveChar frame={STAND} height="100%" label="Faiz, karakter 3D" />
        </div>
        <div className="pd-reflect-body" data-pd-reveal>
          <h2 className="pd-reflect-title">{project.reflection.title}</h2>
          <p className="pd-reflect-text">{project.reflection.text}</p>
        </div>
      </section>

      {/* ── Hasil ── */}
      <section className="pd-section">
        <div className="pd-result">
          <div className="pd-center" data-pd-reveal>
            <h2 className="pd-h2">The Result</h2>
            <p className="pd-body pd-narrow">{project.result.text}</p>
          </div>
          {project.result.image && (
            <div className="pd-result-media" data-pd-reveal>
              <img src={project.result.image} alt={`${project.name} result`} loading="lazy" data-pd-parallax />
            </div>
          )}
        </div>
      </section>

      {/* ── Project berikutnya ── */}
      <section className="pd-section pd-next">
        <a href={`/project/${next.slug}`} className="pd-next-link" data-pd-reveal>
          <span className="pd-label">Next Project</span>
          <span className="pd-next-name">{next.name} <ArrowUpRight size={28} /></span>
          <img src={next.heroFront} alt="" aria-hidden loading="lazy" />
        </a>
        <div className="pd-foot">
          <a href="/#project" className="pd-back"><ArrowLeft /> Back to all projects</a>
          <span>© {new Date().getFullYear()} Faiz. All Rights Reserved.</span>
        </div>
      </section>
    </div>
  );
}

const CSS = `
.pd { --pad: 3vw; --coral: ${THEME.buttonBg}; --coral-d: ${THEME.logoCoral}; --card: rgba(255,255,255,0.55); }
.pd img { display: block; max-width: 100%; }
.pd-label { margin: 0 0 1rem; color: var(--coral-d); font-size: 0.8rem; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; }
.pd-eyebrow { margin: 0 0 1.2rem; color: var(--coral-d); font-size: 0.85rem; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; }
.pd-h2 { margin: 0 0 1.1rem; font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: clamp(1.8rem, 3.2vw, 3rem); line-height: 1.15; letter-spacing: -0.02em; }
.pd-body { margin: 0; font-size: clamp(1rem, 1.2vw, 1.15rem); line-height: 1.7; color: rgba(33,33,33,0.78); }
.pd-narrow { max-width: 640px; margin: 0 auto; }
.pd-center { text-align: center; }
/* semua section selebar layar dengan padding = padding navbar (3vw; HP 6vw) → tepi kiri & kanan lurus dengan navbar */
.pd-section { padding: clamp(72px, 12vh, 140px) var(--pad); }
.pd-back { display: inline-flex; align-items: center; gap: 8px; color: ${THEME.text}; text-decoration: none; font-size: 0.95rem; font-weight: 500; opacity: 0.75; transition: opacity .2s, color .2s; }
.pd-back:hover { opacity: 1; color: var(--coral-d); }

/* hero: susunan seperti hero halaman utama */
.pd-hero { position: relative; height: 100vh; min-height: 640px; max-width: none; margin: 0; padding: 0; }
.pd-hero-back { position: absolute; left: var(--pad); top: calc(3.2vh + 84px); z-index: 3; }
.pd-hero-media { position: absolute; left: 50%; top: calc(3.2vh + 96px); bottom: 7vh; transform: translateX(-50%);
  width: min(44vw, 792px); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1; }
.pd-hero-media.is-phone { width: min(33vw, 462px); }
/* mockup +10% dari ukuran sebelumnya (64vh / 60vh) */
.pd-hero-frame { position: relative; display: flex; justify-content: center; max-width: 100%; }
.pd-hero-frame > img { width: 100%; max-height: 70.4vh; object-fit: contain; filter: drop-shadow(0 30px 40px rgba(60,40,40,0.18)); }
.pd-hero-media.is-phone .pd-hero-frame > img { width: auto; max-height: 66vh; }
/* ilustrasi di kanan-bawah mockup: sisi bawahnya sejajar dengan sisi bawah mockup */
.pd-prop { --w: min(15vw, 230px); position: absolute; left: calc(100% - var(--w) * 0.35); bottom: 0; z-index: 4; width: var(--w); will-change: transform; pointer-events: none; }
.pd-prop img { width: 100%; transform: scaleX(-1); filter: drop-shadow(0 18px 18px rgba(40,90,120,0.22)); }
.pd-name { position: absolute; left: var(--pad); bottom: clamp(1.5rem, 3vh, 2.5rem); margin: 0; z-index: 2; max-width: 32vw;
  font-family: 'Montserrat', sans-serif; font-weight: 450; text-transform: uppercase;
  font-size: clamp(2.6rem, 6vw, 6.4rem); line-height: 1.06; letter-spacing: -0.02em; }
.pd-name.is-long { font-size: clamp(2.2rem, 4.2vw, 4.6rem); max-width: 34vw; } /* nama panjang: 3 baris, tidak menabrak mockup */
.pd-name.is-wide { font-size: clamp(2.4rem, 5vw, 5.4rem); } /* satu kata panjang (mis. Buckstore): muat tanpa terpotong */
.pd-line { display: block; overflow: hidden; padding-bottom: 0.04em; }
.pd-line > span { display: inline-block; }
/* teks kanan: ukuran sama dengan deskripsi di hero halaman utama ("I blend design thinking…") */
.pd-hero-info { position: absolute; right: var(--pad); bottom: clamp(1.5rem, 3vh, 2.5rem); width: var(--pd-name-w, clamp(240px, 26vw, 360px)); z-index: 2; }
.pd-lead { margin: 0 0 1.6rem; font-family: 'Inter', sans-serif; font-weight: 400; font-size: clamp(0.95rem, 1.8vw, 1.65rem);
  line-height: 1.65; letter-spacing: -0.01em; color: ${THEME.descriptionText}; }
.pd-meta { display: grid; grid-template-columns: auto auto; justify-content: start; gap: 0 2.6rem; margin: 0; }
.pd-meta dt { font-size: 0.8rem; color: rgba(33,33,33,0.5); margin-bottom: 0.3rem; }
.pd-meta dd { margin: 0; font-weight: 500; }

/* overview */
.pd-overview { display: grid; grid-template-columns: 1.25fr 1fr; gap: 5vw; align-items: center; }
.pd-land-fallback { display: none; }
.pd-overview.no-media { grid-template-columns: 1fr; }
.pd-card-media { display: flex; justify-content: flex-start; align-items: center; }
.pd-card-media img { width: auto; height: auto; max-width: 100%; max-height: 72vh; border-radius: 24px; filter: drop-shadow(0 24px 40px rgba(60,40,40,0.12)); }

/* goals: kartu di kiri & kanan gambar */
.pd-goals { margin-top: 13rem; margin-bottom: 6rem; /* gambar tengah jauh lebih tinggi dari kartu → beri ruang atas & bawah */ display: grid; grid-template-columns: 1fr minmax(0, 1.5fr) 1fr; grid-template-rows: auto auto; gap: 1.4rem 2.4rem; align-items: center; }
.pd-goals.is-phone { grid-template-columns: 1fr minmax(0, 0.8fr) 1fr; }
.pd-goals-media { grid-column: 2; grid-row: 1 / span 2; align-self: stretch; position: relative; min-height: 0; z-index: 0; }
/* gambar setinggi ±232% area kartu (kartu 01 atas → kartu 02 bawah; 120% → +15% → +20% → +40%), di tengah kolom */
.pd-goals-media-in { position: absolute; top: -66%; bottom: -66%; left: -50%; right: -50%; display: flex; justify-content: center; align-items: center; pointer-events: none; }
.pd-goals-media-in img { height: 100%; width: auto; max-width: none; filter: drop-shadow(0 24px 40px rgba(60,40,40,0.15)); }
.pd-goal { position: relative; z-index: 1; }
.pd-goal-0 { grid-column: 1; grid-row: 1; } .pd-goal-1 { grid-column: 1; grid-row: 2; }
.pd-goal-2 { grid-column: 3; grid-row: 1; } .pd-goal-3 { grid-column: 3; grid-row: 2; }
.pd-goals.no-media { grid-template-columns: 1fr 1fr; }
.pd-goals.no-media .pd-goal { grid-column: auto; grid-row: auto; }
.pd-goal { background: var(--card); border: 1px solid rgba(255,255,255,0.6); border-radius: 22px; padding: 1.5rem 1.6rem;
  box-shadow: 0 14px 34px rgba(60,40,40,0.08); transition: transform .3s ease, box-shadow .3s ease; }
.pd-goal:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(60,40,40,0.12); }
.pd-goal p { margin: 0.6rem 0 0; font-size: clamp(1.1rem, 1.25vw, 1.25rem); line-height: 1.5; }
.pd-num { font-family: 'Montserrat', sans-serif; font-weight: 500; color: var(--coral-d); font-size: 1.05rem; }

/* proses: carousel seperti riwayat pekerjaan */
.pd-process-wrap { height: 100vh; display: flex; flex-direction: column; justify-content: center; padding-top: calc(3.2vh + 84px); padding-bottom: 3vh; }
.pc { position: relative; outline: none; user-select: none; }
.pc > :not(.pc-canvas) { position: relative; z-index: 1; }
.pc-label { margin: 0 0 0.6rem; text-align: center; font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 28px; line-height: 1.2; color: ${THEME.text}; }
.pc-row { display: grid; grid-template-columns: 1fr minmax(260px, 0.9fr) 1fr; align-items: center; gap: 3vw; }
.pc-stage { position: relative; height: calc(100vh - 3.2vh - 84px - 3vh - 28px * 1.2 - 0.6rem - 10px - 1.4rem - 8px); }
.pc-canvas { position: absolute; inset: 0; display: block; z-index: 0; pointer-events: none; }
.pc-num { display: block; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif; font-weight: 500; color: var(--coral-d); }
.pc-title { margin: 0; font-family: 'Inter', sans-serif; font-weight: 400; font-size: clamp(1.8rem, min(3.4vw, 6.4vh), 3.4rem); line-height: 1.15; letter-spacing: -0.01em; }
.pc-desc { margin: 0; font-size: clamp(0.95rem, 1.3vw, 1.2rem); line-height: 1.65; color: ${THEME.descriptionText}; }
.pc-dots { display: flex; justify-content: center; gap: 10px; margin-top: 1.4rem; }
.pc-dots button { height: 10px; border: 0; padding: 0; border-radius: 5px; cursor: pointer; transition: width .35s ease, background .35s ease; }
.pc-swap { animation: pc-in .55s cubic-bezier(.2,.8,.2,1) both; }
.pc-left, .pc-right { transition: opacity .35s ease; }
.pc.is-switching .pc-left, .pc.is-switching .pc-right { opacity: 0; }
@keyframes pc-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

/* refleksi */
/* sama seperti perkenalan di halaman utama: karakter besar di kiri, teks di kanan (lurus navbar) */
.pd-reflect { position: relative; height: 100vh; min-height: 640px; display: flex; align-items: center; justify-content: flex-end;
  padding: calc(3.2vh + 84px) var(--pad) 0; }
.pd-reflect-char { position: absolute; left: var(--pad); bottom: 1.5vh; height: 83vh; z-index: 0; }
.pd-reflect-body { position: relative; z-index: 1; width: min(54vw, 820px); margin-top: 6vh; }
.pd-reflect-title { margin: 0 0 1.1em; max-width: 12em; font-family: 'Inter', sans-serif; font-weight: 400;
  font-size: clamp(1.6rem, min(3.3vw, 6vh), 3.4rem); line-height: 1.32; letter-spacing: -0.01em; }
.pd-reflect-text { margin: 0; font-size: clamp(0.85rem, min(1.2vw, 2.5vh), 1.15rem); line-height: 1.6; color: ${THEME.descriptionText}; }

/* hasil */
.pd-result { background: rgba(255,255,255,0.4); border-radius: 40px; padding: clamp(56px, 9vh, 96px) var(--pad) 0; overflow: hidden; }
.pd-result-media { margin-top: 3.5rem; display: flex; justify-content: center; }
.pd-result-media img { width: 92%; max-width: 1100px; filter: drop-shadow(0 24px 40px rgba(60,40,40,0.15)); }

/* berikutnya */
.pd-next { padding-bottom: 4vh; }
.pd-next-link { position: relative; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 1rem 3vw; padding: 3rem 0;
  border-top: 1px solid rgba(33,33,33,0.15); border-bottom: 1px solid rgba(33,33,33,0.15); color: ${THEME.text}; text-decoration: none; }
.pd-next-link .pd-label { grid-column: 1 / -1; margin: 0; }
.pd-next-name { display: inline-flex; align-items: center; gap: 0.5em; font-family: 'Montserrat', sans-serif; font-weight: 450; text-transform: uppercase;
  font-size: clamp(2rem, 5.4vw, 5.2rem); line-height: 1.05; letter-spacing: -0.02em; transition: color .3s; }
.pd-next-link img { height: clamp(110px, 18vw, 230px); width: auto; object-fit: contain; transition: transform .5s cubic-bezier(.2,.8,.2,1); }
.pd-next-link:hover .pd-next-name { color: var(--coral-d); }
.pd-next-link:hover img { transform: translateY(-8px) rotate(-2deg); }
.pd-foot { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding-top: 2.4rem;
  font-size: 0.9rem; color: rgba(33,33,33,0.55); }

/* HP & tablet */
@media (max-width: 899px), (max-aspect-ratio: 6/5) {
  .pd { --pad: 6vw; }
  .pd-hero { height: auto; min-height: 0; display: flex; flex-direction: column; padding: 96px var(--pad) 6vh; }
  .pd-hero-back { position: static; margin-bottom: 3vh; }
  .pd-hero-media, .pd-hero-media.is-phone { position: relative; left: auto; top: auto; bottom: auto; transform: none; width: 100%; }
  .pd-hero-frame > img, .pd-hero-media.is-phone .pd-hero-frame > img { max-height: 57vh; }
  .pd-prop { --w: min(32vw, 160px); left: auto; right: -4vw; }
  .pd-name { position: static; max-width: none; margin-top: 4vh; font-size: clamp(2.4rem, 12vw, 5rem); }
  .pd-hero-info { position: static; width: auto; margin-top: 2.4vh; }
  .pd-overview { grid-template-columns: 1fr; }
  .pd-goals, .pd-goals.is-phone, .pd-goals.no-media { grid-template-columns: 1fr; margin-top: 2.6rem; }
  .pd-goals .pd-goal, .pd-goals-media { grid-column: auto !important; grid-row: auto !important; }
  .pd-goals-media { order: -1; }
  .pd-goals-media { position: static; }
  .pd-goals-media-in { position: static; display: flex; justify-content: center; }
  .pd-goals-media-in img { height: auto; width: 100%; max-width: 100%; max-height: 56vh; object-fit: contain; }
  .pc-row { grid-template-columns: 1fr; gap: 1.6rem; }
  .pd-process-wrap { height: 100vh; height: 100svh; padding-top: 84px; justify-content: flex-start; }
  .pc-label { font-size: 24px; }
  .pc-row { gap: 0.8rem; }
  .pc-stage { height: 44vh; height: 44svh; order: 2; }
  .pc-left { order: 1; } .pc-right { order: 3; }
  .pc-title { font-size: clamp(1.5rem, 7vw, 2.4rem); }
  .pd-reflect { height: auto; min-height: 0; flex-direction: column; align-items: stretch; padding: 12vh var(--pad) 0; }
  .pd-reflect-body { width: auto; margin: 0; }
  .pd-reflect-title { font-size: clamp(1.55rem, 7vw, 2.6rem); }
  .pd-reflect-text { font-size: clamp(0.98rem, 4vw, 1.15rem); }
  .pd-reflect-char { position: relative; left: auto; bottom: auto; height: 56vh; margin: 4vh auto 0; }
  .pd-result { border-radius: 28px; }
  .pd-next-link { grid-template-columns: 1fr; }
  .pd-next-link img { height: 160px; }
}
@media (prefers-reduced-motion: reduce) { .pd-float { animation: none; } }
`;
