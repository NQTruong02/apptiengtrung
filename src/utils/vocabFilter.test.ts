import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, LESSONS, VOCAB_LIST } from '../data/vocabulary';
import {
  extractUniqueCharacters,
  filterVocabulary,
  normalizeSearchText,
} from './vocabFilter';
import { calculateNextReview, createInitialSrsState } from './srs';

test('normalizeSearchText removes Vietnamese and Pinyin diacritics', () => {
  assert.equal(normalizeSearchText('Cảm ơn'), 'cam on');
  assert.equal(normalizeSearchText('xiè xie'), 'xie xie');
  assert.equal(normalizeSearchText('Đài Loan'), 'dai loan');
});

test('filterVocabulary matches Vietnamese meaning, Han-Viet, Pinyin, and Traditional Hanzi', () => {
  const byVi = filterVocabulary(VOCAB_LIST, {}, { query: 'cam on' });
  assert.equal(byVi.some((v) => v.id === 'xie-xie'), true);

  const byHanzi = filterVocabulary(VOCAB_LIST, {}, { query: '臺灣' });
  assert.equal(byHanzi.length, 1);
  assert.equal(byHanzi[0].id, 'tai-wan');

  const byHanViet = filterVocabulary(VOCAB_LIST, {}, { query: 'hoc hieu' });
  assert.equal(byHanViet.some((v) => v.id === 'xue-xiao'), true);
});

test('filterVocabulary filters cleanly by chapterId and lessonId', () => {
  const ch2Words = filterVocabulary(VOCAB_LIST, {}, { chapterId: 'ch-2' });
  assert.ok(ch2Words.length > 0);
  assert.equal(ch2Words.every((w) => w.chapterId === 'ch-2'), true);

  const lesson5Words = filterVocabulary(VOCAB_LIST, {}, { lessonId: 'lesson-5' });
  assert.ok(lesson5Words.length > 0);
  assert.equal(lesson5Words.every((w) => w.lessonId === 'lesson-5'), true);
  assert.equal(lesson5Words.some((w) => w.id === 'niu-rou-mian'), true);
});

test('every lesson belongs to a valid chapter and contains vocabulary items', () => {
  const chapterIds = new Set(CHAPTERS.map((c) => c.id));
  for (const lesson of LESSONS) {
    assert.equal(chapterIds.has(lesson.chapterId), true);
    const items = filterVocabulary(VOCAB_LIST, {}, { lessonId: lesson.id });
    assert.ok(items.length >= 6, `Lesson ${lesson.id} should have at least 6 words`);
  }
});

test('filterVocabulary filters by lesson and mastery status together', () => {
  const t0 = 1_700_000_000_000;
  let state = createInitialSrsState('gong-che', t0);
  state = calculateNextReview(state, 'good', t0);
  state = calculateNextReview(state, 'good', t0 + 86_400_000);
  state = calculateNextReview(state, 'good', t0 + 7 * 86_400_000);

  const masteredLesson8 = filterVocabulary(
    VOCAB_LIST,
    { 'gong-che': state },
    { lessonId: 'lesson-8', status: 'mastered' }
  );
  assert.equal(masteredLesson8.length, 1);
  assert.equal(masteredLesson8[0].id, 'gong-che');
});

test('extractUniqueCharacters collects unique CJK characters without duplicates', () => {
  const chars = extractUniqueCharacters(VOCAB_LIST);
  assert.ok(chars.length > 80);
  assert.equal(new Set(chars).size, chars.length);
  assert.equal(chars.includes('學'), true);
  assert.equal(chars.includes('謝'), true);
  assert.equal(chars.includes('麵'), true);
});
