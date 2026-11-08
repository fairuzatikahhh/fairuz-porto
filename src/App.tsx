import { useState, useRef, useCallback } from 'react';
import Loader from './components/Loader';
import Hero from './components/Hero';

const LOADER_VISITED_KEY = 'portfolio_loader_visited';

function shouldShowLoader(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (sessionStorage.getItem(LOADER_VISITED_KEY)) return false;
  return true;
}

export default function App() {
  const [loaderVisible, setLoaderVisible] = useState(() => shouldShowLoader());
  const heroRef = useRef<HTMLDivElement>(null);

  const handleLoaderDone = useCallback(() => {
    sessionStorage.setItem(LOADER_VISITED_KEY, '1');
    // Remove loader overlay from DOM once fade-out completes
    setTimeout(() => {
      setLoaderVisible(false);
    }, 100);
  }, []);

  return (
    <>
      {/* Hero is mounted BEHIND the loader (never display: none).
          It is always fully visible (opacity: 1) sitting at z-index 1.
          When the loader (z-index: 9999) fades its opacity to 0,
          the hero is revealed seamlessly with zero lag or freeze. */}
      <div
        ref={heroRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          overflow: 'hidden',
          background: '#16151C',
        }}
      >
        <Hero />
      </div>

      {/* Full-screen Loader sits on top until complete */}
      {loaderVisible && <Loader onDone={handleLoaderDone} />}
    </>
  );
}
