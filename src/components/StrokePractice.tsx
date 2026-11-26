import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lightbulb,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import charStrokeDataRaw from '../data/charStrokeData.json';
import { LESSONS, VOCAB_LIST } from '../data/vocabulary';
import {
  ChapterId,
  CharacterJson,
  LessonId,
  StrokeMasteryRecord,
  VocabItem,
} from '../types/vocab';
import { speakTraditionalChinese } from '../utils/speech';
import { calculateWritingAccuracy } from '../utils/srs';
import { filterVocabulary } from '../utils/vocabFilter';
import { CurriculumFilterBar } from './CurriculumFilterBar';

const CHAR_STROKE_MAP = charStrokeDataRaw as Record<string, CharacterJson>;

interface StrokePracticeProps {
  activeVocab: VocabItem;
  onSelectVocab: (vocab: VocabItem) => void;
  selectedChapter: ChapterId | 'all';
  selectedLesson: LessonId | 'all';
  onChangeChapter: (chapter: ChapterId | 'all') => void;
  onChangeLesson: (lesson: LessonId | 'all') => void;
  strokeMap: Record<string, StrokeMasteryRecord>;
  onCompleteCharacter: (char: string, accuracy: number) => void;
}

type WritingMode = 'quiz' | 'animate';

export function StrokePractice({
  activeVocab,
  onSelectVocab,
  selectedChapter,
  selectedLesson,
  onChangeChapter,
  onChangeLesson,
  strokeMap,
  onCompleteCharacter,
}: StrokePracticeProps) {
  const scopedPool = useMemo(() => {
    const filtered = filterVocabulary(VOCAB_LIST, {}, {
      chapterId: selectedChapter,
      lessonId: selectedLesson,
    });
    return filtered.length > 0 ? filtered : VOCAB_LIST;
  }, [selectedChapter, selectedLesson]);

  // Keep activeVocab synced with the selected chapter/lesson if current word is outside scope
  useEffect(() => {
    if (!scopedPool.some((v) => v.id === activeVocab.id)) {
      onSelectVocab(scopedPool[0]);
    }
  }, [scopedPool, activeVocab.id, onSelectVocab]);

  const wordChars = useMemo(() => {
    const chars = Array.from(activeVocab.traditional).filter((c) =>
      /[\u4e00-\u9fff]/.test(c)
    );
    return chars.length > 0 ? chars : ['你'];
  }, [activeVocab]);

  const [charIndex, setCharIndex] = useState(0);
  const [customChar, setCustomChar] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const [mode, setMode] = useState<WritingMode>('quiz');
  const [showOutline, setShowOutline] = useState(true);
  const [highlightRadical, setHighlightRadical] = useState(true);
  const [speed, setSpeed] = useState(1.0);

  // Live writing state
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedbackText, setFeedbackText] = useState(
    'Dùng chuột hoặc ngón tay vẽ nét đầu tiên theo đúng thứ tự.'
  );
  const [feedbackTone, setFeedbackTone] = useState<
    'neutral' | 'success' | 'error'
  >('neutral');
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionCompletedChars, setSessionCompletedChars] = useState<
    Record<string, boolean>
  >({});

  const writerHostRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const onCompleteRef = useRef(onCompleteCharacter);
  onCompleteRef.current = onCompleteCharacter;

  const activeChar = customChar ?? wordChars[charIndex % wordChars.length] ?? '你';
  const charJson = CHAR_STROKE_MAP[activeChar];
  const hasStrokeData = Boolean(charJson);

  // Reset character index when word changes
  useEffect(() => {
    setCharIndex(0);
    setCustomChar(null);
    setCustomError(null);
  }, [activeVocab.id]);

  const startQuizMode = useCallback((writer: HanziWriter, strokeTotal: number) => {
    setIsCompleted(false);
    setCurrentStrokeIndex(0);
    setMistakes(0);
    setFeedbackTone('neutral');
    setFeedbackText('Vẽ từ nét số 1 theo chiều bút thuận chuẩn.');

    writer.quiz({
      leniency: 1.15,
      showHintAfterMisses: 2,
      highlightOnComplete: true,
      onCorrectStroke: (data) => {
        const nextIdx = data.strokeNum + 1;
        setCurrentStrokeIndex(nextIdx);
        setMistakes(data.totalMistakes);
        setFeedbackTone('success');
        if (data.strokesRemaining > 0) {
          setFeedbackText(
            `Đúng nét ${nextIdx}/${strokeTotal}. Tiếp tục nét số ${nextIdx + 1}.`
          );
        }
      },
      onMistake: (data) => {
        setMistakes(data.totalMistakes);
        setFeedbackTone('error');
        setFeedbackText(
          `Chưa đúng hướng hoặc thứ tự nét ${data.strokeNum + 1}. Hãy thử lại hoặc nhấn Gợi ý.`
        );
      },
      onComplete: (summary) => {
        setIsCompleted(true);
        setCurrentStrokeIndex(strokeTotal);
        setMistakes(summary.totalMistakes);
        const accuracy = calculateWritingAccuracy(
          strokeTotal,
          summary.totalMistakes
        );
        setFeedbackTone('success');
        setFeedbackText(
          `Hoàn thành chữ ${summary.character}! Độ chính xác: ${accuracy}%.`
        );
        setSessionCompletedChars((prev) => ({
          ...prev,
          [summary.character]: true,
        }));
        onCompleteRef.current(summary.character, accuracy);
      },
    });
  }, []);

  // Initialize HanziWriter whenever character or visual toggles change
  useEffect(() => {
    const container = writerHostRef.current;
    if (!container) return;
    container.innerHTML = '';
    writerRef.current = null;

    if (!charJson) {
      setTotalStrokes(0);
      return;
    }

    const strokeTotal = charJson.strokes.length;
    setTotalStrokes(strokeTotal);
    setCurrentStrokeIndex(0);
    setMistakes(0);
    setIsCompleted(false);

    const size = window.innerWidth < 420 ? 290 : 330;

    const writer = HanziWriter.create(container, activeChar, {
      width: size,
      height: size,
      padding: 20,
      showOutline,
      showCharacter: mode === 'animate',
      strokeColor: '#18181B',
      radicalColor: highlightRadical ? '#C8322B' : '#18181B',
      outlineColor: '#D4D4D8',
      highlightColor: '#1D4ED8',
      drawingColor: '#18181B',
      drawingWidth: 6,
      strokeAnimationSpeed: speed,
      delayBetweenStrokes: Math.round(350 / speed),
      charDataLoader: (ch, onLoad, onError) => {
        const data = CHAR_STROKE_MAP[ch];
        if (data) {
          onLoad(data);
        } else {
          onError(new Error(`Missing data for ${ch}`));
        }
      },
    });

    writerRef.current = writer;

    if (mode === 'quiz') {
      startQuizMode(writer, strokeTotal);
    } else {
      setFeedbackTone('neutral');
      setFeedbackText(
        `Chữ ${activeChar} có ${strokeTotal} nét. Nhấn "Chạy mẫu nét" hoặc chọn từng nét bên phải.`
      );
      writer.animateCharacter();
    }

    return () => {
      try {
        writer.cancelQuiz();
        writer.pauseAnimation();
      } catch {
        // Ignore cleanup errors
      }
      container.innerHTML = '';
    };
  }, [
    activeChar,
    charJson,
    mode,
    showOutline,
    highlightRadical,
    speed,
    startQuizMode,
  ]);

  const handleReplay = () => {
    const writer = writerRef.current;
    if (!writer || !charJson) return;
    if (mode === 'quiz') {
      startQuizMode(writer, charJson.strokes.length);
    } else {
      writer.animateCharacter();
    }
  };

  const handleHintStroke = () => {
    const writer = writerRef.current;
    if (!writer || !charJson || isCompleted) return;
    const strokeIdx = Math.min(currentStrokeIndex, charJson.strokes.length - 1);
    writer.highlightStroke(strokeIdx);
    setFeedbackTone('neutral');
    setFeedbackText(
      `Đang gợi ý nét số ${strokeIdx + 1}/${charJson.strokes.length}.`
    );
  };

  const handleAnimateSingleStroke = (idx: number) => {
    const writer = writerRef.current;
    if (!writer) return;
    if (mode === 'quiz') {
      setMode('animate');
      setTimeout(() => {
        writerRef.current?.animateStroke(idx);
      }, 60);
    } else {
      writer.animateStroke(idx);
    }
  };

  const handleApplyCustomChar = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    const firstHanzi = Array.from(trimmed).find((c) => /[\u4e00-\u9fff]/.test(c));
    if (!firstHanzi) {
      setCustomError('Vui lòng nhập ít nhất 1 chữ Hán (ví dụ: 學, 愛, 茶).');
      return;
    }
    if (!CHAR_STROKE_MAP[firstHanzi]) {
      setCustomError(
        `Chữ "${firstHanzi}" chưa có trong kho dữ liệu offline. Hãy chọn từ trong danh sách hoặc các chữ như 學, 謝, 愛, 麵.`
      );
      return;
    }
    setCustomError(null);
    setCustomChar(firstHanzi);
    setCustomInput('');
  };

  const currentScopedIndex = Math.max(
    0,
    scopedPool.findIndex((v) => v.id === activeVocab.id)
  );
  const handlePrevWord = () => {
    const prevIdx =
      (currentScopedIndex - 1 + scopedPool.length) % scopedPool.length;
    onSelectVocab(scopedPool[prevIdx]);
  };
  const handleNextWord = () => {
    const nextIdx = (currentScopedIndex + 1) % scopedPool.length;
    onSelectVocab(scopedPool[nextIdx]);
  };

  const masteryRecord = strokeMap[activeChar];
  const activeLessonInfo = LESSONS.find((l) => l.id === activeVocab.lessonId);

  return (
    <div className="space-y-6">
      {/* Page Title & Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">
            Luyện viết chữ Hán từng nét
          </h1>
          <p className="mt-1 text-sm text-[#52525B]">
            Chọn Chương hoặc Bài đang học trong Đương Đại để luyện viết đúng các chữ của bài đó.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Chế độ luyện viết"
          className="inline-flex items-center gap-1 rounded-lg bg-[#E4E4E7]/70 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'quiz'}
            onClick={() => setMode('quiz')}
            className={`rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'quiz'
                ? 'bg-[#FFFFFF] text-[#18181B] shadow-xs'
                : 'text-[#52525B] hover:text-[#18181B]'
            }`}
          >
            Tập viết từng nét
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'animate'}
            onClick={() => setMode('animate')}
            className={`rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'animate'
                ? 'bg-[#FFFFFF] text-[#18181B] shadow-xs'
                : 'text-[#52525B] hover:text-[#18181B]'
            }`}
          >
            Xem mẫu bút thuận
          </button>
        </div>
      </div>

      {/* Chapter & Lesson Scope Selector */}
      <CurriculumFilterBar
        selectedChapter={selectedChapter}
        selectedLesson={selectedLesson}
        onChangeChapter={onChangeChapter}
        onChangeLesson={onChangeLesson}
      />

      {/* Two-Zone Educational Sandbox Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Zone (Interactive Writing Stage - 7 cols) */}
        <section className="rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-5 sm:p-6 lg:col-span-7">
          {/* Character switcher for multi-character word */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E4E7] pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#52525B]">
                Chữ đang viết:
              </span>
              {wordChars.map((ch, idx) => {
                const isSelected = !customChar && idx === charIndex;
                const isDone =
                  sessionCompletedChars[ch] ||
                  (strokeMap[ch]?.completedCount ?? 0) > 0;
                return (
                  <button
                    key={`${ch}-${idx}`}
                    type="button"
                    onClick={() => {
                      setCustomChar(null);
                      setCharIndex(idx);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-hanzi text-xl font-bold transition-colors ${
                      isSelected
                        ? 'border-[#C8322B] bg-[#FEF2F2] text-[#C8322B]'
                        : 'border-[#E4E4E7] bg-[#FFFFFF] text-[#18181B] hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <span>{ch}</span>
                    {isDone && (
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-[#0D9488]"
                        aria-label="Đã luyện"
                      />
                    )}
                  </button>
                );
              })}
              {customChar && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#1D4ED8] bg-[#EFF6FF] px-3 py-1.5 font-hanzi text-xl font-bold text-[#1D4ED8]">
                  {customChar}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-medium text-[#52525B] tabular-nums">
              <span>
                Nét:{' '}
                <strong className="font-mono text-[#18181B]">
                  {currentStrokeIndex}/{totalStrokes}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Lỗi:{' '}
                <strong
                  className={`font-mono ${
                    mistakes > 0 ? 'text-[#C8322B]' : 'text-[#18181B]'
                  }`}
                >
                  {mistakes}
                </strong>
              </span>
            </div>
          </div>

          {/* Mi Zi Ge Writing Grid Stage */}
          <div className="my-6 flex flex-col items-center">
            <div className="relative flex items-center justify-center rounded-xl border-2 border-[#D4D4D8] bg-[#FAFAFA] p-2">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-2 h-[calc(100%-16px)] w-[calc(100%-16px)]"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1="50"
                  y1="0"
                  x2="50"
                  y2="100"
                  stroke="#E4E4E7"
                  strokeWidth="0.7"
                  strokeDasharray="2.5 2.5"
                />
                <line
                  x1="0"
                  y1="50"
                  x2="100"
                  y2="50"
                  stroke="#E4E4E7"
                  strokeWidth="0.7"
                  strokeDasharray="2.5 2.5"
                />
                <line
                  x1="0"
                  y1="0"
                  x2="100"
                  y2="100"
                  stroke="#E4E4E7"
                  strokeWidth="0.5"
                  strokeDasharray="2.5 2.5"
                />
                <line
                  x1="100"
                  y1="0"
                  x2="0"
                  y2="100"
                  stroke="#E4E4E7"
                  strokeWidth="0.5"
                  strokeDasharray="2.5 2.5"
                />
              </svg>

              {hasStrokeData ? (
                <div
                  ref={writerHostRef}
                  data-testid="hanzi-writer-canvas"
                  aria-label={`Bảng luyện viết chữ ${activeChar}`}
                  className="relative z-10 touch-none select-none cursor-crosshair"
                />
              ) : (
                <div className="relative z-10 flex h-[290px] w-[290px] items-center justify-center text-center text-sm text-[#71717A]">
                  Chưa có dữ liệu nét cho chữ này.
                </div>
              )}
            </div>

            {/* Live Stroke Feedback Strip */}
            <div
              role="status"
              aria-live="polite"
              className={`mt-4 w-full max-w-md rounded-lg border px-4 py-2.5 text-center text-xs sm:text-sm font-medium ${
                feedbackTone === 'success'
                  ? 'border-[#99F6E4] bg-[#F0FDFA] text-[#0F766E]'
                  : feedbackTone === 'error'
                  ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
                  : 'border-[#E4E4E7] bg-[#F7F8FA] text-[#52525B]'
              }`}
            >
              {feedbackText}
            </div>
          </div>

          {/* Primary Canvas Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E4E7] pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReplay}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#18181B] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#27272A] whitespace-nowrap"
              >
                {mode === 'quiz' ? (
                  <>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    <span>Viết lại từ đầu</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    <span>Chạy mẫu nét</span>
                  </>
                )}
              </button>

              {mode === 'quiz' && (
                <button
                  type="button"
                  onClick={handleHintStroke}
                  disabled={isCompleted}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4D4D8] bg-[#FFFFFF] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#18181B] transition-colors hover:bg-[#F4F4F5] disabled:opacity-45 whitespace-nowrap"
                >
                  <Lightbulb className="h-4 w-4 text-[#B45309]" aria-hidden="true" />
                  <span>Gợi ý nét tiếp theo</span>
                </button>
              )}
            </div>

            {wordChars.length > 1 && !customChar && charIndex < wordChars.length - 1 && (
              <button
                type="button"
                onClick={() => setCharIndex((prev) => prev + 1)}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#C8322B] hover:underline whitespace-nowrap"
              >
                <span>Chữ tiếp theo ({wordChars[charIndex + 1]})</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        {/* Right Zone (Control & Character Info Deck - 5 cols) */}
        <aside className="space-y-5 lg:col-span-5">
          {/* Active Vocabulary Word Context */}
          <div className="rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevWord}
                  aria-label="Từ trước"
                  className="rounded-md border border-[#E4E4E7] p-1.5 text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="font-mono text-xs text-[#71717A] tabular-nums">
                  Từ {currentScopedIndex + 1}/{scopedPool.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextWord}
                  aria-label="Từ tiếp theo"
                  className="rounded-md border border-[#E4E4E7] p-1.5 text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => speakTraditionalChinese(activeVocab.traditional)}
                aria-label={`Nghe phát âm từ ${activeVocab.traditional}`}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1D4ED8] hover:bg-[#EFF6FF]"
              >
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                <span>Nghe phát âm</span>
              </button>
            </div>

            <div className="mt-3">
              <label htmlFor="quick-word-select" className="sr-only">
                Chọn nhanh từ vựng để luyện viết
              </label>
              <select
                id="quick-word-select"
                value={activeVocab.id}
                onChange={(e) => {
                  const found = scopedPool.find((v) => v.id === e.target.value);
                  if (found) onSelectVocab(found);
                }}
                className="w-full rounded-lg border border-[#E4E4E7] bg-[#F7F8FA] px-3 py-1.5 text-xs font-medium text-[#18181B] focus:border-[#18181B] focus:outline-none"
              >
                {scopedPool.map((v, i) => (
                  <option key={v.id} value={v.id}>
                    {i + 1}. {v.traditional} ({v.pinyin}) — {v.meaningVi}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              {activeLessonInfo && (
                <p className="mb-1 text-xs font-medium text-[#71717A]">
                  {activeLessonInfo.titleVi}
                </p>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-hanzi text-3xl font-bold text-[#18181B]">
                  {activeVocab.traditional}
                </span>
                <span className="text-base font-semibold text-[#C8322B]">
                  {activeVocab.meaningVi}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#52525B]">
                {activeVocab.pinyin} · {activeVocab.zhuyin} · Hán-Việt:{' '}
                {activeVocab.hanViet}
              </p>
              <p className="mt-3 border-t border-[#E4E4E7] pt-3 text-xs leading-relaxed text-[#52525B]">
                {activeVocab.mnemonicVi}
              </p>
              {masteryRecord && (
                <p className="mt-2 text-xs font-medium text-[#0F766E] tabular-nums">
                  Thành tích chữ {activeChar}: Đã hoàn thành{' '}
                  {masteryRecord.completedCount} lần · Cao nhất{' '}
                  {masteryRecord.bestAccuracy}%
                </p>
              )}
            </div>
          </div>

          {/* Writing Settings & Step-by-Step Stroke Selector */}
          <div className="space-y-5 rounded-xl border border-[#E4E4E7] bg-[#FFFFFF] p-5 sm:p-6">
            <h2 className="text-sm font-bold text-[#18181B]">
              Tùy chỉnh bảng viết & Thứ tự nét
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="stroke-speed"
                  className="text-xs font-medium text-[#52525B]"
                >
                  Tốc độ nét mẫu
                </label>
                <span className="font-mono text-xs font-semibold text-[#18181B] tabular-nums">
                  {speed.toFixed(1)}x
                </span>
              </div>
              <input
                id="stroke-speed"
                type="range"
                min={0.5}
                max={2.0}
                step={0.5}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-[#C8322B]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowOutline((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  showOutline
                    ? 'border-[#18181B] bg-[#18181B] text-white'
                    : 'border-[#E4E4E7] bg-[#FFFFFF] text-[#52525B] hover:bg-[#F7F8FA]'
                }`}
              >
                {showOutline ? (
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>Nét mờ gợi ý</span>
              </button>

              <button
                type="button"
                onClick={() => setHighlightRadical((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  highlightRadical
                    ? 'border-[#C8322B] bg-[#FEF2F2] text-[#C8322B]'
                    : 'border-[#E4E4E7] bg-[#FFFFFF] text-[#52525B] hover:bg-[#F7F8FA]'
                }`}
              >
                <span>Tô đỏ bộ thủ</span>
              </button>
            </div>

            {totalStrokes > 0 && (
              <div className="border-t border-[#E4E4E7] pt-4">
                <p className="mb-2 text-xs font-medium text-[#52525B] tabular-nums">
                  Nhấn vào từng nét để xem hướng viết ({totalStrokes} nét):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: totalStrokes }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnimateSingleStroke(idx)}
                      className={`h-7 min-w-[28px] rounded border px-2 font-mono text-xs font-medium tabular-nums transition-colors ${
                        idx < currentStrokeIndex && mode === 'quiz'
                          ? 'border-[#99F6E4] bg-[#F0FDFA] text-[#0F766E]'
                          : 'border-[#E4E4E7] bg-[#F7F8FA] text-[#18181B] hover:border-[#18181B]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Character Quick Lookup */}
            <form
              onSubmit={handleApplyCustomChar}
              className="space-y-2 border-t border-[#E4E4E7] pt-4"
            >
              <label
                htmlFor="custom-hanzi-input"
                className="block text-xs font-medium text-[#52525B]"
              >
                Thử viết một chữ Hán khác (ví dụ: 麵, 學, 愛, 臺灣)
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-hanzi-input"
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Nhập 1 chữ Phồn thể..."
                  className="w-full rounded-lg border border-[#D4D4D8] bg-[#FFFFFF] px-3 py-1.5 text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#18181B] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#18181B] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#27272A] whitespace-nowrap shrink-0"
                >
                  Chọn chữ
                </button>
              </div>
              {customError && (
                <p className="text-xs text-[#C8322B]">{customError}</p>
              )}
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
