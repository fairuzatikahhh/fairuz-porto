// Analysis: Required iris ratio to fill mask opening height

// From earlier analysis:
// Left eye: maskOpenH = 27.0px, boxW = 43.7px
// Right eye: maskOpenH = 31.32px, boxW = 46.1px

// Required irisRatio to fill mask opening height (iris is a circle, so its height = width):
const lMaskH = 27.0;
const lBoxW = 43.7;
const rMaskH = 31.32;
const rBoxW = 46.1;

console.log("Required irisRatio to fill mask opening height:");
console.log("Left: " + lMaskH.toFixed(2) + " / " + lBoxW.toFixed(1) + " =", (lMaskH/lBoxW).toFixed(3));
console.log("Right: " + rMaskH.toFixed(2) + " / " + rBoxW.toFixed(1) + " =", (rMaskH/rBoxW).toFixed(3));
console.log("Use smallest (left) for shared: 0.618 -> try 0.62");
console.log("");

for (const irisRatio of [0.55, 0.60, 0.62, 0.65]) {
  const lIrisD = irisRatio * lBoxW;
  const rIrisD = irisRatio * rBoxW;
  const lGap = lMaskH - lIrisD;
  const rGap = rMaskH - rIrisD;
  
  // Optimal center: iris bottom = maskBot (iris touches lower lid)
  // irisCenterY = maskBot - irisD/2
  const lMaskTop = 4/110 * 29.7, lMaskBot = 104/110 * 29.7;
  const rMaskTop = 2/120 * 32.4, rMaskBot = 118/120 * 32.4;
  
  const lCenterY = lMaskBot - lIrisD/2;
  const lFrac = lCenterY / 29.7;
  const lOffset = (lFrac - 0.5) * 100;
  const lGapAbove = lCenterY - lIrisD/2 - lMaskTop;
  
  const rCenterY = rMaskBot - rIrisD/2;
  const rFrac = rCenterY / 32.4;
  const rOffset = (rFrac - 0.5) * 100;
  const rGapAbove = rCenterY - rIrisD/2 - rMaskTop;
  
  const avgOffset = (lOffset + rOffset) / 2;
  
  console.log("irisRatio=" + irisRatio.toFixed(2) + ":");
  console.log("  Left: irisD=" + lIrisD.toFixed(1) + ", gap at top=" + lGapAbove.toFixed(1) + "px, vertOffset=" + lOffset.toFixed(1) + "%");
  console.log("  Right: irisD=" + rIrisD.toFixed(1) + ", gap at top=" + rGapAbove.toFixed(1) + "px, vertOffset=" + rOffset.toFixed(1) + "%");
  console.log("  Avg vertOffset=" + avgOffset.toFixed(1) + "%");
  console.log("");
}
