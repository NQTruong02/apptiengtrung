import { CHAPTERS, LESSONS, VOCAB_LIST } from '../data/vocabulary';
import { ChapterId, LessonId } from '../types/vocab';

interface CurriculumFilterBarProps {
  selectedChapter: ChapterId | 'all';
  selectedLesson: LessonId | 'all';
  onChangeChapter: (chapter: ChapterId | 'all') => void;
  onChangeLesson: (lesson: LessonId | 'all') => void;
  rightSlot?: React.ReactNode;
}

export function CurriculumFilterBar({
  selectedChapter,
  selectedLesson,
  onChangeChapter,
  onChangeLesson,
  rightSlot,
}: CurriculumFilterBarProps) {
  const availableLessons =
    selectedChapter === 'all'
      ? LESSONS
      : LESSONS.filter((l) => l.chapterId === selectedChapter);

  return (
    <div className="space-y-3 rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              onChangeChapter('all');
              onChangeLesson('all');
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              selectedChapter === 'all' && selectedLesson === 'all'
                ? 'bg-[#18181B] text-white'
                : 'text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]'
            }`}
          >
            Tất cả ({VOCAB_LIST.length})
          </button>
          {CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => {
                onChangeChapter(ch.id);
                onChangeLesson('all');
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                selectedChapter === ch.id && selectedLesson === 'all'
                  ? 'bg-[#18181B] text-white'
                  : selectedChapter === ch.id
                  ? 'bg-[#F4F4F5] text-[#18181B] font-semibold'
                  : 'text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              Chương {ch.number}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="lesson-filter-select"
            className="text-xs font-medium text-[#52525B] whitespace-nowrap"
          >
            Chọn bài:
          </label>
          <select
            id="lesson-filter-select"
            value={selectedLesson}
            onChange={(e) => {
              const val = e.target.value as LessonId | 'all';
              onChangeLesson(val);
              if (val !== 'all') {
                const found = LESSONS.find((l) => l.id === val);
                if (found) onChangeChapter(found.chapterId);
              }
            }}
            className="rounded-lg border border-[#D4D4D8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#18181B] focus:border-[#18181B] focus:outline-none"
          >
            <option value="all">
              {selectedChapter === 'all'
                ? 'Tất cả 10 bài (Quyển 1)'
                : `Tất cả các bài trong Chương ${
                    CHAPTERS.find((c) => c.id === selectedChapter)?.number ?? ''
                  }`}
            </option>
            {availableLessons.map((lesson) => {
              const count = VOCAB_LIST.filter(
                (v) => v.lessonId === lesson.id
              ).length;
              return (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.titleVi} ({count} từ)
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {rightSlot && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E4E7] pt-3">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
