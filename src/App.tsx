/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { OverviewSection } from './components/OverviewSection';
import { FlashcardPractice } from './components/FlashcardPractice';
import { StrokePractice } from './components/StrokePractice';
import { VocabNotebook } from './components/VocabNotebook';
import { VOCAB_LIST } from './data/vocabulary';
import {
  AppTab,
  ChapterId,
  LessonId,
  ReviewQuality,
  SrsCardState,
  StrokeMasteryRecord,
  UserPreferences,
  VocabItem,
} from './types/vocab';
import {
  calculateNextReview,
  createInitialSrsState,
  getDueQueue,
  updateStrokeMastery,
} from './utils/srs';
import {
  loadPreferences,
  loadSrsState,
  loadStrokeMastery,
  savePreferences,
  saveSrsState,
  saveStrokeMastery,
} from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [selectedChapter, setSelectedChapter] = useState<ChapterId | 'all'>('all');
  const [selectedLesson, setSelectedLesson] = useState<LessonId | 'all'>('all');
  const [srsMap, setSrsMap] = useState<Record<string, SrsCardState>>(() =>
    loadSrsState()
  );
  const [strokeMap, setStrokeMap] = useState<
    Record<string, StrokeMasteryRecord>
  >(() => loadStrokeMastery());
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());

  const [writingVocab, setWritingVocab] = useState<VocabItem>(VOCAB_LIST[0]);
  const [flashcardFocusId, setFlashcardFocusId] = useState<string | null>(null);

  const dueCount = useMemo(
    () => getDueQueue(VOCAB_LIST, srsMap).length,
    [srsMap]
  );

  const handleReviewCard = useCallback(
    (vocabId: string, quality: ReviewQuality) => {
      setSrsMap((prev) => {
        const current = prev[vocabId] ?? createInitialSrsState(vocabId);
        const next = calculateNextReview(current, quality);
        const updated = { ...prev, [vocabId]: next };
        saveSrsState(updated);
        return updated;
      });
    },
    []
  );

  const handleCompleteCharacter = useCallback(
    (char: string, accuracy: number) => {
      setStrokeMap((prev) => {
        const updated = {
          ...prev,
          [char]: updateStrokeMastery(prev[char], char, accuracy),
        };
        saveStrokeMastery(updated);
        return updated;
      });
    },
    []
  );

  const handleTogglePref = useCallback((key: keyof UserPreferences) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      savePreferences(updated);
      return updated;
    });
  }, []);

  const handleStartMemorize = useCallback(
    (chapter: ChapterId | 'all' = 'all', lesson: LessonId | 'all' = 'all') => {
      setSelectedChapter(chapter);
      setSelectedLesson(lesson);
      setFlashcardFocusId(null);
      setActiveTab('memorize');
    },
    []
  );

  const handleStartWriting = useCallback(
    (
      vocab: VocabItem,
      chapter?: ChapterId | 'all',
      lesson?: LessonId | 'all'
    ) => {
      if (chapter !== undefined) setSelectedChapter(chapter);
      if (lesson !== undefined) setSelectedLesson(lesson);
      setWritingVocab(vocab);
      setActiveTab('write');
    },
    []
  );

  const handleOpenNotebook = useCallback(
    (chapter: ChapterId | 'all' = 'all', lesson: LessonId | 'all' = 'all') => {
      setSelectedChapter(chapter);
      setSelectedLesson(lesson);
      setActiveTab('notebook');
    },
    []
  );

  const handlePracticeFlashcardWord = useCallback((vocab: VocabItem) => {
    setSelectedChapter(vocab.chapterId);
    setSelectedLesson(vocab.lessonId);
    setFlashcardFocusId(vocab.id);
    setActiveTab('memorize');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#18181B]">
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setFlashcardFocusId(null);
          setActiveTab(tab);
        }}
        dueCount={dueCount}
        onStartQuickReview={() => handleStartMemorize('all', 'all')}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {activeTab === 'overview' && (
          <OverviewSection
            srsMap={srsMap}
            strokeMap={strokeMap}
            dueCount={dueCount}
            onStartMemorize={handleStartMemorize}
            onStartWriting={handleStartWriting}
            onOpenNotebook={handleOpenNotebook}
          />
        )}

        {activeTab === 'memorize' && (
          <FlashcardPractice
            srsMap={srsMap}
            selectedChapter={selectedChapter}
            selectedLesson={selectedLesson}
            onChangeChapter={setSelectedChapter}
            onChangeLesson={setSelectedLesson}
            prefs={prefs}
            onTogglePref={handleTogglePref}
            onReviewCard={handleReviewCard}
            onPracticeWrite={(vocab) =>
              handleStartWriting(vocab, selectedChapter, selectedLesson)
            }
            initialVocabId={flashcardFocusId}
          />
        )}

        {activeTab === 'write' && (
          <StrokePractice
            activeVocab={writingVocab}
            onSelectVocab={setWritingVocab}
            selectedChapter={selectedChapter}
            selectedLesson={selectedLesson}
            onChangeChapter={setSelectedChapter}
            onChangeLesson={setSelectedLesson}
            strokeMap={strokeMap}
            onCompleteCharacter={handleCompleteCharacter}
          />
        )}

        {activeTab === 'notebook' && (
          <VocabNotebook
            srsMap={srsMap}
            selectedChapter={selectedChapter}
            selectedLesson={selectedLesson}
            onChangeChapter={setSelectedChapter}
            onChangeLesson={setSelectedLesson}
            onPracticeFlashcard={handlePracticeFlashcardWord}
            onPracticeWrite={(vocab) =>
              handleStartWriting(vocab, vocab.chapterId, vocab.lessonId)
            }
          />
        )}
      </main>

      <footer className="border-t border-[#E4E4E7] bg-[#FFFFFF] py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 text-xs text-[#71717A] sm:px-6">
          <span>Phồn Thể Studio · Giáo trình Đương Đại Quyển 1</span>
          <span>Tiến độ ghi nhớ và luyện viết được lưu tự động trên trình duyệt.</span>
        </div>
      </footer>
    </div>
  );
}
