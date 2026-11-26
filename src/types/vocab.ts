export type ChapterId = 'ch-1' | 'ch-2' | 'ch-3' | 'ch-4';

export type LessonId =
  | 'lesson-1'
  | 'lesson-2'
  | 'lesson-3'
  | 'lesson-4'
  | 'lesson-5'
  | 'lesson-6'
  | 'lesson-7'
  | 'lesson-8'
  | 'lesson-9'
  | 'lesson-10';

export type AppTab = 'overview' | 'memorize' | 'write' | 'notebook';

export type MasteryStatus = 'new' | 'learning' | 'mastered';

export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy';

export interface VocabExample {
  traditional: string;
  pinyin: string;
  meaningVi: string;
}

export interface VocabItem {
  id: string;
  traditional: string;
  simplified?: string;
  pinyin: string;
  zhuyin: string;
  hanViet: string;
  meaningVi: string;
  chapterId: ChapterId;
  lessonId: LessonId;
  mnemonicVi: string;
  example: VocabExample;
}

export interface ChapterInfo {
  id: ChapterId;
  number: number;
  title: string;
  traditionalTitle: string;
  description: string;
}

export interface LessonInfo {
  id: LessonId;
  chapterId: ChapterId;
  number: number;
  titleVi: string;
  traditionalTitle: string;
  summaryVi: string;
}

export interface SrsCardState {
  vocabId: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt: number | null;
  nextReviewAt: number;
  status: MasteryStatus;
}

export interface StrokeMasteryRecord {
  char: string;
  attempts: number;
  completedCount: number;
  bestAccuracy: number; // 0-100
  lastPracticedAt: number;
}

export interface UserPreferences {
  showZhuyin: boolean;
  showHanViet: boolean;
  showPinyinOnFront: boolean;
}

export interface CharacterJson {
  strokes: string[];
  medians: number[][][];
  radStrokes?: number[];
}
