export interface StudyPlan {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  testDate: string;
  quizzesPerWeek: number;
  completedSessions: string[];
  createdAt: string;
}

export interface StudySession {
  key: string;
  date: string;
  label: string;
}

const LS_PLANS = 'flow_study_plans';

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function toLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayString(): string {
  return toLocalDate(todayLocal());
}

export function listStudyPlans(): StudyPlan[] {
  return lsGet<StudyPlan[]>(LS_PLANS, []).sort(
    (a, b) => parseLocalDate(a.testDate).getTime() - parseLocalDate(b.testDate).getTime()
  );
}

export function createStudyPlan(input: {
  courseId: string;
  courseName: string;
  title?: string;
  testDate: string;
  quizzesPerWeek: number;
}): StudyPlan {
  const plan: StudyPlan = {
    id: uid(),
    courseId: input.courseId,
    courseName: input.courseName,
    title: input.title?.trim() || `${input.courseName} test`,
    testDate: input.testDate,
    quizzesPerWeek: input.quizzesPerWeek,
    completedSessions: [],
    createdAt: new Date().toISOString(),
  };
  const plans = listStudyPlans();
  plans.push(plan);
  lsSet(LS_PLANS, plans);
  return plan;
}

export function deleteStudyPlan(id: string) {
  lsSet(
    LS_PLANS,
    listStudyPlans().filter((plan) => plan.id !== id)
  );
}

export function toggleStudySession(planId: string, sessionKey: string) {
  const plans = listStudyPlans().map((plan) => {
    if (plan.id !== planId) return plan;
    const done = new Set(plan.completedSessions);
    if (done.has(sessionKey)) done.delete(sessionKey);
    else done.add(sessionKey);
    return { ...plan, completedSessions: Array.from(done) };
  });
  lsSet(LS_PLANS, plans);
}

export function daysUntil(date: string): number {
  const diff = parseLocalDate(date).getTime() - todayLocal().getTime();
  return Math.ceil(diff / 86_400_000);
}

export function buildStudySessions(plan: StudyPlan): StudySession[] {
  const today = todayLocal();
  const test = parseLocalDate(plan.testDate);
  const days = Math.max(0, Math.ceil((test.getTime() - today.getTime()) / 86_400_000));
  if (days <= 1) return [];

  const quizCount = Math.max(1, Math.ceil((days / 7) * plan.quizzesPerWeek));
  const sessions: StudySession[] = [];
  const latestQuizDay = days - 1;

  for (let i = 0; i < quizCount; i += 1) {
    const offset = Math.max(0, Math.round((latestQuizDay * i) / Math.max(1, quizCount - 1)));
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    sessions.push({
      key: `${plan.id}-${toLocalDate(date)}-${i}`,
      date: toLocalDate(date),
      label: `Quiz ${i + 1}`,
    });
  }

  return sessions;
}
