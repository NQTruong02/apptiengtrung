import {
  ChapterId,
  LessonId,
  MasteryStatus,
  SrsCardState,
  VocabItem,
} from '../types/vocab';

export type StatusFilter = 'all' | MasteryStatus;

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

export function getVocabStatus(
  vocabId: string,
  srsMap: Record<string, SrsCardState>
): MasteryStatus {
  const card = srsMap[vocabId];
  if (!card) return 'new';
  return card.status;
}

export function filterVocabulary(
  list: VocabItem[],
  srsMap: Record<string, SrsCardState>,
  options: {
    chapterId?: ChapterId | 'all';
    lessonId?: LessonId | 'all';
    status?: StatusFilter;
    query?: string;
  }
): VocabItem[] {
  const {
    chapterId = 'all',
    lessonId = 'all',
    status = 'all',
    query = '',
  } = options;
  const normalizedQuery = normalizeSearchText(query);

  return list.filter((item) => {
    if (lessonId !== 'all') {
      if (item.lessonId !== lessonId) return false;
    } else if (chapterId !== 'all') {
      if (item.chapterId !== chapterId) return false;
    }

    if (status !== 'all') {
      const currentStatus = getVocabStatus(item.id, srsMap);
      if (currentStatus !== status) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.traditional,
      item.simplified ?? '',
      item.pinyin,
      item.zhuyin,
      item.hanViet,
      item.meaningVi,
    ]
      .map(normalizeSearchText)
      .join(' ');

    return (
      haystack.includes(normalizedQuery) ||
      item.traditional.includes(query.trim())
    );
  });
}

export function extractUniqueCharacters(vocabList: VocabItem[]): string[] {
  const seen = new Set<string>();
  const chars: string[] = [];
  for (const item of vocabList) {
    for (const ch of item.traditional) {
      if (/[\u4e00-\u9fff]/.test(ch) && !seen.has(ch)) {
        seen.add(ch);
        chars.push(ch);
      }
    }
  }
  return chars;
}
