// Ignore object-key order when comparing a saved composition. Keep every original record.
export function drawingSignature(drawing) {
  return JSON.stringify([drawing.pic, drawing.artVersion || 'legacy', Object.entries(drawing.fills || {}).sort(([a], [b]) => a.localeCompare(b))]);
}

export function groupDrawings(drawings) {
  const groups = new Map();
  for (const drawing of [...drawings].sort((a, b) => b.ts - a.ts)) {
    const key = drawingSignature(drawing);
    if (!groups.has(key)) groups.set(key, { drawing, saves: [] });
    groups.get(key).saves.push(drawing);
  }
  return [...groups.values()];
}
