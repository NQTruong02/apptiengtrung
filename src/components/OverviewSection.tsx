import { useState } from 'react';
import { ArrowRight, BookOpen, PenTool, Volume2 } from 'lucide-react';
import { CHAPTERS, LESSONS, VOCAB_LIST } from '../data/vocabulary';
import {
  ChapterId,
  LessonId,
  SrsCardState,
  StrokeMasteryRecord,
  VocabItem,
} from '../types/vocab';
import { speakTraditionalChinese } from '../utils/speech';
import { extractUniqueCharacters, getVocabStatus } from '../utils/vocabFilter';

interface OverviewSectionProps {
  srsMap: Record<string, SrsCardState>;
  strokeMap: Record<string, StrokeMasteryRecord>;
  dueCount: number;
  onStartMemorize: (chapter?: ChapterId | 'all', lesson?: LessonId | 'all') => void;
  onStartWriting: (
    vocab: VocabItem,
    chapter?: ChapterId | 'all',
    lesson?: LessonId | 'all'
  ) => void;
  onOpenNotebook: (chapter?: ChapterId | 'all', lesson?: LessonId | 'all') => void;
}

export function OverviewSection({
  srsMap,
  strokeMap,
  dueCount,
  onStartMemorize,
  onStartWriting,
  onOpenNotebook,
}: OverviewSectionProps) {
  const [activeChapterTab, setActiveChapterTab] = useState<ChapterId | 'all'>('all');

  const totalWords = VOCAB_LIST.length;
  const masteredWords = VOCAB_LIST.filter(
    (v) => getVocabStatus(v.id, srsMap) === 'mastered'
  ).length;
  const learningWords = VOCAB_LIST.filter(
    (v) => getVocabStatus(v.id, srsMap) === 'learning'
  ).length;

  const uniqueChars = extractUniqueCharacters(VOCAB_LIST);
  const practicedChars = uniqueChars.filter(
    (ch) => (strokeMap[ch]?.completedCount ?? 0) > 0
  ).length;

  const featuredWord =
    VOCAB_LIST.find((v) => getVocabStatus(v.id, srsMap) === 'new') ??
    VOCAB_LIST.find((v) => getVocabStatus(v.id, srsMap) !== 'mastered') ??
    VOCAB_LIST[0];

  const featuredLesson = LESSONS.find((l) => l.id === featuredWord.lessonId);

  const visibleLessons =
    activeChapterTab === 'all'
      ? LESSONS
      : LESSONS.filter((l) => l.chapterId === activeChapterTab);

  return (
    <div className="space-y-10">
      {/* Hero Split */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-6 sm:p-8 lg:col-span-7">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-[#52525B]">
              Giáo trình Đương Đại Quyển 1 · 當代中文課程 第一冊
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#18181B] sm:text-4xl [text-wrap:balance]">
              Học tiếng Trung Phồn thể theo từng chương và từng bài Đương Đại
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#52525B]">
              Hệ thống hóa 10 bài học cốt lõi chia theo 4 chương rõ ràng. Chọn đúng bài bạn đang học để ôn thẻ ghi nhớ thông minh và luyện viết chữ Hán chuẩn từng nét.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onStartMemorize('all', 'all')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C8322B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A82620] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8322B]"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>Học thẻ ghi nhớ</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onStartWriting(featuredWord, featuredWord.chapterId, featuredWord.lessonId)
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[#D4D4D8] bg-[#FFFFFF] px-5 py-2.5 text-sm font-semibold text-[#18181B] transition-colors hover:bg-[#F4F4F5] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181B]"
            >
              <PenTool className="h-4 w-4" aria-hidden="true" />
              <span>Luyện viết chữ Hán</span>
            </button>
          </div>
        </div>

        {/* Word of the moment spotlight */}
        <div className="flex flex-col justify-between rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-6 sm:p-8 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
            <span className="text-xs font-medium text-[#52525B]">
              Gợi ý · {featuredLesson?.titleVi ?? 'Bài 1'}
            </span>
            <button
              type="button"
              onClick={() => speakTraditionalChinese(featuredWord.traditional)}
              aria-label={`Nghe phát âm từ ${featuredWord.traditional}`}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1D4ED8] transition-colors hover:bg-[#EFF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>Nghe</span>
            </button>
          </div>

          <div className="my-6 flex flex-col items-center text-center">
            <div className="font-hanzi text-6xl font-bold tracking-wider text-[#18181B] sm:text-7xl">
              {featuredWord.traditional}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-[#52525B]">
              <span className="font-medium text-[#18181B]">{featuredWord.pinyin}</span>
              <span aria-hidden="true">·</span>
              <span>{featuredWord.zhuyin}</span>
              <span aria-hidden="true">·</span>
              <span>Hán-Việt: {featuredWord.hanViet}</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-[#C8322B]">
              {featuredWord.meaningVi}
            </p>
          </div>

          <div className="border-t border-[#E4E4E7] pt-4">
            <p className="text-xs leading-relaxed text-[#52525B]">
              {featuredWord.mnemonicVi}
            </p>
            <button
              type="button"
              onClick={() =>
                onStartWriting(featuredWord, featuredWord.chapterId, featuredWord.lessonId)
              }
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#C8322B] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8322B]"
            >
              <span>Thực hành viết từ này</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Full-width 4-column Progress Strip */}
      <section aria-label="Tiến độ học tập" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-5">
          <p className="text-xs font-medium text-[#52525B]">Từ cần ôn hôm nay</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#C8322B] tabular-nums">
            {dueCount}
          </p>
          <p className="mt-1 text-xs text-[#71717A] tabular-nums">
            Trên tổng {totalWords} từ Quyển 1
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-5">
          <p className="text-xs font-medium text-[#52525B]">Đang ghi nhớ</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#B45309] tabular-nums">
            {learningWords}
          </p>
          <p className="mt-1 text-xs text-[#71717A]">
            Đang trong chu kỳ lặp lại
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-5">
          <p className="text-xs font-medium text-[#52525B]">Từ đã thuộc</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0D9488] tabular-nums">
            {masteredWords}
          </p>
          <p className="mt-1 text-xs text-[#71717A] tabular-nums">
            {Math.round((masteredWords / totalWords) * 100)}% giáo trình
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-5">
          <p className="text-xs font-medium text-[#52525B]">Chữ Hán đã luyện viết</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#18181B] tabular-nums">
            {practicedChars} / {uniqueChars.length}
          </p>
          <p className="mt-1 text-xs text-[#71717A]">
            Hoàn thành đủ thứ tự nét
          </p>
        </div>
      </section>

      {/* Chapter Overview & Lesson Selector */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#18181B]">
              Lộ trình theo Chương & Bài học (Đương Đại Quyển 1)
            </h2>
            <p className="mt-1 text-sm text-[#52525B]">
              Chọn theo từng Chương hoặc nhảy thẳng vào Bài bạn muốn học hôm nay.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenNotebook('all', 'all')}
            className="text-sm font-medium text-[#1D4ED8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          >
            Xem toàn bộ {totalWords} từ vựng
          </button>
        </div>

        {/* Chapter Filter Tabs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => setActiveChapterTab('all')}
            className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-colors ${
              activeChapterTab === 'all'
                ? 'border-[#18181B] bg-[#18181B] text-white'
                : 'border-[#E4E4E7] bg-[#FFFFFF] text-[#18181B] hover:border-[#A1A1AA]'
            }`}
          >
            <span className="font-mono text-xs opacity-75 tabular-nums">
              Toàn bộ · 10 bài
            </span>
            <span className="mt-2 text-sm font-bold">
              Tất cả các chương
            </span>
          </button>

          {CHAPTERS.map((ch) => {
            const isSelected = activeChapterTab === ch.id;
            const chLessons = LESSONS.filter((l) => l.chapterId === ch.id);
            const chWords = VOCAB_LIST.filter((w) => w.chapterId === ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChapterTab(ch.id)}
                className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-[#C8322B] bg-[#FEF2F2] text-[#18181B]'
                    : 'border-[#E4E4E7] bg-[#FFFFFF] text-[#18181B] hover:border-[#A1A1AA]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-[#71717A] tabular-nums">
                  <span>
                    Bài {chLessons[0]?.number}–{chLessons[chLessons.length - 1]?.number}
                  </span>
                  <span>{chWords.length} từ</span>
                </div>
                <span
                  className={`mt-2 text-sm font-bold ${
                    isSelected ? 'text-[#C8322B]' : 'text-[#18181B]'
                  }`}
                >
                  {ch.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Chapter Actions if filtered */}
        {activeChapterTab !== 'all' && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] px-5 py-3.5">
            <div>
              <p className="text-sm font-bold text-[#18181B]">
                {CHAPTERS.find((c) => c.id === activeChapterTab)?.title}
              </p>
              <p className="text-xs text-[#52525B]">
                {CHAPTERS.find((c) => c.id === activeChapterTab)?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenNotebook(activeChapterTab, 'all')}
                className="rounded-lg border border-[#D4D4D8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#18181B] hover:bg-[#F4F4F5] whitespace-nowrap"
              >
                Sổ tay chương này
              </button>
              <button
                type="button"
                onClick={() => onStartMemorize(activeChapterTab, 'all')}
                className="rounded-lg bg-[#C8322B] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#A82620] whitespace-nowrap"
              >
                Ôn thẻ cả chương
              </button>
            </div>
          </div>
        )}

        {/* Lesson Cards Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleLessons.map((lesson) => {
            const lessonWords = VOCAB_LIST.filter((w) => w.lessonId === lesson.id);
            const lessonMastered = lessonWords.filter(
              (w) => getVocabStatus(w.id, srsMap) === 'mastered'
            ).length;
            const firstWord = lessonWords[0];
            const chapterInfo = CHAPTERS.find((c) => c.id === lesson.chapterId);

            return (
              <div
                key={lesson.id}
                className="flex flex-col justify-between rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-6 transition-colors hover:border-[#D4D4D8]"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-mono text-xs font-medium text-[#71717A] tabular-nums">
                      Chương {chapterInfo?.number} · {lessonWords.length} từ
                    </span>
                    <span className="font-hanzi text-base font-medium text-[#52525B]">
                      {lesson.traditionalTitle}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-[#18181B]">
                    {lesson.titleVi}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#52525B]">
                    {lesson.summaryVi}
                  </p>
                  <p className="mt-3 font-hanzi text-sm text-[#71717A]">
                    Từ khóa: {lessonWords.map((w) => w.traditional).join(' · ')}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E4E7] pt-4">
                  <span className="text-xs font-medium text-[#52525B] tabular-nums">
                    Đã thuộc {lessonMastered}/{lessonWords.length} từ
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenNotebook(lesson.chapterId, lesson.id)}
                      className="text-xs font-semibold text-[#52525B] hover:text-[#18181B] whitespace-nowrap"
                    >
                      Từ vựng
                    </button>
                    {firstWord && (
                      <button
                        type="button"
                        onClick={() =>
                          onStartWriting(firstWord, lesson.chapterId, lesson.id)
                        }
                        className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap"
                      >
                        Luyện viết
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onStartMemorize(lesson.chapterId, lesson.id)}
                      className="rounded-md bg-[#18181B] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#27272A] whitespace-nowrap"
                    >
                      Học bài này
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
