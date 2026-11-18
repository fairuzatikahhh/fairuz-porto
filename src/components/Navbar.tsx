import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { DESKTOP_MQ, THEME } from '../config';

const LINKS = [['Home', '#'], ['About', '#about'], ['Project', '#project'], ['Contact', '#contact']] as const;

// Navbar global (position: fixed) → tetap terlihat di semua section (Hero, story, Project).
export default function Navbar() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false); // menu HP

  // tutup menu HP saat layar dilebarkan atau tombol Escape
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia(DESKTOP_MQ);
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    mq.addEventListener('change', close);
    window.addEventListener('keydown', onKey);
    return () => { mq.removeEventListener('change', close); window.removeEventListener('keydown', onKey); };
  }, [open]);

  // animasi masuk sama seperti dulu di Hero (0.3s delay + 0.45s offset setelah loader keluar)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(el, { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.75, paused: true });
    const params = new URLSearchParams(window.location.search);
    const bypass = document.documentElement.dataset.loader === 'done'
      || Boolean(sessionStorage.getItem('portfolio_loader_visited'))
      || params.has('eyeTest') || params.get('debug') === '1' || params.has('noLoader');
    const play = () => tween.play();
    if (bypass) play();
    else window.addEventListener('loader:exit', play, { once: true });
    return () => { window.removeEventListener('loader:exit', play); tween.kill(); };
  }, []);

  return (
    <header
      ref={ref}
      data-reveal="header"
      style={{
        position: 'fixed',
        top: '3.2vh',
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 3vw',
        zIndex: 1000,
        pointerEvents: 'none',
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
          pointerEvents: 'auto',
          letterSpacing: '-0.01em',
        }}
      >
        Faiz
      </a>

      {/* Links: Home, About, Project, Contact centered on the page (~1.35vw, weight 500, #212121, ~4.5vw gaps) */}
      <nav
        className="nav-links"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(1.5rem, 4.5vw, 4rem)',
          pointerEvents: 'auto',
        }}
      >
        {LINKS.map(([item, href]) => (
          <a
            key={item}
            href={href}
            onClick={(e) => {
              // di desktop perkenalan ada di dalam animasi scroll → lompat ke titiknya
              if (href === '#about' && window.matchMedia(DESKTOP_MQ).matches) {
                e.preventDefault();
                document.getElementById('about-desktop')?.scrollIntoView();
              }
            }}
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
        className="nav-cta"
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
          pointerEvents: 'auto',
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

      {/* HP: tombol menu (hamburger) + panel tautan */}
      <button
        type="button"
        className="nav-burger"
        aria-label={open ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ transform: open ? 'translateY(4px) rotate(45deg)' : 'none' }} />
        <span style={{ transform: open ? 'translateY(-4px) rotate(-45deg)' : 'none' }} />
      </button>
      <nav id="mobile-menu" className={`nav-menu${open ? ' is-open' : ''}`} aria-hidden={!open}>
        {LINKS.map(([item, href]) => (
          <a key={item} href={href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>{item}</a>
        ))}
        <a href="#contact" className="nav-menu-cta" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
          Lets Contact
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4.5 11.5L11.5 4.5M11.5 4.5H6.5M11.5 4.5V9.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </nav>
    </header>
  );
}
