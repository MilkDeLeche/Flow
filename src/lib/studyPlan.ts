import { supabase } from './supabase';

export const PLAN_PASTEL_COLORS = [
  {
    chip: 'bg-[#ede4ff] text-[#5c3d99] dark:bg-purple-950/55 dark:text-purple-200',
    border: 'border-l-[#c4b5fd] dark:border-l-purple-400',
    progress: 'bg-[#a78bfa]',
  },
  {
    chip: 'bg-[#dbeafe] text-[#1e4a8a] dark:bg-blue-950/55 dark:text-blue-200',
    border: 'border-l-[#93c5fd] dark:border-l-blue-400',
    progress: 'bg-[#60a5fa]',
  },
  {
    chip: 'bg-[#fef3c7] text-[#92400e] dark:bg-amber-950/55 dark:text-amber-200',
    border: 'border-l-[#fcd34d] dark:border-l-amber-400',
    progress: 'bg-[#fbbf24]',
  },
  {
    chip: 'bg-[#dcfce7] text-[#166534] dark:bg-green-950/55 dark:text-green-200',
    border: 'border-l-[#86efac] dark:border-l-green-400',
    progress: 'bg-[#4ade80]',
  },
  {
    chip: 'bg-[#fce7f3] text-[#9d174d] dark:bg-pink-950/55 dark:text-pink-200',
    border: 'border-l-[#f9a8d4] dark:border-l-pink-400',
    progress: 'bg-[#f472b6]',
  },
] as const;

export type PlanPastelColor = (typeof PLAN_PASTEL_COLORS)[number];

export interface StudyPlan {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  testDate: string;
  quizzesPerWeek: number;
  completedSessions: string[];
  createdAt: string;
  /** Pastel palette index (0–4). Assigned when the plan is created. */
  colorIndex?: number;
}

export function planPastelColor(plan: Pick<StudyPlan, 'id' | 'colorIndex'>): PlanPastelColor {
  const idx =
    plan.colorIndex ??
    Math.abs(plan.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) %
      PLAN_PASTEL_COLORS.length;
  return PLAN_PASTEL_COLORS[idx % PLAN_PASTEL_COLORS.length];
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

interface PlanRow {
  id: string;
  course_id: string | null;
  course_name: string;
  title: string;
  test_date: string;
  quizzes_per_week: number;
  completed_sessions: string[] | null;
  color_index: number | null;
  created_at: string;
}

function fromRow(r: PlanRow): StudyPlan {
  return {
    id: r.id,
    courseId: r.course_id ?? '',
    courseName: r.course_name,
    title: r.title,
    testDate: r.test_date,
    quizzesPerWeek: r.quizzes_per_week,
    completedSessions: r.completed_sessions ?? [],
    createdAt: r.created_at,
    colorIndex: r.color_index ?? undefined,
  };
}

function lsListPlans(): StudyPlan[] {
  return lsGet<StudyPlan[]>(LS_PLANS, []).sort(
    (a, b) => parseLocalDate(a.testDate).getTime() - parseLocalDate(b.testDate).getTime()
  );
}

export async function listStudyPlans(): Promise<StudyPlan[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .order('test_date', { ascending: true });
    if (!error && data) return (data as PlanRow[]).map(fromRow);
    return [];
  }
  return lsListPlans();
}

export async function createStudyPlan(input: {
  courseId: string;
  courseName: string;
  title?: string;
  testDate: string;
  quizzesPerWeek: number;
}): Promise<StudyPlan> {
  const title = input.title?.trim() || `${input.courseName} test`;
  if (supabase) {
    const { data, error } = await supabase
      .from('study_plans')
      .insert({
        course_id: input.courseId,
        course_name: input.courseName,
        title,
        test_date: input.testDate,
        quizzes_per_week: input.quizzesPerWeek,
        completed_sessions: [],
      })
      .select('*')
      .single();
    if (!error && data) return fromRow(data as PlanRow);
    // fall through to local on error
  }
  const plan: StudyPlan = {
    id: uid(),
    courseId: input.courseId,
    courseName: input.courseName,
    title,
    testDate: input.testDate,
    quizzesPerWeek: input.quizzesPerWeek,
    completedSessions: [],
    createdAt: new Date().toISOString(),
    colorIndex: lsListPlans().length % PLAN_PASTEL_COLORS.length,
  };
  const plans = lsListPlans();
  plans.push(plan);
  lsSet(LS_PLANS, plans);
  return plan;
}

export async function deleteStudyPlan(id: string) {
  if (supabase) {
    await supabase.from('study_plans').delete().eq('id', id);
    return;
  }
  lsSet(
    LS_PLANS,
    lsListPlans().filter((plan) => plan.id !== id)
  );
}

export async function toggleStudySession(planId: string, sessionKey: string) {
  if (supabase) {
    const { data } = await supabase
      .from('study_plans')
      .select('completed_sessions')
      .eq('id', planId)
      .maybeSingle();
    const done = new Set<string>((data?.completed_sessions as string[]) ?? []);
    if (done.has(sessionKey)) done.delete(sessionKey);
    else done.add(sessionKey);
    await supabase
      .from('study_plans')
      .update({ completed_sessions: Array.from(done) })
      .eq('id', planId);
    return;
  }
  const plans = lsListPlans().map((plan) => {
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
