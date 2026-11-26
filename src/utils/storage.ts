import { SrsCardState, StrokeMasteryRecord, UserPreferences } from '../types/vocab';

const SRS_STORAGE_KEY = 'phonthe_srs_v1';
const STROKE_STORAGE_KEY = 'phonthe_strokes_v1';
const PREFS_STORAGE_KEY = 'phonthe_prefs_v1';

const DEFAULT_PREFS: UserPreferences = {
  showZhuyin: true,
  showHanViet: true,
  showPinyinOnFront: false,
};

export function loadSrsState(): Record<string, SrsCardState> {
  try {
    const raw = localStorage.getItem(SRS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSrsState(data: Record<string, SrsCardState>): void {
  try {
    localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors in private browsing
  }
}

export function loadStrokeMastery(): Record<string, StrokeMasteryRecord> {
  try {
    const raw = localStorage.getItem(STROKE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStrokeMastery(data: Record<string, StrokeMasteryRecord>): void {
  try {
    localStorage.setItem(STROKE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...(parsed || {}) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore quota errors
  }
}
