import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import Eyes from './Eyes';
import { EYE_CONFIG, THEME } from '../config';

export default function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const bustRef = useRef<HTMLDivElement>(null);

  // Subtle head parallax on base.png (max 4px translate, 1.2deg rotate)
  const quickBustX = useRef<((v: number) => void) | null>(null);
  const quickBustY = useRef<((v: number) => void) | null>(null);
  const quickBustRot = useRef<((v: number) => void) | null>(null);

  useEffect(() => {
    if (!bustRef.current) return;

    quickBustX.current = gsap.quickTo(bustRef.current, 'x', {
      duration: 0.5,
      ease: 'power2.out',
    });
    quickBustY.current = gsap.quickTo(bustRef.current, 'y', {
      duration: 0.5,
      ease: 'power2.out',
    });
    quickBustRot.current = gsap.quickTo(bustRef.current, 'rotation', {
      duration: 0.5,
      ease: 'power2.out',
    });

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;

      const targetX = normX * EYE_CONFIG.parallax.maxTranslate;
      const targetY = normY * EYE_CONFIG.parallax.maxTranslate;
      const targetRot = normX * EYE_CONFIG.parallax.maxRotate;

      quickBustX.current?.(targetX);
      quickBustY.current?.(targetY);
      quickBustRot.current?.(targetRot);
    };

    const handleMouseLeave = () => {
      quickBustX.current?.(0);
      quickBustY.current?.(0);
      quickBustRot.current?.(0);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let handleLoaderExit: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, delay: 0.3 });

      tl.fromTo(
        '[data-reveal="character"]',
        { yPercent: 16, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.5, ease: 'power4.out' },
        0
      )
        .fromTo(
          '[data-reveal="line"]',
          { yPercent: 115 },
          { yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: 0.12 },
          0.1
        )
        .fromTo(
          '[data-reveal="desc"]',
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out' },
          0.3
        )
        .fromTo(
          '[data-reveal="header"]',
          { y: -30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
          0.45
        );

      handleLoaderExit = () => {
        tl.play();
      };

      const isBypassed =
        document.documentElement.dataset.loader === 'done' ||
        Boolean(sessionStorage.getItem('portfolio_loader_visited')) ||
        new URLSearchParams(window.location.search).has('eyeTest') ||
        new URLSearchParams(window.location.search).get('debug') === '1' ||
        new URLSearchParams(window.location.search).has('noLoader');

      if (isBypassed) {
        tl.play();
      } else {
        window.addEventListener('loader:exit', handleLoaderExit, { once: true });
      }
    }, rootRef);

    return () => {
      if (handleLoaderExit) {
        window.removeEventListener('loader:exit', handleLoaderExit);
      }
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: THEME.pageBg,
        color: THEME.text,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ─── Top Navigation ──────────────────────────────────────────────── */}
      <header
        data-reveal="header"
        style={{
          position: 'absolute',
          top: '3.2vh',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 3vw',
          zIndex: 30,
        }}
      >
        {/* Logo: Faiz at left (3vw, ~2.7vw font-size, regular weight, #DC6341) */}
        <a
          href="#"
          style={{
            color: THEME.logoCoral,
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 'clamp(1.8rem, 2.7vw, 2.5rem)',
            fontWeight: 400,
            textDecoration: 'none',
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}
        >
          Faiz
        </a>

        {/* Links: Home, About, Project, Contact centered on the page (~1.35vw, weight 500, #212121, ~4.5vw gaps) */}
        <nav
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(1.5rem, 4.5vw, 4rem)',
          }}
        >
          {['Home', 'About', 'Project', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                color: THEME.text,
                fontSize: 'clamp(0.85rem, 1.35vw, 1.15rem)',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = THEME.logoCoral;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = THEME.text;
              }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Pill Button: Lets Contact + arrow-up-right icon, height ~6vh, horizontal padding ~2.3vw */}
        <a
          href="#contact"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55vw',
            background: THEME.buttonBg,
            color: THEME.buttonText,
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 'clamp(0.85rem, 1.25vw, 1.1rem)',
            fontWeight: 500,
            height: 'clamp(2.4rem, 6vh, 3.4rem)',
            padding: '0 clamp(1.2rem, 2.3vw, 2.2rem)',
            borderRadius: '9999px',
            textDecoration: 'none',
            boxShadow: '0 2px 12px rgba(220, 99, 65, 0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 18px rgba(220, 99, 65, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(220, 99, 65, 0.2)';
          }}
        >
          <span>Lets Contact</span>
          {/* Arrow-up-right icon (NOT a right arrow) */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            style={{ width: 'clamp(10px, 1.1vw, 15px)', height: 'clamp(10px, 1.1vw, 15px)' }}
          >
            <path
              d="M4.5 11.5L11.5 4.5M11.5 4.5H6.5M11.5 4.5V9.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </header>

      {/* ─── Character: base.png CENTERED horizontally, anchored to BOTTOM edge (bottom: 0) ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'clamp(320px, 40.23vw, 560px)',
          aspectRatio: '1790 / 2400',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          data-reveal="character"
          style={{ position: 'relative', width: '100%', height: '100%' }}
        >
          <div
            ref={bustRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              willChange: 'transform',
            }}
          >
            {/* Base Character Bust */}
            <img
              src="/assets/base.png"
              alt="Fairuz Atikah bust"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
              }}
            />

            {/* Interactive Eyes Overlaid at detected sclera coordinates */}
            <Eyes containerRef={bustRef} />
          </div>
        </div>
      </div>

      {/* ─── Bottom-Left: Big Name FAIRUZ / ATIKAH (two lines, ~7.3vw, line-height 1.08) ─── */}
      <div
        data-hero="name"
        style={{
          position: 'absolute',
          left: '3.3vw',
          bottom: 'clamp(1.5rem, 2vh, 2.5rem)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 'clamp(3.8rem, 7.3vw, 7.2rem)',
            fontWeight: 450,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: THEME.text,
          }}
        >
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span data-reveal="line" style={{ display: 'block' }}>
              FAIRUZ
            </span>
          </span>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span data-reveal="line" style={{ display: 'block' }}>
              ATIKAH
            </span>
          </span>
        </h1>
      </div>

      {/* ─── Bottom-Right: Description (Inter ~1.8vw, line-height 1.65, #000000, left-aligned) ─── */}
      <div
        data-hero="desc"
        style={{
          position: 'absolute',
          right: '3vw',
          bottom: 'clamp(1.5rem, 2vh, 2.5rem)',
          width: 'clamp(240px, 26vw, 360px)',
          zIndex: 20,
          textAlign: 'left',
          pointerEvents: 'none',
        }}
      >
        <p
          data-reveal="desc"
          style={{
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(0.95rem, 1.8vw, 1.65rem)',
            fontWeight: 400,
            lineHeight: 1.65,
            color: THEME.descriptionText,
            letterSpacing: '-0.01em',
          }}
        >
          I blend design thinking with
          <br />
          visual storytelling to help
          <br />
          brands communicate better
        </p>
      </div>
    </div>
  );
}
