import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Eyes from './Eyes';
import { EYE_CONFIG } from '../config';

export default function Hero() {
  const bustRef = useRef<HTMLDivElement>(null);

  // Subtle head parallax on base.png (max 4px translate, 1.5deg rotate)
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

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: '#16151C',
        color: '#F5F0EE',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ─── Top Navigation ──────────────────────────────────────────────── */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5.5rem',
          padding: '0 clamp(1.5rem, 5vw, 4.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        {/* Faiz Logo in Coral */}
        <a
          href="#"
          style={{
            color: '#FF7A59',
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textDecoration: 'none',
          }}
        >
          Faiz
        </a>

        {/* Middle Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(1.2rem, 3vw, 2.75rem)',
          }}
        >
          {['Home', 'About', 'Project', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              style={{
                color: '#F5F0EE',
                fontSize: '0.95rem',
                fontWeight: 400,
                letterSpacing: '0.02em',
                textDecoration: 'none',
                opacity: item === 'Home' ? 1 : 0.7,
                transition: 'opacity 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.color = '#FF7A59';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = item === 'Home' ? '1' : '0.7';
                e.currentTarget.style.color = '#F5F0EE';
              }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Coral Pill Button: Lets Contact */}
        <a
          href="#contact"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: '#FF7A59',
            color: '#16151C',
            fontSize: '0.9rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            padding: '0.65rem 1.35rem',
            borderRadius: '9999px',
            textDecoration: 'none',
            transition: 'transform 0.2s, background-color 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 18px rgba(255, 122, 89, 0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 6px 22px rgba(255, 122, 89, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 18px rgba(255, 122, 89, 0.25)';
          }}
        >
          <span>Lets Contact</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </a>
      </header>

      {/* ─── Bust with Responsive Eyes & Parallax (Centered-Right) ──────── */}
      <div
        style={{
          position: 'absolute',
          top: '52%',
          right: 'clamp(3%, 10vw, 15%)',
          transform: 'translateY(-50%)',
          height: 'clamp(460px, 78vh, 820px)',
          aspectRatio: '1790 / 2400',
          zIndex: 5,
          pointerEvents: 'none',
        }}
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

          {/* Interactive Eyes Overlaid at percentage coordinates */}
          <Eyes containerRef={bustRef} />
        </div>
      </div>

      {/* ─── Bottom-Left: Big Name Text (Two Lines, Light Uppercase) ──── */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(2rem, 5vw, 4.5rem)',
          left: 'clamp(1.5rem, 5vw, 4.5rem)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(3.5rem, 7.5vw, 8.5rem)',
            fontWeight: 200,
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
            color: '#F5F0EE',
          }}
        >
          FAIRUZ
          <br />
          ATIKAH
        </h1>
      </div>

      {/* ─── Bottom-Right: Small Description ───────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(2rem, 5vw, 4.5rem)',
          right: 'clamp(1.5rem, 5vw, 4.5rem)',
          maxWidth: '310px',
          zIndex: 10,
          textAlign: 'right',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(0.85rem, 1.1vw, 1rem)',
            fontWeight: 300,
            lineHeight: 1.55,
            color: '#F5F0EE',
            opacity: 0.78,
            letterSpacing: '0.01em',
          }}
        >
          I blend design thinking with visual storytelling to help brands
          communicate better
        </p>
      </div>
    </div>
  );
}
