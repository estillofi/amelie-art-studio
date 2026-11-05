import { MAX_SIDE, toLineArt, inkFromPixels, labelRegions, paintPixels } from './trace.js';

// Browser side of a parent's own colouring page: canvas decoding, the saved line art and the numbered preview.

const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const decode = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Не получилось открыть картинку. Попробуйте JPG или PNG.'));
  img.src = src;
});

// Photo or scan → line art at most MAX_SIDE px wide; returns the PNG to save and the traced model.
export async function traceFile(file, strength) {
  const url = URL.createObjectURL(file);
  try {
    const img = await decode(url);
    const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(64, Math.round(img.naturalWidth * k)); const h = Math.max(64, Math.round(img.naturalHeight * k));
    const c = canvas(w, h); const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
    return fromInk(toLineArt(g.getImageData(0, 0, w, h).data, w, h, { strength }), w, h);
  } finally { URL.revokeObjectURL(url); }
}

function fromInk(ink, w, h) {
  const c = canvas(w, h); const g = c.getContext('2d');
  const data = g.createImageData(w, h);
  for (let i = 0; i < ink.length; i++) { const v = ink[i] ? 0 : 255; data.data.set([v, v, v, 255], i * 4); }
  g.putImageData(data, 0, 0);
  return { w, h, ink, ...labelRegions(ink, w, h), png: c.toDataURL('image/png') };
}

const models = new Map();
// Saved upload → model. Tracing the stored PNG again gives the same region numbers every time.
export function loadUpload(upload) {
  if (!models.has(upload.id)) {
    models.set(upload.id, decode(upload.image).then((img) => {
      const w = upload.width; const h = upload.height;
      const c = canvas(w, h); const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, w, h);
      const ink = inkFromPixels(g.getImageData(0, 0, w, h).data, w, h);
      return { w, h, ink, ...labelRegions(ink, w, h) };
    }).catch((error) => { models.delete(upload.id); throw error; }));
  }
  return models.get(upload.id);
}

export function render(target, model, fills = {}, highlight = null) {
  target.width = model.w; target.height = model.h;
  const g = target.getContext('2d');
  const data = g.createImageData(model.w, model.h);
  paintPixels(data.data, model.ink, model.labels, fills, highlight);
  g.putImageData(data, 0, 0);
}

// Numbered preview: the only thing sent to the AI. Red numbers with a white halo at each region's anchor.
export function numbered(model, { fills = {}, type = 'image/jpeg' } = {}) {
  const c = canvas(model.w, model.h);
  render(c, model, fills);
  const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const r of model.regions) {
    const size = Math.max(11, Math.min(22, r.depth * 1.4));
    g.font = `700 ${size}px system-ui, sans-serif`;
    g.lineWidth = 4; g.strokeStyle = '#fff'; g.strokeText(String(r.n), r.x, r.y);
    g.fillStyle = '#D7263D'; g.fillText(String(r.n), r.x, r.y);
  }
  return type === 'canvas' ? c : c.toDataURL(type, 0.85);
}

// Small picture for the gallery and the album tiles.
export async function thumbnail(upload, fills = {}) {
  const model = await loadUpload(upload);
  const c = canvas(model.w, model.h);
  render(c, model, fills);
  return c.toDataURL('image/png');
}
