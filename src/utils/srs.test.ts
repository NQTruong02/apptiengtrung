import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuizOptions,
  calculateNextReview,
  calculateWritingAccuracy,
  createInitialSrsState,
  getDueQueue,
  isCardDue,
  updateStrokeMastery,
} from './srs';
import { VOCAB_LIST } from '../data/vocabulary';

test('SM-2 progression marks card mastered after 3 good reviews', () => {
  const t0 = 1_700_000_000_000;
  let state = createInitialSrsState('ni-hao', t0);
  assert.equal(state.status, 'new');

  state = calculateNextReview(state, 'good', t0);
  assert.equal(state.repetitions, 1);
  assert.equal(state.intervalDays, 1);
  assert.equal(state.status, 'learning');

  state = calculateNextReview(state, 'good', t0 + 86_400_000);
  assert.equal(state.repetitions, 2);
  assert.equal(state.intervalDays, 6);
  assert.equal(state.status, 'learning');

  state = calculateNextReview(state, 'good', t0 + 7 * 86_400_000);
  assert.equal(state.repetitions, 3);
  assert.ok(state.intervalDays >= 15);
  assert.equal(state.status, 'mastered');
});

test('SM-2 "again" resets repetitions and increments lapses', () => {
  const t0 = 1_700_000_000_000;
  let state = createInitialSrsState('xie-xie', t0);
  state = calculateNextReview(state, 'easy', t0);
  assert.equal(state.repetitions, 1);

  state = calculateNextReview(state, 'again', t0 + 1000);
  assert.equal(state.repetitions, 0);
  assert.equal(state.lapses, 1);
  assert.equal(state.status, 'learning');
  assert.equal(isCardDue(state, t0 + 2000), false);
  assert.equal(isCardDue(state, t0 + 120_000), true);
});

test('writing accuracy and stroke mastery record updates accurately', () => {
  assert.equal(calculateWritingAccuracy(10, 0), 100);
  assert.equal(calculateWritingAccuracy(10, 3), 70);
  assert.equal(calculateWritingAccuracy(4, 9), 0);

  let rec = updateStrokeMastery(undefined, '學', 75, 1000);
  assert.equal(rec.attempts, 1);
  assert.equal(rec.bestAccuracy, 75);

  rec = updateStrokeMastery(rec, '學', 95, 2000);
  assert.equal(rec.attempts, 2);
  assert.equal(rec.completedCount, 2);
  assert.equal(rec.bestAccuracy, 95);
});

test('buildQuizOptions returns 4 distinct items including target', () => {
  const target = VOCAB_LIST[0];
  const options = buildQuizOptions(target, VOCAB_LIST, 3);
  assert.equal(options.length, 4);
  const ids = new Set(options.map((o) => o.id));
  assert.equal(ids.size, 4);
  assert.equal(ids.has(target.id), true);
});

test('getDueQueue excludes future-scheduled cards', () => {
  const now = 1_700_000_000_000;
  const card = calculateNextReview(createInitialSrsState(VOCAB_LIST[0].id, now), 'good', now);
  const queue = getDueQueue(VOCAB_LIST, { [VOCAB_LIST[0].id]: card }, now + 1000);
  assert.equal(queue.some((item) => item.id === VOCAB_LIST[0].id), false);
  assert.equal(queue.length, VOCAB_LIST.length - 1);
});
