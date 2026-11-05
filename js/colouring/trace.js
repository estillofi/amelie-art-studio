// A parent's picture → clean line art → numbered regions a child can fill.
// Pure functions over pixel arrays, so the same steps run in the browser and in tests.
// The saved PNG is the line art itself: tracing it again always yields the same regions and numbers.

export const MAX_SIDE = 640;
export const MAX_REGIONS = 80;

// rgba: Uint8ClampedArray (w*h*4). Returns Uint8Array mask, 1 = ink.
// Adaptive threshold against a local mean copes with phone-photo shadows; `strength` 0–40 picks up fainter lines.
export function toLineArt(rgba, w, h, { strength = 14 } = {}) {
  const n = w * h;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = rgba[i * 4 + 3] / 255;
    lum[i] = 255 - a * (255 - (0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]));
  }
  const W = w + 1;
  const sum = new Float64Array(W * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) { row += lum[y * w + x]; sum[(y + 1) * W + x + 1] = sum[y * W + x + 1] + row; }
  }
  const r = Math.max(6, Math.round(Math.max(w, h) / 36));
  const c = 34 - Math.max(0, Math.min(40, strength)) * 0.7;
  let ink = new Uint8Array(n);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r); const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r); const x1 = Math.min(w, x + r + 1);
      const mean = (sum[y1 * W + x1] - sum[y0 * W + x1] - sum[y1 * W + x0] + sum[y0 * W + x0]) / ((y1 - y0) * (x1 - x0));
      const v = lum[y * w + x];
      ink[y * w + x] = v < 70 || (v < mean - c && v < 215) ? 1 : 0;
    }
  }
  ink = despeckle(ink, w, h, Math.max(6, Math.round(n / 20000)));
  return dilate(ink, w, h);
}

// Drop tiny ink islands (paper grain, JPEG noise).
function despeckle(ink, w, h, min) {
  const seen = new Uint8Array(w * h); const stack = []; const part = [];
  for (let start = 0; start < ink.length; start++) {
    if (!ink[start] || seen[start]) continue;
    part.length = 0; stack.push(start); seen[start] = 1;
    while (stack.length) {
      const i = stack.pop(); part.push(i);
      const x = i % w; const y = (i - x) / w;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx; const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (ink[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    if (part.length < min) for (const i of part) ink[i] = 0;
  }
  return ink;
}

// Thicken by one pixel so small gaps in a line do not leak paint into the neighbour.
function dilate(ink, w, h) {
  const out = new Uint8Array(ink);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!ink[y * w + x]) continue;
    if (x > 0) out[y * w + x - 1] = 1; if (x < w - 1) out[y * w + x + 1] = 1;
    if (y > 0) out[(y - 1) * w + x] = 1; if (y < h - 1) out[(y + 1) * w + x] = 1;
  }
  return out;
}

// Ink mask from a decoded line-art PNG.
export function inkFromPixels(rgba, w, h) {
  const ink = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) ink[i] = rgba[i * 4 + 3] > 127 && rgba[i * 4] + rgba[i * 4 + 1] + rgba[i * 4 + 2] < 384 ? 1 : 0;
  return ink;
}

// Paper (non-ink) areas → regions numbered 1…K in reading order. Slivers stay unnumbered (label 0).
// Each region gets an anchor deep inside it (largest distance to its border) for the number and the hint.
export function labelRegions(ink, w, h, { minArea = Math.max(60, Math.round(w * h * 0.0012)), maxRegions = MAX_REGIONS } = {}) {
  const raw = new Int32Array(w * h);
  const parts = [];
  const stack = [];
  for (let start = 0; start < raw.length; start++) {
    if (ink[start] || raw[start]) continue;
    const id = parts.length + 1; let area = 0;
    raw[start] = id; stack.push(start);
    while (stack.length) {
      const i = stack.pop(); area++;
      const x = i % w;
      if (x > 0 && !ink[i - 1] && !raw[i - 1]) { raw[i - 1] = id; stack.push(i - 1); }
      if (x < w - 1 && !ink[i + 1] && !raw[i + 1]) { raw[i + 1] = id; stack.push(i + 1); }
      if (i >= w && !ink[i - w] && !raw[i - w]) { raw[i - w] = id; stack.push(i - w); }
      if (i + w < raw.length && !ink[i + w] && !raw[i + w]) { raw[i + w] = id; stack.push(i + w); }
    }
    parts.push({ id, area, first: start });
  }
  const kept = parts.filter((p) => p.area >= minArea).sort((a, b) => b.area - a.area).slice(0, maxRegions).sort((a, b) => a.first - b.first);
  const map = new Int32Array(parts.length + 1);
  kept.forEach((p, i) => { map[p.id] = i + 1; });
  const labels = new Int32Array(w * h);
  for (let i = 0; i < labels.length; i++) labels[i] = raw[i] ? map[raw[i]] : 0;
  const regions = kept.map((p, i) => ({ n: i + 1, area: p.area, x: 0, y: 0, depth: -1 }));
  // Two-pass chamfer distance to the nearest pixel of another label.
  const d = new Uint16Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = labels[i] ? 65535 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!d[i]) continue;
    const l = labels[i];
    const left = x > 0 && labels[i - 1] === l ? d[i - 1] + 1 : 1;
    const up = y > 0 && labels[i - w] === l ? d[i - w] + 1 : 1;
    d[i] = Math.min(d[i], left, up, x === 0 || y === 0 ? 1 : 65535);
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; if (!d[i]) continue;
    const l = labels[i];
    const right = x < w - 1 && labels[i + 1] === l ? d[i + 1] + 1 : 1;
    const down = y < h - 1 && labels[i + w] === l ? d[i + w] + 1 : 1;
    d[i] = Math.min(d[i], right, down, x === w - 1 || y === h - 1 ? 1 : 65535);
    const r = regions[labels[i] - 1];
    if (d[i] > r.depth) { r.depth = d[i]; r.x = x; r.y = y; }
  }
  return { labels, regions };
}

// Label under a tap; a tap on a line picks the nearest region within a few pixels.
export function regionAt(labels, w, h, x, y, reach = 8) {
  x = Math.round(x); y = Math.round(y);
  if (x >= 0 && y >= 0 && x < w && y < h && labels[y * w + x]) return labels[y * w + x];
  for (let r = 1; r <= reach; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const nx = x + dx; const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && labels[ny * w + nx]) return labels[ny * w + nx];
    }
  }
  return 0;
}

// Paint pixels: ink stays dark blue-black, filled regions take their colour, the rest stays paper.
// fills: { r12: '#ff0000' }, highlight: Set of region numbers drawn with a soft yellow wash.
export function paintPixels(out, ink, labels, fills, highlight = null) {
  const cache = new Map();
  const rgb = (hex) => { if (!cache.has(hex)) cache.set(hex, [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16))); return cache.get(hex); };
  for (let i = 0; i < labels.length; i++) {
    const o = i * 4;
    if (ink[i]) { out[o] = 38; out[o + 1] = 46; out[o + 2] = 70; out[o + 3] = 255; continue; }
    const l = labels[i]; const fill = l && fills['r' + l];
    let [r, g, b] = fill ? rgb(fill) : [255, 253, 247];
    if (highlight?.has(l)) { r = Math.round(r * 0.55 + 255 * 0.45); g = Math.round(g * 0.55 + 212 * 0.45); b = Math.round(b * 0.55 + 71 * 0.45); }
    out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
  }
  return out;
}
