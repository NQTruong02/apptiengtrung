import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  PenTool,
  RotateCcw,
  Volume2,
  XCircle,
} from 'lucide-react';
import { CHAPTERS, LESSONS, VOCAB_LIST } from '../data/vocabulary';
import {
  ChapterId,
  LessonId,
  ReviewQuality,
  SrsCardState,
  UserPreferences,
  VocabItem,
} from '../types/vocab';
import { speakTraditionalChinese } from '../utils/speech';
import {
  buildQuizOptions,
  formatIntervalLabel,
  getDueQueue,
} from '../utils/srs';
import { filterVocabulary } from '../utils/vocabFilter';
import { CurriculumFilterBar } from './CurriculumFilterBar';

interface FlashcardPracticeProps {
  srsMap: Record<string, SrsCardState>;
  selectedChapter: ChapterId | 'all';
  selectedLesson: LessonId | 'all';
  onChangeChapter: (chapter: ChapterId | 'all') => void;
  onChangeLesson: (lesson: LessonId | 'all') => void;
  prefs: UserPreferences;
  onTogglePref: (key: keyof UserPreferences) => void;
  onReviewCard: (vocabId: string, quality: ReviewQuality) => void;
  onPracticeWrite: (vocab: VocabItem) => void;
  initialVocabId?: string | null;
}

type MemorizeMode = 'flashcard' | 'quiz';

export function FlashcardPractice({
  srsMap,
  selectedChapter,
  selectedLesson,
  onChangeChapter,
  onChangeLesson,
  prefs,
  onTogglePref,
  onReviewCard,
  onPracticeWrite,
  initialVocabId,
}: FlashcardPracticeProps) {
  const [mode, setMode] = useState<MemorizeMode>('flashcard');
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const [practiceAllMode, setPracticeAllMode] = useState(false);
  const [allIndex, setAllIndex] = useState(0);

  // Quiz mode state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  const topicPool = useMemo(() => {
    return filterVocabulary(VOCAB_LIST, srsMap, {
      chapterId: selectedChapter,
      lessonId: selectedLesson,
    });
  }, [srsMap, selectedChapter, selectedLesson]);

  const dueQueue = useMemo(() => {
    return getDueQueue(topicPool, srsMap);
  }, [topicPool, srsMap]);

  // Reset indices when chapter/lesson changes
  useEffect(() => {
    setAllIndex(0);
    setQuizIndex(0);
    setIsFlipped(false);
    setSelectedOptionId(null);
  }, [selectedChapter, selectedLesson]);

  // Support jumping directly to a specific word from Notebook
  useEffect(() => {
    if (!initialVocabId) return;
    const idx = topicPool.findIndex((item) => item.id === initialVocabId);
    if (idx >= 0) {
      setPracticeAllMode(true);
      setAllIndex(idx);
      setIsFlipped(false);
      setMode('flashcard');
    }
  }, [initialVocabId, topicPool]);

  const currentCard: VocabItem | undefined = practiceAllMode
    ? topicPool[allIndex % Math.max(1, topicPool.length)]
    : dueQueue[0];

  const quizTarget = topicPool[quizIndex % Math.max(1, topicPool.length)];
  const quizOptions = useMemo(() => {
    if (!quizTarget) return [];
    return buildQuizOptions(quizTarget, VOCAB_LIST, quizIndex + 1);
  }, [quizTarget, quizIndex]);

  const handleGradeCard = (quality: ReviewQuality) => {
    if (!currentCard) return;
    onReviewCard(currentCard.id, quality);
    setSessionReviewed((prev) => prev + 1);
    setIsFlipped(false);
    if (practiceAllMode) {
      setAllIndex((prev) => (prev + 1) % Math.max(1, topicPool.length));
    }
  };

  useEffect(() => {
    if (mode !== 'flashcard' || !currentCard) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleGradeCard('again');
        else if (e.key === '2') handleGradeCard('hard');
        else if (e.key === '3') handleGradeCard('good');
        else if (e.key === '4') handleGradeCard('easy');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleSelectQuizOption = (optionId: string) => {
    if (selectedOptionId !== null || !quizTarget) return;
    setSelectedOptionId(optionId);
    const isCorrect = optionId === quizTarget.id;
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    onReviewCard(quizTarget.id, isCorrect ? 'good' : 'again');
  };

  const handleNextQuiz = () => {
    setSelectedOptionId(null);
    setQuizIndex((prev) => (prev + 1) % Math.max(1, topicPool.length));
  };

  const activeScopeLabel = useMemo(() => {
    if (selectedLesson !== 'all') {
      return LESSONS.find((l) => l.id === selectedLesson)?.titleVi ?? '';
    }
    if (selectedChapter !== 'all') {
      return CHAPTERS.find((c) => c.id === selectedChapter)?.title ?? '';
    }
    return 'Toàn bộ Đương Đại Quyển 1';
  }, [selectedChapter, selectedLesson]);

  return (
    <div className="space-y-6">
      {/* Header & Mode Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">
            Ghi nhớ từ vựng
          </h1>
          <p className="mt-1 text-sm text-[#52525B] tabular-nums">
            {activeScopeLabel} ·{' '}
            {dueQueue.length > 0
              ? `Còn ${dueQueue.length}/${topicPool.length} thẻ đến hạn ôn · Đã ôn ${sessionReviewed} thẻ`
              : `Đã hoàn thành toàn bộ ${topicPool.length} thẻ đến hạn · Đã ôn ${sessionReviewed} thẻ`}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Chế độ ghi nhớ"
          className="inline-flex items-center gap-1 rounded-lg bg-[#E4E4E7]/70 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'flashcard'}
            onClick={() => setMode('flashcard')}
            className={`rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'flashcard'
                ? 'bg-[#FFFFFF] text-[#18181B] shadow-xs'
                : 'text-[#52525B] hover:text-[#18181B]'
            }`}
          >
            Thẻ ghi nhớ (SRS)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'quiz'}
            onClick={() => {
              setMode('quiz');
              setSelectedOptionId(null);
            }}
            className={`rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'quiz'
                ? 'bg-[#FFFFFF] text-[#18181B] shadow-xs'
                : 'text-[#52525B] hover:text-[#18181B]'
            }`}
          >
            Trắc nghiệm nhanh
          </button>
        </div>
      </div>

      {/* Chapter / Lesson Filter Bar & Hint Toggles */}
      <CurriculumFilterBar
        selectedChapter={selectedChapter}
        selectedLesson={selectedLesson}
        onChangeChapter={onChangeChapter}
        onChangeLesson={onChangeLesson}
        rightSlot={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#71717A]">
              Phím tắt: Space để lật thẻ · 1–4 để đánh giá
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onTogglePref('showPinyinOnFront')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52525B] hover:text-[#18181B] whitespace-nowrap"
              >
                {prefs.showPinyinOnFront ? (
                  <Eye className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>Gợi ý Pinyin mặt trước</span>
              </button>

              <button
                type="button"
                onClick={() => onTogglePref('showZhuyin')}
                className={`text-xs font-medium whitespace-nowrap ${
                  prefs.showZhuyin ? 'text-[#1D4ED8]' : 'text-[#71717A]'
                }`}
              >
                {prefs.showZhuyin ? 'Đang hiện Chú âm' : 'Hiện Chú âm'}
              </button>
            </div>
          </div>
        }
      />

      {/* Mode 1: Spaced Repetition Flashcard */}
      {mode === 'flashcard' && (
        <div className="mx-auto max-w-2xl space-y-5">
          {!currentCard ? (
            <div className="rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-8 text-center">
              <CheckCircle2
                className="mx-auto h-10 w-10 text-[#0D9488]"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-xl font-bold text-[#18181B]">
                Tuyệt vời! Đã ôn hết thẻ đến hạn
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#52525B]">
                Bạn đã hoàn thành các thẻ cần ôn trong phạm vi đang chọn. Bạn có thể ôn lại tự do toàn bộ bài này hoặc chuyển sang luyện viết.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPracticeAllMode(true);
                    setAllIndex(0);
                    setIsFlipped(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#18181B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#27272A]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Ôn tự do toàn bộ phạm vi này</span>
                </button>
                {topicPool[0] && (
                  <button
                    type="button"
                    onClick={() => onPracticeWrite(topicPool[0])}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#D4D4D8] bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
                  >
                    <PenTool className="h-4 w-4" aria-hidden="true" />
                    <span>Chuyển sang luyện viết</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {practiceAllMode && (
                <div className="flex items-center justify-between text-xs text-[#52525B]">
                  <span className="tabular-nums">
                    Chế độ ôn tự do · Thẻ {(allIndex % topicPool.length) + 1} /{' '}
                    {topicPool.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPracticeAllMode(false);
                      setIsFlipped(false);
                    }}
                    className="font-medium text-[#1D4ED8] hover:underline"
                  >
                    Quay lại thẻ đến hạn ({dueQueue.length})
                  </button>
                </div>
              )}

              {/* Flashcard Surface */}
              <div
                data-testid="flashcard-container"
                className="rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-6 sm:p-8"
              >
                <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
                  <span className="text-xs font-medium text-[#52525B]">
                    {LESSONS.find((l) => l.id === currentCard.lessonId)?.titleVi}
                    {currentCard.simplified
                      ? ` · Giản thể: ${currentCard.simplified}`
                      : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakTraditionalChinese(currentCard.traditional)}
                      aria-label={`Nghe phát âm từ ${currentCard.traditional}`}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1D4ED8] transition-colors hover:bg-[#EFF6FF]"
                    >
                      <Volume2 className="h-4 w-4" aria-hidden="true" />
                      <span>Phát âm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPracticeWrite(currentCard)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#52525B] transition-colors hover:bg-[#F4F4F5] hover:text-[#18181B]"
                    >
                      <PenTool className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Viết chữ</span>
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="py-10 text-center">
                  <div className="font-hanzi text-7xl font-bold tracking-wider text-[#18181B] sm:text-8xl">
                    {currentCard.traditional}
                  </div>

                  {(isFlipped || prefs.showPinyinOnFront) && (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-base text-[#52525B]">
                      <span className="font-semibold text-[#18181B]">
                        {currentCard.pinyin}
                      </span>
                      {prefs.showZhuyin && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{currentCard.zhuyin}</span>
                        </>
                      )}
                    </div>
                  )}

                  {isFlipped ? (
                    <div className="mt-6 space-y-4 border-t border-[#E4E4E7] pt-6 text-left">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-2xl font-bold text-[#C8322B]">
                          {currentCard.meaningVi}
                        </p>
                        {prefs.showHanViet && (
                          <span className="text-sm font-medium text-[#52525B]">
                            Hán-Việt: {currentCard.hanViet}
                          </span>
                        )}
                      </div>

                      <p className="text-sm leading-relaxed text-[#52525B]">
                        <strong className="font-semibold text-[#18181B]">
                          Mẹo nhớ:{' '}
                        </strong>
                        {currentCard.mnemonicVi}
                      </p>

                      <div className="border-t border-[#E4E4E7] pt-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-hanzi text-lg font-medium text-[#18181B]">
                            {currentCard.example.traditional}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              speakTraditionalChinese(
                                currentCard.example.traditional
                              )
                            }
                            aria-label="Nghe câu ví dụ"
                            className="rounded-md p-1.5 text-[#1D4ED8] hover:bg-[#EFF6FF]"
                          >
                            <Volume2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-[#71717A]">
                          {currentCard.example.pinyin}
                        </p>
                        <p className="mt-1 text-sm text-[#52525B]">
                          {currentCard.example.meaningVi}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-6 text-xs text-[#71717A]">
                      Nhấn nút bên dưới hoặc phím Space để lật mặt sau kiểm tra nghĩa
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="border-t border-[#E4E4E7] pt-4">
                  {!isFlipped ? (
                    <button
                      type="button"
                      onClick={() => setIsFlipped(true)}
                      className="w-full rounded-lg bg-[#18181B] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#27272A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181B]"
                    >
                      Lật thẻ xem đáp án
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-center text-xs font-medium text-[#52525B]">
                        Đánh giá mức độ ghi nhớ của bạn:
                      </p>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {(
                          [
                            {
                              q: 'again',
                              label: 'Quên rồi',
                              style:
                                'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]',
                            },
                            {
                              q: 'hard',
                              label: 'Hơi khó',
                              style:
                                'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7]',
                            },
                            {
                              q: 'good',
                              label: 'Đã nhớ',
                              style:
                                'border-[#99F6E4] bg-[#F0FDFA] text-[#0F766E] hover:bg-[#CCFBF1]',
                            },
                            {
                              q: 'easy',
                              label: 'Rất dễ',
                              style:
                                'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]',
                            },
                          ] as const
                        ).map((btn) => (
                          <button
                            key={btn.q}
                            type="button"
                            onClick={() => handleGradeCard(btn.q)}
                            className={`flex flex-col items-center rounded-lg border px-3 py-2.5 text-center transition-colors ${btn.style}`}
                          >
                            <span className="text-xs font-semibold">
                              {btn.label}
                            </span>
                            <span className="mt-0.5 font-mono text-[11px] opacity-80 tabular-nums">
                              {formatIntervalLabel(btn.q, srsMap[currentCard.id])}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mode 2: Multiple Choice Quiz */}
      {mode === 'quiz' && quizTarget && (
        <div className="mx-auto max-w-2xl rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
            <span className="text-xs font-medium text-[#52525B] tabular-nums">
              Câu {(quizIndex % topicPool.length) + 1} / {topicPool.length} · Đúng{' '}
              {quizScore.correct}/{quizScore.total}
            </span>
            <button
              type="button"
              onClick={() => speakTraditionalChinese(quizTarget.traditional)}
              aria-label={`Nghe phát âm từ ${quizTarget.traditional}`}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1D4ED8] hover:bg-[#EFF6FF]"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>Nghe từ</span>
            </button>
          </div>

          <div className="py-8 text-center">
            <p className="text-xs font-medium text-[#71717A]">
              Chọn nghĩa tiếng Việt đúng cho từ Phồn thể sau:
            </p>
            <div className="mt-3 font-hanzi text-6xl font-bold tracking-wider text-[#18181B]">
              {quizTarget.traditional}
            </div>
            <p className="mt-2 text-sm text-[#52525B]">
              {quizTarget.pinyin}
              {prefs.showZhuyin ? ` · ${quizTarget.zhuyin}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quizOptions.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const isCorrect = opt.id === quizTarget.id;
              const isAnswered = selectedOptionId !== null;

              let buttonStyle =
                'border-[#E4E4E7] bg-[#FFFFFF] text-[#18181B] hover:border-[#18181B] hover:bg-[#F7F8FA]';
              if (isAnswered) {
                if (isCorrect) {
                  buttonStyle = 'border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]';
                } else if (isSelected) {
                  buttonStyle = 'border-[#DC2626] bg-[#FEF2F2] text-[#B91C1C]';
                } else {
                  buttonStyle = 'border-[#E4E4E7] bg-[#FAFAFA] text-[#71717A]';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectQuizOption(opt.id)}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3.5 text-left transition-colors ${buttonStyle}`}
                >
                  <div>
                    <div className="text-sm font-semibold">{opt.meaningVi}</div>
                    {isAnswered && (
                      <div className="mt-0.5 text-xs opacity-80">
                        {opt.traditional} · {opt.hanViet}
                      </div>
                    )}
                  </div>
                  {isAnswered && isCorrect && (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-[#0D9488]"
                      aria-hidden="true"
                    />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle
                      className="h-4 w-4 shrink-0 text-[#DC2626]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {selectedOptionId !== null && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#E4E4E7] pt-4">
              <p className="text-sm text-[#52525B]">
                {selectedOptionId === quizTarget.id ? (
                  <span className="font-semibold text-[#0F766E]">
                    Chính xác! Đã ghi nhận vào tiến độ ôn tập.
                  </span>
                ) : (
                  <span className="font-semibold text-[#B91C1C]">
                    Chưa đúng — Đáp án là “{quizTarget.meaningVi}” (
                    {quizTarget.hanViet}).
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={handleNextQuiz}
                className="rounded-lg bg-[#18181B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#27272A]"
              >
                Câu tiếp theo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
