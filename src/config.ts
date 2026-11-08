// ─── Stage 1 & 2 Configuration ───────────────────────────────────────────────

/** Video duration in seconds (fallback / reference; runtime reads video.duration). */
export const VIDEO_DURATION = 5.8;

/** How long to hold at 100% before fading out (seconds). */
export const HOLD_DURATION = 0.6;

/** Delay before the "Skip" button appears (seconds). */
export const SKIP_DELAY = 1.0;

/** Loader counter styling parameters */
export const LOADER_COUNTER_STYLES = {
  fontSize: 'clamp(7rem, 16vw, 18rem)',
  fontWeight: 300,
  lineHeight: 0.8,
  letterSpacing: '-0.04em',
  fontVariantNumeric: 'tabular-nums',
  padding: 'clamp(1rem, 3vw, 3rem)',
  zIndex: 20,
};

// ─── Eye Tracking & Parallax Configuration (in percentages of base.png) ─────────
export interface EyeParams {
  cx: number;         // Center X (% of base.png width)
  cy: number;         // Center Y (% of base.png height)
  maskWidth: number;  // Mask width (% of base.png width)
  maskHeight: number; // Mask height (% of base.png height)
  irisWidth: number;  // Iris width (% of base.png width)
  irisHeight: number; // Iris height (% of base.png height)
  rotate?: number;    // Slight mask rotation angle in degrees
}

export const EYE_CONFIG = {
  leftEye: {
    cx: 41.5,
    cy: 31.8,
    maskWidth: 7.2,
    maskHeight: 4.0,
    irisWidth: 6.8,
    irisHeight: 6.8,
    rotate: -3,
  } as EyeParams,

  rightEye: {
    cx: 60.5,
    cy: 31.8,
    maskWidth: 7.2,
    maskHeight: 4.0,
    irisWidth: 6.8,
    irisHeight: 6.8,
    rotate: 3,
  } as EyeParams,

  movement: {
    maxX: 6, // max horizontal iris travel (px)
    maxY: 4, // max vertical iris travel (px)
  },

  parallax: {
    maxTranslate: 4, // max head parallax translate (px)
    maxRotate: 1.5,  // max head parallax rotation (deg)
  },
};

// ─── Asset Preload List ──────────────────────────────────────────────────────
export const PRELOAD_IMAGES: string[] = [
  '/assets/base.png',
  '/assets/eyes.png',
  '/assets/slide-track-clean.png',
];

export const PRELOAD_VIDEOS: string[] = [];
