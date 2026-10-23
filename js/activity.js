import { awardStars, completeStep, defaultProfile } from './rewards.js';
export const WAIT_DAYS = [0, 1, 2, 4, 8, 16];
const DAY = 86400000;
export function applyActivity(profile, previousProgress, event) {
  const p = { ...defaultProfile(), ...profile };
  if (event.kind === 'stars') return awardStars(p, event.amount, event);
  if (event.kind === 'step') return completeStep(p, event);
  const wasNew = !previousProgress;
  const previous = previousProgress || { id: event.word, box: 0, reps: 0, first: event.ts };
  const historical = previous.last > event.ts;
  const alreadyAdvancedToday = previous.box > 0 && (previous.lastKnowDay === event.day || (!previous.lastKnowDay && previous.last >= event.dayStart && previous.last < event.dayStart + 90000000));
  const box = event.know ? Math.min(5, (previous.box || 0) + (alreadyAdvancedToday ? 0 : 1)) : 0;
  const progress = historical ? { ...previous, reps: (previous.reps || 0) + 1 } : { ...previous, box, due: event.know ? event.dayStart + WAIT_DAYS[box] * DAY : 0, reps: (previous.reps || 0) + 1, last: event.ts, ...(event.know ? { lastKnowDay: event.day } : {}) };
  const log = { id: event.id, word: event.word, ts: event.ts, day: event.day, know: event.know, wasNew, ...(event.assignment ? { assignment: event.assignment } : {}) };
  return { ...(event.know ? awardStars(p, 1, event) : { profile: p, awarded: [] }), progress, log };
}
