const SCORE_KEY = 'trustworkx:user-score';
const HISTORY_KEY = 'trustworkx:score-history';

function readStorage(key: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, value);
}

export function getStoredUserScore() {
  const value = readStorage(SCORE_KEY);
  return value ? Number(value) : 84;
}

export function setStoredUserScore(score: number) {
  writeStorage(SCORE_KEY, String(score));
}

export function getStoredScoreHistory() {
  const value = readStorage(HISTORY_KEY);
  if (!value) {
    return [] as Array<{ score: number; skill: string; at: string }>;
  }

  try {
    return JSON.parse(value) as Array<{ score: number; skill: string; at: string }>;
  } catch {
    return [] as Array<{ score: number; skill: string; at: string }>;
  }
}

export function addStoredScoreEntry(entry: { score: number; skill: string }) {
  const history = getStoredScoreHistory();
  const nextHistory = [{ ...entry, at: new Date().toISOString() }, ...history].slice(0, 10);
  writeStorage(HISTORY_KEY, JSON.stringify(nextHistory));
}