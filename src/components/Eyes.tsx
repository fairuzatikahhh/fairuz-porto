import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { EYE_CONFIG, EyeBox } from '../config';

interface EyesProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function Eyes({ containerRef }: EyesProps) {
  const [debugMode, setDebugMode] = useState(false);

  // Editable configurations for debug tuning
  const [boxes, setBoxes] = useState<{ leftEye: EyeBox; rightEye: EyeBox }>({
    leftEye: { ...EYE_CONFIG.leftEye },
    rightEye: { ...EYE_CONFIG.rightEye },
  });

  const [irisRatio, setIrisRatio] = useState(EYE_CONFIG.irisToEyeWidth);
  const [irisTuning, setIrisTuning] = useState({
    noseOffsetPercent: EYE_CONFIG.iris.noseOffsetPercent,
    verticalOffsetPercent: EYE_CONFIG.iris.verticalOffsetPercent,
  });

  const leftIrisRef = useRef<HTMLImageElement>(null);
  const rightIrisRef = useRef<HTMLImageElement>(null);

  // quickTo setters
  const quickLeftX = useRef<((v: number) => void) | null>(null);
  const quickLeftY = useRef<((v: number) => void) | null>(null);
  const quickRightX = useRef<((v: number) => void) | null>(null);
  const quickRightY = useRef<((v: number) => void) | null>(null);

  // Check URL for ?debug=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === '1') {
        setDebugMode(true);
      }
    }
  }, []);

  // Set up gsap quickTo for both irises
  useEffect(() => {
    if (!leftIrisRef.current || !rightIrisRef.current) return;

    // Initial centered rest state
    gsap.set([leftIrisRef.current, rightIrisRef.current], {
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0,
    });

    quickLeftX.current = gsap.quickTo(leftIrisRef.current, 'x', {
      duration: 0.35,
      ease: 'power2.out',
    });
    quickLeftY.current = gsap.quickTo(leftIrisRef.current, 'y', {
      duration: 0.35,
      ease: 'power2.out',
    });
    quickRightX.current = gsap.quickTo(rightIrisRef.current, 'x', {
      duration: 0.35,
      ease: 'power2.out',
    });
    quickRightY.current = gsap.quickTo(rightIrisRef.current, 'y', {
      duration: 0.35,
      ease: 'power2.out',
    });

    // Check test parameters (e.g. ?eyeTest=left, ?eyeTest=right, ?eyeTest=up, ?eyeTest=down)
    const params = new URLSearchParams(window.location.search);
    const test = params.get('eyeTest');
    if (test === 'left') {
      gsap.set([leftIrisRef.current, rightIrisRef.current], { x: -EYE_CONFIG.movement.maxX, y: 0 });
    } else if (test === 'right') {
      gsap.set([leftIrisRef.current, rightIrisRef.current], { x: EYE_CONFIG.movement.maxX, y: 0 });
    } else if (test === 'up') {
      gsap.set([leftIrisRef.current, rightIrisRef.current], { x: 0, y: -EYE_CONFIG.movement.maxY });
    } else if (test === 'down') {
      gsap.set([leftIrisRef.current, rightIrisRef.current], { x: 0, y: EYE_CONFIG.movement.maxY });
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize pointer to -1..1 over the window
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;

      const targetX = normX * EYE_CONFIG.movement.maxX;
      const targetY = normY * EYE_CONFIG.movement.maxY;

      // Both irises move together in the same direction
      quickLeftX.current?.(targetX);
      quickLeftY.current?.(targetY);
      quickRightX.current?.(targetX);
      quickRightY.current?.(targetY);
    };

    // Ease back to center (0, 0) when mouse leaves window
    const handleMouseLeave = () => {
      quickLeftX.current?.(0);
      quickLeftY.current?.(0);
      quickRightX.current?.(0);
      quickRightY.current?.(0);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Debug drag handler for moving boxes
  const activeDrag = useRef<{
    eyeKey: 'leftEye' | 'rightEye';
    startX: number;
    startY: number;
    initialBox: EyeBox;
  } | null>(null);

  const startDrag = useCallback(
    (eyeKey: 'leftEye' | 'rightEye', e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      activeDrag.current = {
        eyeKey,
        startX: e.clientX,
        startY: e.clientY,
        initialBox: { ...boxes[eyeKey] },
      };
    },
    [boxes]
  );

  useEffect(() => {
    if (!debugMode) return;

    const handlePointerMove = (e: MouseEvent) => {
      if (!activeDrag.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const { eyeKey, startX, startY, initialBox } = activeDrag.current;

      const deltaXPct = ((e.clientX - startX) / rect.width) * 100;
      const deltaYPct = ((e.clientY - startY) / rect.height) * 100;

      setBoxes((prev) => {
        const box = { ...prev[eyeKey] };
        box.left = parseFloat((initialBox.left + deltaXPct).toFixed(3));
        box.top = parseFloat((initialBox.top + deltaYPct).toFixed(3));
        return { ...prev, [eyeKey]: box };
      });
    };

    const handlePointerUp = () => {
      activeDrag.current = null;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [debugMode, containerRef]);

  // Iris diameter = irisRatio x eye-opening width (eyes.png is tightly cropped 1:1 to circular iris)
  const irisWidthPercent = irisRatio * 100;

  const renderEye = (
    eyeKey: 'leftEye' | 'rightEye',
    box: EyeBox,
    irisRef: React.RefObject<HTMLImageElement | null>
  ) => {
    // Symmetrical 10% shift toward nose:
    // Left eye (viewer left): nose is to the right (+10%)
    // Right eye (viewer right): nose is to the left (-10%)
    const isLeft = eyeKey === 'leftEye';
    const restX = isLeft
      ? 50 + irisTuning.noseOffsetPercent
      : 50 - irisTuning.noseOffsetPercent;
    const restY = 50 + irisTuning.verticalOffsetPercent;

    return (
      <div
        key={eyeKey}
        style={{
          position: 'absolute',
          left: `${box.left}%`,
          top: `${box.top}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
          zIndex: 5,
          pointerEvents: debugMode ? 'auto' : 'none',
        }}
      >
        {/* Real Eye-Opening Mask Layer: clips the iris and shadow strictly to the 3D eyelid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            WebkitMaskImage: `url('${box.maskUrl}')`,
            maskImage: `url('${box.maskUrl}')`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            border: debugMode ? '1px dashed #DC6341' : 'none',
          }}
        >
          {/* Iris Element: diameter = 0.55 x eye-opening width */}
          <img
            ref={irisRef}
            src="/assets/eyes.png"
            alt={`${eyeKey} iris`}
            style={{
              position: 'absolute',
              left: `${restX}%`,
              top: `${restY}%`,
              width: `${irisWidthPercent}%`,
              aspectRatio: '1 / 1',
              objectFit: 'contain',
              pointerEvents: 'none',
              userSelect: 'none',
              willChange: 'transform',
            }}
          />

          {/* Soft Eyelid Cast Shadow on the top ~30% of the iris & sclera */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.20) 18%, rgba(0, 0, 0, 0.05) 30%, transparent 42%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        </div>

        {/* Debug drag handle */}
        {debugMode && (
          <div
            onMouseDown={(e) => startDrag(eyeKey, e)}
            title={`Drag to reposition ${eyeKey}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 12,
              height: 12,
              transform: 'translate(-50%, -50%)',
              background: '#DC6341',
              borderRadius: '50%',
              border: '2px solid #FFFFFF',
              cursor: 'grab',
              zIndex: 10,
            }}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {renderEye('leftEye', boxes.leftEye, leftIrisRef)}
      {renderEye('rightEye', boxes.rightEye, rightIrisRef)}

      {/* Debug Mode HUD Panel */}
      {debugMode && (
        <div
          style={{
            position: 'fixed',
            top: '5.5rem',
            right: '2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #DC6341',
            borderRadius: '12px',
            padding: '1.25rem',
            zIndex: 99999,
            color: '#212121',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            width: '330px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              color: '#DC6341',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}
          >
            EYE DEBUG MODE (?debug=1)
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span>Iris / Eye Width Ratio:</span>
              <b>{irisRatio.toFixed(2)}</b>
            </label>
            <input
              type="range"
              min="0.40"
              max="0.70"
              step="0.01"
              value={irisRatio}
              onChange={(e) => setIrisRatio(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span>Symmetric Nose Offset:</span>
              <b>{irisTuning.noseOffsetPercent}%</b>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={irisTuning.noseOffsetPercent}
              onChange={(e) =>
                setIrisTuning((p) => ({ ...p, noseOffsetPercent: parseFloat(e.target.value) }))
              }
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span>Vertical Offset (Tuck):</span>
              <b>{irisTuning.verticalOffsetPercent}%</b>
            </label>
            <input
              type="range"
              min="-10"
              max="15"
              step="0.5"
              value={irisTuning.verticalOffsetPercent}
              onChange={(e) =>
                setIrisTuning((p) => ({ ...p, verticalOffsetPercent: parseFloat(e.target.value) }))
              }
              style={{ width: '100%' }}
            />
          </div>

          <pre
            style={{
              background: '#F0EEEB',
              padding: '0.5rem',
              borderRadius: '6px',
              overflow: 'auto',
              maxHeight: '120px',
              fontSize: '0.72rem',
            }}
          >
            {JSON.stringify({ irisToEyeWidth: irisRatio, ...boxes, iris: irisTuning }, null, 2)}
          </pre>

          <button
            onClick={() => {
              const fullConfig = { irisToEyeWidth: irisRatio, ...boxes, iris: irisTuning };
              console.log('FINAL EYE_CONFIG:\n', JSON.stringify(fullConfig, null, 2));
              navigator.clipboard?.writeText(JSON.stringify(fullConfig, null, 2));
              alert('Config logged to console and copied to clipboard!');
            }}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              background: '#DC6341',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Log to Console & Copy
          </button>
        </div>
      )}
    </>
  );
}
