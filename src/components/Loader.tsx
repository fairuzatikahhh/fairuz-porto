import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import {
  HOLD_DURATION,
  SKIP_DELAY,
  VIDEO_DURATION,
  LOADER_COUNTER_STYLES,
  THEME,
} from '../config';
import { preloadAssets } from '../preload';

const CURVE_VH = 12;

function announceLoaderExit() {
  document.documentElement.dataset.loader = 'done';
  window.dispatchEvent(new Event('loader:exit'));
}

interface LoaderProps {
  onDone: () => void;
}

export default function Loader({ onDone }: LoaderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);

  // Raw progress values (0 to 1)
  const videoProgressRef = useRef(0);
  const assetProgressRef = useRef(0);
  const videoEndedRef = useRef(false);
  const assetsReadyRef = useRef(false);

  // GSAP animated display value
  const displayVal = useRef({ value: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const [showSkip, setShowSkip] = useState(false);
  const isExitingRef = useRef(false);

  // ─── Trigger final exit once both video ended & assets ready ─────────────────
  const startExitSequence = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    // Tween smoothly to 100%
    tweenRef.current?.kill();
    tweenRef.current = gsap.to(displayVal.current, {
      value: 100,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        if (percentRef.current) {
          percentRef.current.textContent = `${Math.round(displayVal.current.value)}%`;
        }
      },
      onComplete: () => {
        if (percentRef.current) {
          percentRef.current.textContent = '100%';
        }
        // Hold at 100% for HOLD_DURATION, then curtain slide-up
        gsap.delayedCall(HOLD_DURATION, () => {
          const overlay = overlayRef.current;
          if (overlay) {
            overlay.style.pointerEvents = 'none';
            announceLoaderExit();
            gsap.to(overlay, {
              yPercent: -100,
              y: () => -window.innerHeight * (CURVE_VH / 100 + 0.01),
              duration: 1.1,
              ease: 'power4.inOut',
              onComplete: onDone,
            });
          } else {
            announceLoaderExit();
            onDone();
          }
        });
      },
    });
  }, [onDone]);

  // ─── Update target percentage and smooth with GSAP ──────────────────────────
  const syncProgress = useCallback(() => {
    if (isExitingRef.current) return;

    const bothReady = videoEndedRef.current && assetsReadyRef.current;
    if (bothReady) {
      startExitSequence();
      return;
    }

    // displayed = min(videoProgress, realAssetProgress)
    const rawRatio = Math.min(videoProgressRef.current, assetProgressRef.current);
    let targetPercent = rawRatio * 100;

    // If assets are not ready when video ends (or video has not ended), hold at <= 99%
    if (targetPercent >= 100) {
      targetPercent = 99;
    } else if (videoEndedRef.current && !assetsReadyRef.current) {
      targetPercent = Math.max(targetPercent, 99);
    }

    // Only tween upwards
    if (targetPercent > displayVal.current.value) {
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(displayVal.current, {
        value: targetPercent,
        duration: 0.25,
        ease: 'power1.out',
        onUpdate: () => {
          if (percentRef.current) {
            percentRef.current.textContent = `${Math.floor(displayVal.current.value)}%`;
          }
        },
      });
    }
  }, [startExitSequence]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      announceLoaderExit();
      onDone();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    preloadAssets((p) => {
      assetProgressRef.current = p;
      syncProgress();
    }).then(() => {
      assetProgressRef.current = 1;
      assetsReadyRef.current = true;
      syncProgress();
    });

    let rafId: number;
    const trackVideoTime = () => {
      if (video && !video.paused && !video.ended) {
        const duration =
          video.duration && !isNaN(video.duration) && video.duration > 0
            ? video.duration
            : VIDEO_DURATION;
        videoProgressRef.current = Math.min(video.currentTime / duration, 1);
        syncProgress();
      }
      rafId = requestAnimationFrame(trackVideoTime);
    };
    rafId = requestAnimationFrame(trackVideoTime);

    const handleTimeUpdate = () => {
      const duration =
        video.duration && !isNaN(video.duration) && video.duration > 0
          ? video.duration
          : VIDEO_DURATION;
      videoProgressRef.current = Math.min(video.currentTime / duration, 1);
      syncProgress();
    };

    const handleEnded = () => {
      videoProgressRef.current = 1;
      videoEndedRef.current = true;
      syncProgress();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    video.play().catch(() => {});

    const skipTimer = window.setTimeout(() => {
      setShowSkip(true);
    }, SKIP_DELAY * 1000);

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      clearTimeout(skipTimer);
      tweenRef.current?.kill();
    };
  }, [onDone, syncProgress]);

  const handleSkip = () => {
    videoEndedRef.current = true;
    assetsReadyRef.current = true;
    videoProgressRef.current = 1;
    assetProgressRef.current = 1;
    startExitSequence();
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: THEME.pageBg, // Continuous light background (#DAD8D6), no black flash
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        willChange: 'transform',
      }}
    >
      {/* Video: Centered, muted, playsInline, preload="auto", plays once and holds last frame */}
      <video
        ref={videoRef}
        src="/assets/Loader.mp4"
        poster="/assets/Loader.mp4#t=0.001"
        muted
        playsInline
        preload="auto"
        autoPlay
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* Huge percentage counter at bottom-right, stable width while counting */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          padding: LOADER_COUNTER_STYLES.padding,
          zIndex: LOADER_COUNTER_STYLES.zIndex,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <span
          ref={percentRef}
          style={{
            fontFamily:
              "'Montserrat', system-ui, -apple-system, sans-serif",
            fontSize: LOADER_COUNTER_STYLES.fontSize,
            fontWeight: LOADER_COUNTER_STYLES.fontWeight,
            lineHeight: LOADER_COUNTER_STYLES.lineHeight,
            letterSpacing: LOADER_COUNTER_STYLES.letterSpacing,
            fontVariantNumeric: LOADER_COUNTER_STYLES.fontVariantNumeric as React.CSSProperties['fontVariantNumeric'],
            color: THEME.text,
            display: 'inline-block',
            textAlign: 'right',
            minWidth: '4ch', // Keeps width stable from 0% to 100% without jumping
          }}
        >
          0%
        </span>
      </div>

      {/* Small Skip button after ~1s */}
      {showSkip && (
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '3rem',
            background: 'rgba(255, 255, 255, 0.75)',
            border: '1px solid rgba(33, 33, 33, 0.25)',
            color: THEME.text,
            fontFamily:
              "'Montserrat', system-ui, -apple-system, sans-serif",
            fontWeight: 500,
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '0.55rem 1.35rem',
            borderRadius: '999px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            zIndex: 30,
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(33, 33, 33, 0.7)';
            e.currentTarget.style.background = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(33, 33, 33, 0.25)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.75)';
          }}
        >
          Skip
        </button>
      )}

      {/* Curved bottom edge */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 'calc(100% - 1px)',
          width: '100%',
          height: `${CURVE_VH}vh`,
          display: 'block',
          pointerEvents: 'none',
        }}
      >
        <path d="M0 0 H100 Q50 100 0 0 Z" fill={THEME.pageBg} />
      </svg>
    </div>
  );
}
