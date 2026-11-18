// Script to analyze the eye gap and compute required vertical offset

const lBoxH = 29.7;   // left eye box height in screen pixels
const lBoxW = 43.7;   // left eye box width in screen pixels
const rBoxH = 32.4;   // right eye box height in screen pixels
const rBoxW = 46.1;   // right eye box width in screen pixels

const irisRatio = 0.58; // current setting

// Mask bounds (from earlier analysis)
const lMaskTopFrac = 4 / 110;    // left eye mask: top=4/110
const lMaskBotFrac = 104 / 110;  // left eye mask: bottom=104/110
const rMaskTopFrac = 2 / 120;    // right eye mask: top=2/120
const rMaskBotFrac = 118 / 120;  // right eye mask: bottom=118/120

function analyzeEye(label, boxW, boxH, maskTopFrac, maskBotFrac, noseOffsetSign) {
  const maskTop = maskTopFrac * boxH;
  const maskBot = maskBotFrac * boxH;
  const irisW = irisRatio * boxW;
  const irisCenterX = (0.5 + noseOffsetSign * 0.10) * boxW;
  const irisCenterY = (0.5 + 0.095) * boxH;  // current verticalOffsetPercent = 9.5%
  const irisTop = irisCenterY - irisW / 2;
  const irisBot = irisCenterY + irisW / 2;
  const visibleBot = Math.min(irisBot, boxH);  // clipped by overflow:hidden

  console.log('\n=== ' + label + ' ===');
  console.log('Box: ' + boxW.toFixed(1) + 'px wide, ' + boxH.toFixed(1) + 'px tall');
  console.log('Iris width: ' + irisW.toFixed(1) + 'px');
  console.log('Mask opening: top=' + maskTop.toFixed(2) + 'px, bot=' + maskBot.toFixed(2) + 'px');
  console.log('Iris: top=' + irisTop.toFixed(2) + 'px, bot=' + irisBot.toFixed(2) + 'px');
  console.log('GAP above iris: ' + (irisTop - maskTop).toFixed(2) + 'px (sclera visible)');
  console.log('Iris visible bottom: ' + visibleBot.toFixed(2) + 'px');
  console.log('GAP below iris: ' + (maskBot - visibleBot).toFixed(2) + 'px (sclera visible if positive)');

  // Compute needed centerY so that iris bottom = mask bottom
  const neededBot = maskBot;
  const neededCenter = neededBot - irisW / 2;
  const neededFrac = neededCenter / boxH;
  const neededOffset = (neededFrac - 0.5) * 100;
  console.log('To touch lower lid: iris center should be at ' + (neededFrac * 100).toFixed(1) + '% of box');
  console.log('  => verticalOffsetPercent = ' + neededOffset.toFixed(1) + '%');

  // Also with irisRatio bumped to touch both lids
  const maskOpenH = maskBot - maskTop;
  const irisForFull = maskOpenH;  // iris diameter = mask height so it fills the full opening
  const irisRatioForFull = irisForFull / boxW;
  console.log('Iris ratio to fill full eye-height: ' + irisRatioForFull.toFixed(3));

  return neededOffset;
}

const lOffset = analyzeEye('Left Eye', lBoxW, lBoxH, lMaskTopFrac, lMaskBotFrac, 1);
const rOffset = analyzeEye('Right Eye', rBoxW, rBoxH, rMaskTopFrac, rMaskBotFrac, -1);
console.log('\nRecommended verticalOffsetPercent: ' + ((lOffset + rOffset) / 2).toFixed(1) + '%');
