const fs = require('fs');
const zlib = require('zlib');

// Use decodePNG and encodePNG from before
function decodePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8;
  const idatChunks = [];
  let w = 0, h = 0;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') { w = buf.readUInt32BE(pos + 8); h = buf.readUInt32BE(pos + 12); }
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
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
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
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);
  const scanlines = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const rowOffset = y * (1 + w * 4);
    scanlines[rowOffset] = 0;
    rgba.copy(scanlines, rowOffset + 1, y * w * 4, (y + 1) * w * 4);
  }
  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([header, ihdr, idat, iend]);
}

// Enhance dark mode logo:
// "Tally" dark text pixels (x < 240, r < 60, g < 60, b < 60, a > 150) -> crisp white `#f8fafc`
// and keep the vibrant red glow/stroke!
const dark = decodePNG('tally-frontend/public/tally-connect-logo-dark.png');
const out = Buffer.alloc(dark.w * dark.h * 4);
dark.raw.copy(out);

for (let y = 0; y < dark.h; y++) {
  for (let x = 0; x < dark.w; x++) {
    const idx = (y * dark.w + x) * 4;
    const r = out[idx];
    const g = out[idx + 1];
    const b = out[idx + 2];
    const a = out[idx + 3];

    if (a > 0) {
      // In the "Tally" section (x < 250)
      if (x < 250) {
        // If it's the dark interior of Tally (black/dark charcoal)
        if (r < 75 && g < 75 && b < 75 && a > 120) {
          // Invert to crisp glowing white with smooth shading
          const brightness = (r + g + b) / 3;
          const newLum = 255 - Math.round(brightness * 0.4);
          out[idx] = newLum;
          out[idx + 1] = newLum;
          out[idx + 2] = newLum;
        }
      }
    }
  }
}

const resBuf = encodePNG(dark.w, dark.h, out);
fs.writeFileSync('tally-frontend/public/tally-connect-logo-dark.png', resBuf);
fs.writeFileSync('tally-frontend/src/assets/tally-connect-logo-dark.png', resBuf);
console.log('Saved enhanced dark mode logo!');
