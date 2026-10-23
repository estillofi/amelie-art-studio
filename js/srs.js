// Kid-sized spaced repetition: Leitner boxes 0–5 and two buttons ("I know" / "Again").
// box 0 = new; each "I know" moves a word one box up and further into the future.
import { S, recordActivity, profile, todayKey, startOfDay, DAY } from './lib.js';

export const LEARNED_BOX = 3;           // box ≥ 3 counts as "learned" (a star on the word)
export const LESSON_LIMIT = 6;          // Backlog stays due; a child never has to finish it in one sitting.

export const progOf = (wordId) => S.progress.find((p) => p.id === wordId);
export const boxOf = (wordId) => progOf(wordId)?.box || 0;
export const seen = (wordId) => Boolean(progOf(wordId));
export const learned = (wordId) => boxOf(wordId) >= LEARNED_BOX;

export function grade(wordId, know, assignmentId = null) {
  recordActivity({ kind: 'review', word: wordId, know, day: todayKey(), dayStart: startOfDay(), ...(assignmentId ? { assignment: assignmentId } : {}) });
}

const newToday = () => S.log.filter((l) => l.day === todayKey() && l.wasNew).length;

export const activeAssignments = () => [...S.assignments].filter((a) => a.active).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || b.createdAt - a.createdAt);

// Assignments prioritize a shared schedule; adding one never resets a word's interval.
export function todayQueue(topic = null, wordIds = null) {
  const selected = wordIds ? new Set(wordIds) : null;
  const pool = S.words.filter((w) => (!topic || w.topic === topic) && (!selected || selected.has(w.id)));
  const priority = new Map();
  for (const assignment of activeAssignments()) for (const id of assignment.wordIds) if (!priority.has(id)) priority.set(id, priority.size);
  const rank = (w) => priority.get(w.id) ?? Number.MAX_SAFE_INTEGER;
  const end = startOfDay() + DAY;
  const due = pool.filter((w) => seen(w.id) && (progOf(w.id).due || 0) < end && boxOf(w.id) < 6)
    .sort((a, b) => rank(a) - rank(b) || (progOf(a.id).due || 0) - (progOf(b.id).due || 0));
  const order = S.topics.map((t) => t.id);
  const fresh = pool.filter((w) => !seen(w.id))
    .sort((a, b) => rank(a) - rank(b) || order.indexOf(a.topic) - order.indexOf(b.topic) || a.order - b.order)
    .slice(0, Math.max(0, (topic ? 8 : profile().newPerDay || 4) - (topic ? 0 : newToday())));
  return [...due.map((w) => ({ w, isNew: false })), ...fresh.map((w) => ({ w, isNew: true }))];
}

export const assignmentQueue = (assignment) => todayQueue(null, assignment.wordIds);

export const seenWords = () => S.words.filter((w) => seen(w.id));
export const topicStats = (topic) => {
  const ws = S.words.filter((w) => w.topic === topic);
  return { total: ws.length, seen: ws.filter((w) => seen(w.id)).length, learned: ws.filter((w) => learned(w.id)).length };
};
