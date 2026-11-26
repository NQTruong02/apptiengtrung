import { useMemo, useState } from 'react';
import { BookOpen, PenTool, Search, Volume2, X } from 'lucide-react';
import { LESSONS, VOCAB_LIST } from '../data/vocabulary';
import {
  ChapterId,
  LessonId,
  MasteryStatus,
  SrsCardState,
  VocabItem,
} from '../types/vocab';
import { speakTraditionalChinese } from '../utils/speech';
import {
  filterVocabulary,
  getVocabStatus,
  StatusFilter,
} from '../utils/vocabFilter';
import { CurriculumFilterBar } from './CurriculumFilterBar';

interface VocabNotebookProps {
  srsMap: Record<string, SrsCardState>;
  selectedChapter: ChapterId | 'all';
  selectedLesson: LessonId | 'all';
  onChangeChapter: (chapter: ChapterId | 'all') => void;
  onChangeLesson: (lesson: LessonId | 'all') => void;
  onPracticeFlashcard: (vocab: VocabItem) => void;
  onPracticeWrite: (vocab: VocabItem) => void;
}

const STATUS_META: Record<
  MasteryStatus,
  { label: string; colorClass: string }
> = {
  new: { label: 'Từ mới', colorClass: 'text-[#71717A]' },
  learning: { label: 'Đang học', colorClass: 'text-[#B45309]' },
  mastered: { label: 'Đã thuộc', colorClass: 'text-[#0F766E]' },
};

export function VocabNotebook({
  srsMap,
  selectedChapter,
  selectedLesson,
  onChangeChapter,
  onChangeLesson,
  onPracticeFlashcard,
  onPracticeWrite,
}: VocabNotebookProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredWords = useMemo(() => {
    return filterVocabulary(VOCAB_LIST, srsMap, {
      chapterId: selectedChapter,
      lessonId: selectedLesson,
      status: statusFilter,
      query,
    });
  }, [srsMap, selectedChapter, selectedLesson, statusFilter, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">
          Sổ tay từ vựng Đương Đại
        </h1>
        <p className="mt-1 text-sm text-[#52525B] tabular-nums">
          Tra cứu {VOCAB_LIST.length} từ vựng Giáo trình Đương Đại Quyển 1 theo từng Chương, từng Bài kèm Pinyin, Chú âm và Hán-Việt.
        </p>
      </div>

      {/* Chapter / Lesson + Search & Status Filters */}
      <CurriculumFilterBar
        selectedChapter={selectedChapter}
        selectedLesson={selectedLesson}
        onChangeChapter={onChangeChapter}
        onChangeLesson={onChangeLesson}
        rightSlot={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]"
                aria-hidden="true"
              />
              <label htmlFor="vocab-search" className="sr-only">
                Tìm kiếm từ vựng
              </label>
              <input
                id="vocab-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo chữ Hán, Pinyin, Hán-Việt hoặc nghĩa tiếng Việt..."
                className="w-full rounded-lg border border-[#D4D4D8] bg-[#FFFFFF] py-2 pl-9 pr-9 text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#18181B] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#71717A] hover:text-[#18181B]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div
              role="group"
              aria-label="Lọc theo trạng thái ghi nhớ"
              className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F4F4F5] p-1"
            >
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'new', label: 'Từ mới' },
                  { id: 'learning', label: 'Đang học' },
                  { id: 'mastered', label: 'Đã thuộc' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === s.id
                      ? 'bg-[#FFFFFF] text-[#18181B] shadow-xs'
                      : 'text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Results Count */}
      <p className="text-xs font-medium text-[#71717A] tabular-nums">
        Hiển thị {filteredWords.length} / {VOCAB_LIST.length} từ vựng
      </p>

      {/* Word Grid */}
      {filteredWords.length === 0 ? (
        <div className="rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-10 text-center">
          <p className="text-base font-semibold text-[#18181B]">
            Không tìm thấy từ vựng phù hợp
          </p>
          <p className="mt-1 text-sm text-[#52525B]">
            Thử xóa bộ lọc hoặc tìm bằng nghĩa tiếng Việt không dấu, Pinyin hoặc Hán tự.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setStatusFilter('all');
              onChangeChapter('all');
              onChangeLesson('all');
            }}
            className="mt-4 rounded-lg bg-[#18181B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#27272A]"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredWords.map((word) => {
            const status = getVocabStatus(word.id, srsMap);
            const statusInfo = STATUS_META[status];
            const lessonTitle =
              LESSONS.find((l) => l.id === word.lessonId)?.titleVi ?? '';

            return (
              <article
                key={word.id}
                className="flex flex-col justify-between rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                        <span>{lessonTitle}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold ${statusInfo.colorClass}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-3">
                        <h2 className="font-hanzi text-3xl font-bold text-[#18181B]">
                          {word.traditional}
                        </h2>
                        <span className="text-sm font-medium text-[#52525B]">
                          {word.pinyin}
                        </span>
                        <span className="text-xs text-[#71717A]">
                          {word.zhuyin}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakTraditionalChinese(word.traditional)}
                      aria-label={`Nghe phát âm từ ${word.traditional}`}
                      className="rounded-lg p-2 text-[#1D4ED8] transition-colors hover:bg-[#EFF6FF]"
                    >
                      <Volume2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-base font-bold text-[#C8322B]">
                      {word.meaningVi}
                    </p>
                    <span className="text-xs font-medium text-[#52525B]">
                      Hán-Việt: {word.hanViet}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-[#52525B]">
                    {word.mnemonicVi}
                  </p>
                </div>

                <div className="mt-4 space-y-3 border-t border-[#E4E4E7] pt-3">
                  <p className="text-xs leading-relaxed text-[#52525B]">
                    <span className="font-hanzi font-medium text-[#18181B]">
                      {word.example.traditional}
                    </span>{' '}
                    — {word.example.meaningVi}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onPracticeFlashcard(word)}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B] whitespace-nowrap"
                    >
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Ôn thẻ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPracticeWrite(word)}
                      className="inline-flex items-center gap-1 rounded-md bg-[#18181B] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#27272A] whitespace-nowrap"
                    >
                      <PenTool className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Luyện viết</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
