const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

function readPNG(p) {
  const buf = fs.readFileSync(p);
  let pos = 8;
  const idatChunks = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    if (type === "IDAT") idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 8 + len + 4;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colorType = buf[25];
  const bpp = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
  const stride = width * bpp;
  const raw = Buffer.alloc(width * height * 4);
  let prevRow = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filter = decompressed[y * (stride + 1)];
    const srcRow = decompressed.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const unfiltRow = Buffer.alloc(stride);

    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? unfiltRow[x - bpp] : 0;
      const b = prevRow[x];
      const c = x >= bpp ? prevRow[x - bpp] : 0;
      let val = srcRow[x];
      if (filter === 0) {}
      else if (filter === 1) val = (val + a) & 0xff;
      else if (filter === 2) val = (val + b) & 0xff;
      else if (filter === 3) val = (val + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
        val = (val + pr) & 0xff;
      }
      unfiltRow[x] = val;
    }
    prevRow = unfiltRow;

    // Convert to RGBA
    for (let x = 0; x < width; x++) {
      const dstIdx = (y * width + x) * 4;
      if (bpp === 4) {
        unfiltRow.copy(raw, dstIdx, x * 4, (x + 1) * 4);
      } else if (bpp === 3) {
        raw[dstIdx] = unfiltRow[x * 3];
        raw[dstIdx + 1] = unfiltRow[x * 3 + 1];
        raw[dstIdx + 2] = unfiltRow[x * 3 + 2];
        raw[dstIdx + 3] = 255;
      }
    }
  }
  return { raw, width, height };
}

function writePNG(outPath, raw, width, height) {
  const stride = width * 4;
  const filtered = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 0;
    raw.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(filtered);
  
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const out = Buffer.concat([
    sig,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0))
  ]);
  fs.writeFileSync(outPath, out);
}

function crop(srcImg, left, top, width, height) {
  const dst = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcY = top + y;
    if (srcY < 0 || srcY >= srcImg.height) continue;
    for (let x = 0; x < width; x++) {
      const srcX = left + x;
      if (srcX < 0 || srcX >= srcImg.width) continue;
      const srcIdx = (srcY * srcImg.width + srcX) * 4;
      const dstIdx = (y * width + x) * 4;
      srcImg.raw.copy(dst, dstIdx, srcIdx, srcIdx + 4);
    }
  }
  return { raw: dst, width, height };
}

const artDir = "/Users/fairuzatikah/.gemini/antigravity/brain/0103ad11-863a-4aa3-b724-bcbe41368a0f";
const screenshotPath = "/tmp/hero-eyes3-rest.png";

const hero = readPNG(screenshotPath);
console.log(`Loaded screenshot: ${hero.width}x${hero.height}`);

// Copy full hero screenshot to artifact directory
fs.copyFileSync(screenshotPath, path.join(artDir, "hero-v3-rest.png"));

// Character eye box at 1200x868 viewport:
// The face is around x: 490..710, y: 385..490
const cropped = crop(hero, 490, 385, 220, 105);
writePNG(path.join(artDir, "eyes-v3-rest.png"), cropped.raw, cropped.width, cropped.height);
console.log("Saved cropped eyes-v3-rest.png");

// Let us analyze the eye openings and irises in the cropped image
// In the cropped image, find the bounding box of left eye and right eye
// Left eye opening is on the left side (x < 110), right eye on right side (x > 110)
// Sclera/iris pixels have distinct colors compared to skin (skin is warm peach, sclera is white/cream, iris is dark brown/teal)
console.log("Measuring eye dimensions...");

// Let's measure the iris and eye opening widths directly from the rendered image
// Left eye is roughly x: 20..75 in cropped, right eye is roughly x: 145..200
// Iris pixels are dark (luminance < 70, or dark brown/teal)
// Eye opening includes sclera (luminance > 140) + iris (surrounded by sclera)

function measureEye(img, xMin, xMax, yMin, yMax, name) {
  let scleraMinX = 999, scleraMaxX = -1;
  let irisMinX = 999, irisMaxX = -1;
  let irisMinY = 999, irisMaxY = -1;

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const idx = (y * img.width + x) * 4;
      const r = img.raw[idx];
      const g = img.raw[idx + 1];
      const b = img.raw[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Sclera detection: bright pixels (r > 160, g > 150, b > 140, not skin orange/peach)
      // skin peach is typically r ~ 220, g ~ 170, b ~ 150 (r - b > 50)
      // sclera is closer to white/cream (r - b < 40, lum > 160)
      const isSclera = lum > 155 && (r - b < 45);
      
      // Iris detection: dark pixels inside the eye region (lum < 75)
      const isIris = lum < 75;

      if (isSclera || isIris) {
        if (x < scleraMinX) scleraMinX = x;
        if (x > scleraMaxX) scleraMaxX = x;
      }
      if (isIris) {
        if (x < irisMinX) irisMinX = x;
        if (x > irisMaxX) irisMaxX = x;
        if (y < irisMinY) irisMinY = y;
        if (y > irisMaxY) irisMaxY = y;
      }
    }
  }

  const eyeWidth = scleraMaxX - scleraMinX + 1;
  const irisWidth = irisMaxX - irisMinX + 1;
  const irisHeight = irisMaxY - irisMinY + 1;
  const ratio = irisWidth / eyeWidth;

  console.log(`\n--- ${name} ---`);
  console.log(`Eye opening X range: [${scleraMinX}, ${scleraMaxX}], width = ${eyeWidth}px`);
  console.log(`Iris X range: [${irisMinX}, ${irisMaxX}], width = ${irisWidth}px`);
  console.log(`Iris Y range: [${irisMinY}, ${irisMaxY}], height = ${irisHeight}px`);
  console.log(`Iris / Eye-opening width ratio: ${(ratio * 100).toFixed(1)}% (${ratio.toFixed(3)})`);

  // Rest position offset:
  const eyeCenterX = (scleraMinX + scleraMaxX) / 2;
  const irisCenterX = (irisMinX + irisMaxX) / 2;
  const offsetFromCenter = irisCenterX - eyeCenterX;
  const offsetPercent = (offsetFromCenter / eyeWidth) * 100;
  console.log(`Eye center: ${eyeCenterX.toFixed(1)}, Iris center: ${irisCenterX.toFixed(1)}`);
  console.log(`Iris offset from center: ${offsetFromCenter.toFixed(1)}px (${offsetPercent.toFixed(1)}% of eye width)`);

  return { eyeWidth, irisWidth, irisHeight, ratio, offsetPercent };
}

const leftEye = measureEye(cropped, 10, 85, 30, 85, "Left Eye");
const rightEye = measureEye(cropped, 135, 210, 30, 85, "Right Eye");

