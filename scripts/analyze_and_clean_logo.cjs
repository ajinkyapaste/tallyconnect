const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// CRC table for PNG encoding
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crcData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  buf.writeUInt32BE(crc32(crcData), 8 + len);
  return buf;
}

function encodePNG(w, h, rgba) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0 (None)
  const scanlines = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const rowOffset = y * (1 + w * 4);
    scanlines[rowOffset] = 0; // Filter None
    rgba.copy(scanlines, rowOffset + 1, y * w * 4, (y + 1) * w * 4);
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

function decodePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8;
  const idatChunks = [];
  let w = 0, h = 0;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      w = buf.readUInt32BE(pos + 8);
      h = buf.readUInt32BE(pos + 12);
    }
    if (type === 'IDAT') idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const raw = Buffer.alloc(w * h * 4);
  const stride = 1 + w * 4;
  for (let y = 0; y < h; y++) {
    const filter = decompressed[y * stride];
    for (let x = 0; x < w; x++) {
      const srcIdx = y * stride + 1 + x * 4;
      const dstIdx = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) {
        let val = decompressed[srcIdx + c];
        const a = x > 0 ? raw[dstIdx - 4 + c] : 0;
        const b = y > 0 ? raw[(dstIdx - w * 4) + c] : 0;
        const c_diag = (x > 0 && y > 0) ? raw[(dstIdx - w * 4 - 4) + c] : 0;
        if (filter === 1) val = (val + a) & 0xff;
        else if (filter === 2) val = (val + b) & 0xff;
        else if (filter === 3) val = (val + Math.floor((a + b) / 2)) & 0xff;
        else if (filter === 4) {
          const p = a + b - c_diag;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c_diag);
          const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c_diag);
          val = (val + pr) & 0xff;
        }
        raw[dstIdx + c] = val;
      }
    }
  }
  return { w, h, raw };
}

// Clean background: anything matching the background tint [234, 237, 240] with alpha ~ 80 becomes 0 alpha!
function cleanLogo(filePath, outPath) {
  const { w, h, raw } = decodePNG(filePath);
  const cleaned = Buffer.alloc(w * h * 4);
  raw.copy(cleaned);

  let cleanedCount = 0;
  for (let i = 0; i < cleaned.length; i += 4) {
    const r = cleaned[i];
    const g = cleaned[i + 1];
    const b = cleaned[i + 2];
    const a = cleaned[i + 3];

    // Background color is [234, 237, 240] with a=80.
    // Check distance to [234, 237, 240]
    const dr = Math.abs(r - 234);
    const dg = Math.abs(g - 237);
    const db = Math.abs(b - 240);
    const isBgColor = dr <= 15 && dg <= 15 && db <= 15;

    if (a <= 85 && isBgColor) {
      cleaned[i + 3] = 0; // Pure transparent!
      cleanedCount++;
    } else if (a > 85 && a < 140 && isBgColor) {
      // Very close to bg, softly taper off to avoid fringe
      const factor = (a - 85) / (140 - 85);
      cleaned[i + 3] = Math.round(factor * 255);
    }
  }

  console.log(`Cleaned ${cleanedCount} background pixels in ${filePath}`);
  const pngBuf = encodePNG(w, h, cleaned);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`Saved clean PNG to ${outPath} (${pngBuf.length} bytes)`);
}

cleanLogo('tally-frontend/public/tally-connect-logo.png', 'tally-frontend/public/tally-connect-logo-clean.png');
cleanLogo('tally-frontend/public/tally-connect-logo-dark.png', 'tally-frontend/public/tally-connect-logo-dark-clean.png');
