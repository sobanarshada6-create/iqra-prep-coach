import { MCQ, TestAttempt, DailySet, Progress, UserProfile, InterviewSession } from "./types";

const KEYS = {
  USER_PROFILE: "iqra_user_profile",
  SERVED_MCQS: "iqra_served_mcqs",
  DAILY_SETS: "iqra_daily_sets",
  TEST_ATTEMPTS: "iqra_test_attempts",
  PROGRESS: "iqra_progress",
  BOOKMARKS: "iqra_bookmarks",
  WEAK_TOPICS: "iqra_weak_topics",
  INTERVIEW_SESSIONS: "iqra_interview_sessions",
  CURRENT_DAY: "iqra_current_day",
  STREAK: "iqra_streak",
  LAST_ACTIVE: "iqra_last_active",
};

function safe<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const Storage = {
  getUserProfile(): UserProfile | null {
    return safe<UserProfile | null>(KEYS.USER_PROFILE, null);
  },
  saveUserProfile(profile: UserProfile) {
    save(KEYS.USER_PROFILE, profile);
  },

  getServedMCQIds(): string[] {
    return safe<string[]>(KEYS.SERVED_MCQS, []);
  },
  addServedMCQIds(ids: string[]) {
    const existing = Storage.getServedMCQIds();
    const merged = Array.from(new Set([...existing, ...ids]));
    save(KEYS.SERVED_MCQS, merged);
  },

  getDailySets(): DailySet[] {
    return safe<DailySet[]>(KEYS.DAILY_SETS, []);
  },
  saveDailySet(set: DailySet) {
    const sets = Storage.getDailySets();
    const idx = sets.findIndex((s) => s.id === set.id);
    if (idx >= 0) sets[idx] = set;
    else sets.push(set);
    save(KEYS.DAILY_SETS, sets);
  },
  getDailySetByDay(day: number): DailySet | null {
    return Storage.getDailySets().find((s) => s.day_number === day) || null;
  },

  getTestAttempts(): TestAttempt[] {
    return safe<TestAttempt[]>(KEYS.TEST_ATTEMPTS, []);
  },
  saveTestAttempt(attempt: TestAttempt) {
    const attempts = Storage.getTestAttempts();
    attempts.unshift(attempt);
    save(KEYS.TEST_ATTEMPTS, attempts.slice(0, 100));
  },

  getProgress(): Progress[] {
    return safe<Progress[]>(KEYS.PROGRESS, []);
  },
  saveProgress(p: Progress) {
    const all = Storage.getProgress();
    const idx = all.findIndex((x) => x.day_number === p.day_number);
    if (idx >= 0) all[idx] = p;
    else all.push(p);
    save(KEYS.PROGRESS, all);
  },

  getBookmarks(): string[] {
    return safe<string[]>(KEYS.BOOKMARKS, []);
  },
  toggleBookmark(mcqId: string) {
    const bm = Storage.getBookmarks();
    const idx = bm.indexOf(mcqId);
    if (idx >= 0) bm.splice(idx, 1);
    else bm.push(mcqId);
    save(KEYS.BOOKMARKS, bm);
    return idx < 0;
  },

  getWeakTopics(): string[] {
    return safe<string[]>(KEYS.WEAK_TOPICS, []);
  },
  addWeakTopic(topic: string) {
    const topics = Storage.getWeakTopics();
    if (!topics.includes(topic)) {
      topics.push(topic);
      save(KEYS.WEAK_TOPICS, topics);
    }
  },

  getInterviewSessions(): InterviewSession[] {
    return safe<InterviewSession[]>(KEYS.INTERVIEW_SESSIONS, []);
  },
  saveInterviewSession(session: InterviewSession) {
    const sessions = Storage.getInterviewSessions();
    sessions.unshift(session);
    save(KEYS.INTERVIEW_SESSIONS, sessions.slice(0, 20));
  },

  getCurrentDay(): number {
    return safe<number>(KEYS.CURRENT_DAY, 1);
  },
  setCurrentDay(day: number) {
    save(KEYS.CURRENT_DAY, day);
  },

  getStreak(): number {
    return safe<number>(KEYS.STREAK, 0);
  },
  updateStreak() {
    const lastActive = safe<string | null>(KEYS.LAST_ACTIVE, null);
    const today = new Date().toDateString();
    if (lastActive === today) return Storage.getStreak();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const streak = lastActive === yesterday ? Storage.getStreak() + 1 : 1;
    save(KEYS.STREAK, streak);
    save(KEYS.LAST_ACTIVE, today);
    return streak;
  },

  clearAll() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
