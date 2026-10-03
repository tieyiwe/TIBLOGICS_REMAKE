// ARFA app icons (public/pwa) from the TIBLOGICS network mark, on solid
// navy so launchers never show transparency. Same file names, so the manifest
// (app/arfa.webmanifest) stays valid. To use another logo:
//   node scripts/make-pwa-icons.cjs path/to/mark.png
// "any" icons: mark at ~70% width; maskable: ~56% (inside the 80% safe zone);
// apple-touch-icon 180x180 square (iOS rounds the corners); 96x96 shortcuts.
const sharp = require("sharp");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public/pwa");
const SRC = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "public/logo-mark.png");
const NAVY = { r: 0x1b, g: 0x3a, b: 0x6b, alpha: 1 };
// The source mark has pin-holes (partly transparent pixels inside nodes and
// lines) that are invisible on white but show as dark specks on navy. Close
// them: alpha closing (dilate then erode, radius 2) and fill the colour of
// the new pixels from their opaque neighbours.
async function cleanMark() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const A = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) A[i] = data[i * 4 + 3];
  const filt = (src, r, fn) => {
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = fn === Math.max ? 0 : 255;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const xx = x + dx, yy = y + dy;
        const s = xx < 0 || yy < 0 || xx >= W || yy >= H ? 0 : src[yy * W + xx];
        v = fn(v, s);
      }
      out[y * W + x] = v;
    }
    return out;
  };
  const closed = filt(filt(A, 2, Math.max), 2, Math.min);
  // Holes: pixels that the background (alpha < 200) cannot reach from the
  // image border become solid too.
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || closed[i] >= 200) continue;
    seen[i] = 1;
    const x = i % W, y = (i / W) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W);
    if (y < H - 1) stack.push(i + W);
  }
  // Only small enclosed areas are holes; the mark's own loops are large.
  for (let s0 = 0; s0 < W * H; s0++) {
    if (seen[s0] || closed[s0] >= 200) continue;
    const comp = [], st = [s0];
    while (st.length) {
      const i = st.pop();
      if (seen[i] || closed[i] >= 200) continue;
      seen[i] = 1; comp.push(i);
      const x = i % W, y = (i / W) | 0;
      if (x > 0) st.push(i - 1);
      if (x < W - 1) st.push(i + 1);
      if (y > 0) st.push(i - W);
      if (y < H - 1) st.push(i + W);
    }
    if (comp.length <= 60) for (const i of comp) closed[i] = 255;
  }
  const out = Buffer.from(data);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (closed[i] <= A[i]) continue;
    let r = 0, g = 0, b = 0, w = 0;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const j = yy * W + xx, a = A[j] >= 250 ? 1 : 0;
      r += data[j * 4] * a; g += data[j * 4 + 1] * a; b += data[j * 4 + 2] * a; w += a;
    }
    if (w > 0) { out[i * 4] = r / w; out[i * 4 + 1] = g / w; out[i * 4 + 2] = b / w; }
    out[i * 4 + 3] = closed[i];
  }
  return sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}
let CLEAN;
async function make(file, size, frac) {
  CLEAN = CLEAN || (await cleanMark());
  const mark = await sharp(CLEAN).trim().toBuffer();
  const w = Math.round(size * frac);
  // Resize from the full-resolution mark with a high-quality kernel.
  const m = await sharp(mark).resize({ width: w, kernel: "lanczos3" }).png().toBuffer();
  const meta = await sharp(m).metadata();
  await sharp({ create: { width: size, height: size, channels: 3, background: NAVY } })
    .composite([{ input: m, left: Math.round((size - meta.width) / 2), top: Math.round((size - meta.height) / 2) }])
    .flatten({ background: NAVY })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, file));
  console.log(file, size, meta.width + "x" + meta.height);
}
(async () => {
  await make("icon-192.png", 192, 0.7);
  await make("icon-512.png", 512, 0.7);
  await make("icon-96.png", 96, 0.72);
  await make("maskable-192.png", 192, 0.56);
  await make("maskable-512.png", 512, 0.56);
  await make("apple-touch-icon.png", 180, 0.66);
})();
