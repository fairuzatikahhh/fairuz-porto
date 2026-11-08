const sharp = require("sharp");
const path = require("path");

const artDir = "/Users/fairuzatikah/.gemini/antigravity/brain/0103ad11-863a-4aa3-b724-bcbe41368a0f";

async function measureFile(filePath, label) {
  const { data, info } = await sharp(filePath)
    .extract({ left: 490, top: 385, width: 220, height: 105 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const { width, height, channels } = info;

  // Measure Left Eye (x: 20..95) and Right Eye (x: 135..210)
  function measure(xMin, xMax, yMin, yMax, eyeName) {
    let scleraMinX = 999, scleraMaxX = -1;
    let irisMinX = 999, irisMaxX = -1;
    let irisMinY = 999, irisMaxY = -1;
    let scleraMinY = 999, scleraMaxY = -1;

    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const lum = 0.299*r + 0.587*g + 0.114*b;
        
        // Sclera: bright, not skin
        const isSclera = lum > 165 && (r - b < 35);
        // Iris: dark brown / pupil
        const isIris = lum < 115 && r > 45 && (r - b > 5 || lum < 50);

        if (isSclera || isIris) {
          if (x < scleraMinX) scleraMinX = x;
          if (x > scleraMaxX) scleraMaxX = x;
          if (y < scleraMinY) scleraMinY = y;
          if (y > scleraMaxY) scleraMaxY = y;
        }
        if (isIris) {
          if (x < irisMinX) irisMinX = x;
          if (x > irisMaxX) irisMaxX = x;
          if (y < irisMinY) irisMinY = y;
          if (y > irisMaxY) irisMaxY = y;
        }
      }
    }

    const eyeW = scleraMaxX - scleraMinX + 1;
    const irisW = irisMaxX - irisMinX + 1;
    const irisH = irisMaxY - irisMinY + 1;
    const ratio = irisW / eyeW;

    // Check if there is any white sclera directly underneath the iris
    // Check columns where the iris is located (from irisMinX to irisMaxX)
    let scleraBelowIrisCount = 0;
    for (let x = irisMinX + 2; x <= irisMaxX - 2; x++) {
      for (let y = irisMaxY + 1; y <= scleraMaxY; y++) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const lum = 0.299*r + 0.587*g + 0.114*b;
        if (lum > 165 && (r - b < 35)) {
          scleraBelowIrisCount++;
        }
      }
    }

    console.log(`[${label}] ${eyeName}:`);
    console.log(`  Eye opening width: ${eyeW}px (X: ${scleraMinX}..${scleraMaxX})`);
    console.log(`  Iris width: ${irisW}px (X: ${irisMinX}..${irisMaxX})`);
    console.log(`  Iris / Eye width ratio: ${(ratio * 100).toFixed(1)}% (${ratio.toFixed(3)})`);
    console.log(`  Iris vertical span: Y=${irisMinY}..${irisMaxY} (H=${irisH}px)`);
    console.log(`  Sclera pixels directly below iris: ${scleraBelowIrisCount}`);

    return { eyeW, irisW, irisH, ratio, scleraBelowIrisCount };
  }

  const left = measure(20, 95, 30, 85, "Left Eye");
  const right = measure(135, 210, 30, 85, "Right Eye");
  return { left, right };
}

measureFile("/tmp/hero-test-rest.png", "Rest Position");
