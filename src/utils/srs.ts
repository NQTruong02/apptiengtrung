import {
  MasteryStatus,
  ReviewQuality,
  SrsCardState,
  StrokeMasteryRecord,
  VocabItem,
} from '../types/vocab';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export function createInitialSrsState(vocabId: string, nowMs = Date.now()): SrsCardState {
  return {
    vocabId,
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    lastReviewedAt: null,
    nextReviewAt: nowMs,
    status: 'new',
  };
}

export function classifyStatus(repetitions: number, intervalDays: number): MasteryStatus {
  if (repetitions === 0) return 'new';
  if (repetitions >= 3 && intervalDays >= 6) return 'mastered';
  return 'learning';
}

/**
 * Pure SM-2 Spaced Repetition transition.
 * - again: reset repetitions, review in 1 minute
 * - hard: small interval growth, reduce ease factor slightly
 * - good: standard SM-2 interval progression (1d -> 6d -> interval * ease)
 * - easy: boosted interval & ease factor
 */
export function calculateNextReview(
  current: SrsCardState,
  quality: ReviewQuality,
  nowMs = Date.now()
): SrsCardState {
  let { intervalDays, easeFactor, repetitions, lapses } = current;
  let nextReviewAt = nowMs;

  if (quality === 'again') {
    repetitions = 0;
    intervalDays = 0;
    lapses += 1;
    easeFactor = Math.max(1.3, Number((easeFactor - 0.2).toFixed(2)));
    nextReviewAt = nowMs + 1 * MINUTE_MS;
    return {
      ...current,
      intervalDays,
      easeFactor,
      repetitions,
      lapses,
      lastReviewedAt: nowMs,
      nextReviewAt,
      status: 'learning',
    };
  }

  if (quality === 'hard') {
    repetitions = Math.max(1, repetitions);
    intervalDays = repetitions <= 1 ? 0.5 : Math.max(1, Math.round(intervalDays * 1.2));
    easeFactor = Math.max(1.3, Number((easeFactor - 0.15).toFixed(2)));
    nextReviewAt = nowMs + (repetitions <= 1 ? 10 * MINUTE_MS : intervalDays * DAY_MS);
  } else if (quality === 'good') {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    nextReviewAt = nowMs + intervalDays * DAY_MS;
  } else {
    // easy
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 4;
    } else if (repetitions === 2) {
      intervalDays = 10;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor * 1.3);
    }
    easeFactor = Math.min(3.0, Number((easeFactor + 0.15).toFixed(2)));
    nextReviewAt = nowMs + intervalDays * DAY_MS;
  }

  return {
    ...current,
    intervalDays,
    easeFactor,
    repetitions,
    lapses,
    lastReviewedAt: nowMs,
    nextReviewAt,
    status: classifyStatus(repetitions, intervalDays),
  };
}

export function isCardDue(state: SrsCardState | undefined, nowMs = Date.now()): boolean {
  if (!state) return true;
  return state.nextReviewAt <= nowMs;
}

export function formatIntervalLabel(quality: ReviewQuality, current?: SrsCardState): string {
  if (quality === 'again') return '1 phút';
  if (quality === 'hard') {
    if (!current || current.repetitions <= 1) return '10 phút';
    return `${Math.max(1, Math.round(current.intervalDays * 1.2))} ngày`;
  }
  if (quality === 'good') {
    if (!current || current.repetitions === 0) return '1 ngày';
    if (current.repetitions === 1) return '6 ngày';
    return `${Math.round(current.intervalDays * current.easeFactor)} ngày`;
  }
  // easy
  if (!current || current.repetitions === 0) return '4 ngày';
  if (current.repetitions === 1) return '10 ngày';
  return `${Math.round(current.intervalDays * current.easeFactor * 1.3)} ngày`;
}

export function calculateWritingAccuracy(totalStrokes: number, mistakes: number): number {
  if (totalStrokes <= 0) return 100;
  const raw = Math.round(((totalStrokes - Math.min(mistakes, totalStrokes)) / totalStrokes) * 100);
  return Math.max(0, Math.min(100, raw));
}

export function updateStrokeMastery(
  existing: StrokeMasteryRecord | undefined,
  char: string,
  accuracy: number,
  nowMs = Date.now()
): StrokeMasteryRecord {
  if (!existing) {
    return {
      char,
      attempts: 1,
      completedCount: 1,
      bestAccuracy: accuracy,
      lastPracticedAt: nowMs,
    };
  }
  return {
    char,
    attempts: existing.attempts + 1,
    completedCount: existing.completedCount + 1,
    bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
    lastPracticedAt: nowMs,
  };
}

export function buildQuizOptions(
  target: VocabItem,
  pool: VocabItem[],
  seed = 0
): VocabItem[] {
  const distractors = pool.filter((item) => item.id !== target.id);
  // Deterministic shuffle using seed when needed for testing, or rotating cleanly
  const ranked = [...distractors].sort((a, b) => {
    const scopeA =
      a.lessonId === target.lessonId ? 0 : a.chapterId === target.chapterId ? 50 : 100;
    const scopeB =
      b.lessonId === target.lessonId ? 0 : b.chapterId === target.chapterId ? 50 : 100;
    const scoreA = ((a.id.charCodeAt(0) * 31 + seed * 17) % 47) + scopeA;
    const scoreB = ((b.id.charCodeAt(0) * 31 + seed * 17) % 47) + scopeB;
    return scoreA - scoreB;
  });

  const selected = [target, ...ranked.slice(0, 3)];
  return selected.sort((a, b) => {
    const hashA = (a.id.charCodeAt(0) + a.id.length * 13 + seed * 7) % 29;
    const hashB = (b.id.charCodeAt(0) + b.id.length * 13 + seed * 7) % 29;
    return hashA - hashB;
  });
}

export function getDueQueue(
  vocabList: VocabItem[],
  srsMap: Record<string, SrsCardState>,
  nowMs = Date.now()
): VocabItem[] {
  const due = vocabList.filter((item) => isCardDue(srsMap[item.id], nowMs));
  return due.sort((a, b) => {
    const stateA = srsMap[a.id];
    const stateB = srsMap[b.id];
    const timeA = stateA ? stateA.nextReviewAt : 0;
    const timeB = stateB ? stateB.nextReviewAt : 0;
    return timeA - timeB;
  });
}
