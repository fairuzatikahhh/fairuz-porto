// ─── Theme & Layout Configuration ─────────────────────────────────────────────
export const THEME = {
  pageBg: '#DAD8D6',         // Flat light grey-beige page background (matches Framer)
  text: '#212121',           // Primary dark text (Montserrat)
  descriptionText: '#000000', // Bottom-right description text (Inter)
  logoCoral: '#DC6341',      // Faiz logo coral
  buttonBg: '#EE8162',       // Lets Contact pill button coral
  buttonText: '#FFFFFF',     // White button text
};

// ─── Loader configuration ───────────────────────────────────────────────────
export const VIDEO_DURATION = 5.8;
export const HOLD_DURATION = 0.6;
export const SKIP_DELAY = 1.0;

export const LOADER_COUNTER_STYLES = {
  fontSize: 'clamp(7rem, 16vw, 18rem)',
  fontWeight: 300,
  lineHeight: 0.8,
  letterSpacing: '-0.04em',
  fontVariantNumeric: 'tabular-nums',
  padding: 'clamp(1rem, 3vw, 3rem)',
  zIndex: 20,
};

// ─── Eye Tracking & Parallax Configuration ────────────────────────────────────
// Programmatically measured from near-white sclera connected components in base.png (1790x2400)
export interface EyeParams {
  cx: number;         // Center X (% of base.png width)
  cy: number;         // Center Y (% of base.png height)
  maskWidth: number;  // Mask width (% of base.png width)
  maskHeight: number; // Mask height (% of base.png height)
  rotate: number;     // Tilt angle in degrees
}

export const EYE_CONFIG = {
  leftEye: {
    cx: 39.58,
    cy: 32.10,
    maskWidth: 8.04,
    maskHeight: 4.04,
    rotate: -3.5,
  } as EyeParams,

  rightEye: {
    cx: 61.59,
    cy: 31.88,
    maskWidth: 8.10,
    maskHeight: 4.67,
    rotate: 3.5,
  } as EyeParams,

  movement: {
    maxX: 5.5, // max horizontal iris travel (px)
    maxY: 3.5, // max vertical iris travel (px)
  },

  parallax: {
    maxTranslate: 4, // max head parallax translate (px)
    maxRotate: 1.2,  // max head parallax rotation (deg)
  },
};

// ─── Asset Preload List ──────────────────────────────────────────────────────
export const PRELOAD_IMAGES: string[] = [
  '/assets/base.png',
  '/assets/eyes.png',
  '/assets/slide-track-clean.png',
];

export const PRELOAD_VIDEOS: string[] = [];
