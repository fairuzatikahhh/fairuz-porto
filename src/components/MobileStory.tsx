import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOBILE_ANIM_MQ, THEME } from '../config';
import { INTRO, JOBS } from '../content';
import { FRAMES, type Frame } from './frames';
import LiveChar from './LiveChar';
import { drawIris, drawSparkle } from './eyeFx';

gsap.registerPlugin(ScrollTrigger);

/* Versi mobile (HP, tablet, layar portrait — kebalikan DESKTOP_MQ) dari perkenalan & riwayat pekerjaan.
   Di layar lebar bagian ini disembunyikan (kelas .mobile-only) karena SlideStory
   menampilkannya lewat animasi scroll.
   Parallax mobile: teks perkenalan muncul satu per satu mengikuti scroll; di riwayat pekerjaan
   karakter turun berpayung dari atas, mendarat, lalu teks & carousel muncul. */

const LOOKS: Record<string, Frame> = {
  tries: FRAMES.tries[0] as Frame,
  genah: FRAMES.genah[0] as Frame,
  plain: FRAMES.plain[0] as Frame,
};
const LOOK_KEYS = Object.keys(LOOKS);
const FLOAT = [...((FRAMES as unknown as Record<string, readonly Frame[]>).float ?? [])] as Frame[];

// titik badan (tengah x, sol sepatu y) di frame — sama dengan SlideStory (BODY)
const BODY_FLOAT = [979, 1899] as const;
const BODY_STILL = [648.5, 2091] as const;

const DESCENT = {
  scroll: '+=150%', // panjang pin section riwayat pekerjaan
  fall: [0, 0.62],  // turun berpayung
  land: [0.56, 0.7], // payung memudar → pose diam (berlanyard)
  text: [0.66, 0.96], // teks & carousel muncul satu per satu
  startScale: 0.82, // ukuran awal (× ukuran akhir)
  startFeetY: 0.46, // sol sepatu saat mulai (× tinggi layar)
  startDx: 0.16,    // geser awal ke kanan (× lebar layar)
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, [a, b]: readonly number[], e = (x: number) => x) => e(clamp01((t - a) / (b - a)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const inOut = gsap.parseEase('power2.inOut');
const out3 = gsap.parseEase('power3.out');

const ArrowRight = () => (
  <svg viewBox="0 0 16 16" fill="none" width="15" height="15" aria-hidden="true">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function MobileStory() {
  const [job, setJob] = useState(0);
  const [dir, setDir] = useState(1);
  const start = useRef<{ x: number; y: number } | null>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const workRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const about = aboutRef.current, work = workRef.current;
    if (!about || !work) return;
    const mm = gsap.matchMedia();
    mm.add(MOBILE_ANIM_MQ, () => {
      // ── Perkenalan: tiap blok teks naik & muncul mengikuti scroll ──
      const aboutTweens = gsap.utils.toArray<HTMLElement>('[data-m-about]', about).map((el, i) =>
        gsap.fromTo(el, { y: 60 + i * 10, opacity: 0 }, {
          y: 0, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 62%', scrub: 0.5 },
        }));

      // ── Riwayat pekerjaan: turun berpayung → mendarat → teks muncul ──
      work.classList.add('is-pinned');
      const canvas = work.querySelector<HTMLCanvasElement>('[data-m-float]')!;
      const ctx = canvas.getContext('2d')!;
      const stage = work.querySelector<HTMLElement>('.m-work-stage')!;
      const images = FLOAT.map((f) => { const im = new Image(); im.decoding = 'async'; im.src = f.src; return im; });
      let p = 0, dpr = 1;
      const size = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(work.clientWidth * dpr);
        canvas.height = Math.round(work.clientHeight * dpr);
      };
      const render = () => {
        const W = work.clientWidth, H = work.clientHeight;
        // posisi akhir badan = pose diam (berlanyard) di tengah panggung
        const sh = stage.clientHeight, sw = stage.clientWidth;
        const still = LOOKS.tries, kS = sh / still.h;
        const left = stage.offsetLeft + (sw - still.w * kS) / 2;
        const bx = left + BODY_STILL[0] * kS, by = stage.offsetTop + BODY_STILL[1] * kS;
        const charPx = still.ch * kS; // tinggi badan di layar

        const kf = seg(p, DESCENT.fall), ke = inOut(kf);
        const kl = seg(p, DESCENT.land, inOut);
        stage.style.opacity = String(kl);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (kl < 1 && FLOAT.length) {
          const f = FLOAT[Math.min(FLOAT.length - 1, Math.round(kf * (FLOAT.length - 1)))];
          const im = images[FLOAT.indexOf(f)];
          if (im.complete && im.naturalWidth) {
            const sc = lerp(DESCENT.startScale, 1, out3(kf));
            const k = (charPx * sc) / f.ch;
            // melayang: dari kanan-atas ke tengah, sedikit berayun
            const x = lerp(bx + DESCENT.startDx * W, bx, ke) + Math.sin(kf * Math.PI * 2) * 0.03 * W * (1 - ke);
            const y = lerp(DESCENT.startFeetY * H, by, ke);
            ctx.globalAlpha = 1 - kl;
            ctx.setTransform(k * dpr, 0, 0, k * dpr, (x - BODY_FLOAT[0] * k) * dpr, (y - BODY_FLOAT[1] * k) * dpr);
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(im, 0, 0, f.w, f.h);
            for (const e of f.eyes) { drawIris(ctx, e); drawSparkle(ctx, e, f.eyes.length < 2); }
            ctx.globalAlpha = 1;
          }
        }
        // teks & carousel muncul satu per satu (elemen dicari ulang: berganti saat pindah perusahaan)
        work.querySelectorAll<HTMLElement>('[data-m-rv]').forEach((el) => {
          const i = Number(el.dataset.mRv);
          const a = DESCENT.text[0] + i * 0.05;
          const k = seg(p, [a, a + 0.14], out3);
          el.style.opacity = String(k);
          el.style.transform = `translate3d(0, ${(1 - k) * 26}px, 0)`;
          el.style.visibility = k > 0.01 ? 'visible' : 'hidden';
        });
      };
      images.forEach((im) => im.decode().then(() => render()).catch(() => {}));
      size();
      const proxy = { p: 0 };
      const tw = gsap.to(proxy, {
        p: 1, ease: 'none',
        onUpdate: () => { p = proxy.p; render(); },
        scrollTrigger: {
          trigger: work, start: 'top top', end: DESCENT.scroll, pin: true, scrub: 0.35,
          invalidateOnRefresh: true, onRefresh: (st) => { size(); p = st.progress; render(); },
        },
      });
      render();

      return () => {
        aboutTweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
        tw.scrollTrigger?.kill();
        tw.kill();
        work.classList.remove('is-pinned');
        stage.style.opacity = '';
        work.querySelectorAll<HTMLElement>('[data-m-rv]').forEach((el) => {
          el.style.opacity = ''; el.style.transform = ''; el.style.visibility = '';
        });
        gsap.set(gsap.utils.toArray('[data-m-about]', about), { clearProps: 'opacity,transform' });
      };
    });
    return () => mm.revert();
  }, []);

  const go = (i: number) => {
    const n = (i + JOBS.length) % JOBS.length;
    if (n === job) return;
    setDir(i > job ? 1 : -1);
    setJob(n);
  };
  const j = JOBS[job];

  return (
    <div className="mobile-only">
      {/* ── Perkenalan (karakter sudah tampil penuh di Hero tepat di atasnya) ── */}
      <section id="about" ref={aboutRef} className="m-section m-about">
        <div className="m-text">
          <h2 className="m-h2" data-m-about>{INTRO.title}</h2>
          {INTRO.body.map((p) => (
            <p key={p.slice(0, 16)} className="m-p" data-m-about>{p}</p>
          ))}
        </div>
      </section>

      {/* ── Riwayat pekerjaan: geser kiri/kanan atau ketuk titik ── */}
      <section
        id="journey"
        ref={workRef}
        className="m-section m-work"
        onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          const s = start.current;
          start.current = null;
          if (!s) return;
          const dx = e.clientX - s.x, dy = e.clientY - s.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(job + (dx < 0 ? 1 : -1));
        }}
        style={{ touchAction: 'pan-y' }}
      >
        <canvas data-m-float className="m-float" aria-hidden />
        <p className="m-eyebrow" data-m-rv="0">My Journey</p>
        <div data-m-rv="1">
          <div key={`co-${job}`} className="m-swap" style={{ ['--dir' as string]: dir }}>
            <h2 className="m-h2" style={{ marginBottom: '0.35em' }}>{j.company}</h2>
            <p className="m-p" style={{ margin: 0 }}>
              {j.role}
              <span style={{ marginLeft: '0.8em', color: THEME.logoCoral }}>{j.period}</span>
            </p>
          </div>
        </div>

        <div className="m-work-stage">
          {LOOK_KEYS.map((k) => (
            <LiveChar
              key={k}
              frame={LOOKS[k]}
              height="100%"
              className="m-work-char"
              style={{ opacity: j.look === k ? 1 : 0, transform: j.look === k ? 'none' : `translateX(${dir * -12}%)` }}
            />
          ))}
        </div>

        <div className="m-dots" role="tablist" aria-label="Riwayat pekerjaan" data-m-rv="2">
          {JOBS.map((x, i) => (
            <button
              key={x.company}
              type="button"
              role="tab"
              aria-selected={i === job}
              aria-label={`View ${x.company}`}
              onClick={() => go(i)}
              style={{
                width: i === job ? 28 : 10, background: i === job ? THEME.logoCoral : 'rgba(33,33,33,0.22)',
              }}
            />
          ))}
        </div>

        <div data-m-rv="3">
          <div key={`desc-${job}`} className="m-swap" style={{ ['--dir' as string]: dir }}>
            <p className="m-p" style={{ color: THEME.descriptionText }}>{j.desc}</p>
          </div>
        </div>
        <div data-m-rv="4">
          <a href="#project" className="m-outline">
            View Project <ArrowRight />
          </a>
        </div>
      </section>
    </div>
  );
}
