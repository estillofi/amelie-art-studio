// Shared, deterministic reward rules for the browser preview and authoritative SQLite writes.
export const LEGACY_STICKERS = ['🦄', '🐱', '🌸', '🦋', '🐼', '🍓', '🌈', '🎀', '🐬', '🌻', '🦊', '🍭', '🐞', '⭐', '🐙', '🎨', '🦉', '🧁', '🐢', '🌙'];
export const STICKERS = [...LEGACY_STICKERS, ...['cat','dog','rabbit','bird','fish','butterfly','flower','tree','sun','moon','star','rainbow','brush','palette','pencil','crayon','book','ball','teddy-bear','kite','doll','plane','backpack','apple'].map((key) => 'sketch:' + key)];
export const FIRST_STICKER_STEP = 15;
export const MAX_STICKER_STEP = 60;
export const defaultProfile = () => ({ id: 'amelie', stars: 0, stickers: [], days: {}, rate: 0.85, newPerDay: 4 });

// Lazy checkpoint: merely deploying this policy never edits an existing child's achievements.
export function rewardTrack(profile) {
  return profile.rewardTrack || {
    version: 2, nextAt: (Math.floor((profile.stars || 0) / 15) + 1) * 15,
    step: 15, earned: 0, baseCount: (profile.stickers || []).filter((s) => !s.bonus).length,
  };
}
export const nextReward = (profile) => {
  const track = rewardTrack(profile);
  return { remaining: Math.max(0, track.nextAt - (profile.stars || 0)), target: track.nextAt, step: track.step };
};
export function awardStars(profile, amount, event) {
  const p = { ...defaultProfile(), ...profile, stars: (profile.stars || 0) + amount, stickers: [...(profile.stickers || [])] };
  const track = { ...rewardTrack(profile) };
  const awarded = [];
  while (p.stars >= track.nextAt) {
    const sticker = { id: event.id + '-star-' + track.earned, s: STICKERS[(track.baseCount + track.earned) % STICKERS.length], ts: event.ts, source: 'stars' };
    p.stickers.push(sticker); awarded.push(sticker); track.earned++;
    track.step = Math.min(MAX_STICKER_STEP, Math.ceil(track.step * 1.2));
    track.nextAt += track.step;
  }
  p.rewardTrack = track;
  return { profile: p, awarded };
}
export function completeStep(profile, event) {
  const p = { ...defaultProfile(), ...profile, days: { ...profile.days }, stickers: [...(profile.stickers || [])] };
  const day = { ...p.days[event.day] };
  const awarded = [];
  if (!day[event.step]) day[event.step] = event.ts;
  if (day.words && day.play && day.art && !day.bonus) {
    day.bonus = true;
    const sticker = { id: 'day-' + event.day, s: '🏆', ts: event.ts, bonus: true, source: 'daily' };
    p.stickers.push(sticker); awarded.push(sticker);
  }
  p.days[event.day] = day;
  return { profile: p, awarded };
}
