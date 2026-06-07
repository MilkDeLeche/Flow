// Persistence for "Jump back in" (recent materials) and "Review" (missed
// questions). Uses Supabase when configured (cross-device), else localStorage
// (works offline / before Supabase is set up).
import { supabase } from './supabase';
import type { AnswerRecord, QuizQuestion } from './types';

export interface RecentMaterial {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  createdAt: string;
  courseId?: string;
  lastScore?: { score: number; total: number; roundSize: number };
}

export interface MissedQuestion {
  id: string;
  materialId: string;
  materialTitle: string;
  question: QuizQuestion;
  timesWrong: number;
  timesSeen: number;
  updatedAt: string;
  /** Only populated in localStorage mode (Supabase filters by column). */
  userName?: string;
}

const LS_MATERIALS = 'flow_materials';
const LS_MISSED = 'flow_missed';
const LS_BANK = 'flow_bank';

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
    /* quota / private mode — ignore */
  }
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function nowIso() {
  return new Date(Date.now()).toISOString();
}

/* ----------------------------- Materials ----------------------------- */

export async function recordMaterial(
  title: string,
  content: string,
  sourceType: string,
  courseId?: string
): Promise<string> {
  if (supabase) {
    const { data, error } = await supabase
      .from('materials')
      .insert({
        title,
        content,
        source_type: sourceType,
        char_count: content.length,
        course_id: courseId ?? null,
      })
      .select('id')
      .single();
    if (!error && data) return data.id as string;
    // fall through to local on error
  }
  const id = uid();
  const list = lsGet<RecentMaterial[]>(LS_MATERIALS, []);
  const filtered = list.filter((m) => m.title !== title);
  filtered.unshift({ id, title, content, sourceType, createdAt: nowIso(), courseId });
  lsSet(LS_MATERIALS, filtered.slice(0, 24));
  return id;
}

/** Chapters (materials) belonging to a course, newest first, with last score. */
export async function listMaterialsByCourse(
  courseId: string
): Promise<RecentMaterial[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('materials')
      .select('id,title,content,source_type,created_at,course_id')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];

    const ids = data.map((m) => m.id);
    const scores = new Map<string, RecentMaterial['lastScore']>();
    if (ids.length) {
      const { data: atts } = await supabase
        .from('attempts')
        .select('material_id,score,total,round_size,created_at')
        .in('material_id', ids)
        .order('created_at', { ascending: false });
      for (const a of atts || []) {
        if (a.material_id && !scores.has(a.material_id))
          scores.set(a.material_id, {
            score: a.score,
            total: a.total,
            roundSize: a.round_size,
          });
      }
    }

    return data.map((m) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      sourceType: m.source_type,
      createdAt: m.created_at,
      courseId: m.course_id ?? undefined,
      lastScore: scores.get(m.id),
    }));
  }

  return lsGet<RecentMaterial[]>(LS_MATERIALS, []).filter(
    (m) => m.courseId === courseId
  );
}

export async function listRecentMaterials(limit = 12): Promise<RecentMaterial[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('materials')
      .select('id,title,content,source_type,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    // Best-effort latest score per material from attempts.
    const ids = data.map((m) => m.id);
    const scores = new Map<string, RecentMaterial['lastScore']>();
    if (ids.length) {
      const { data: atts } = await supabase
        .from('attempts')
        .select('material_id,score,total,round_size,created_at')
        .in('material_id', ids)
        .order('created_at', { ascending: false });
      for (const a of atts || []) {
        if (a.material_id && !scores.has(a.material_id))
          scores.set(a.material_id, {
            score: a.score,
            total: a.total,
            roundSize: a.round_size,
          });
      }
    }
    return data.map((m) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      sourceType: m.source_type,
      createdAt: m.created_at,
      lastScore: scores.get(m.id),
    }));
  }
  return lsGet<RecentMaterial[]>(LS_MATERIALS, []).slice(0, limit);
}

export function setLocalMaterialScore(
  id: string,
  lastScore: RecentMaterial['lastScore']
) {
  if (supabase) return; // scores come from attempts table in Supabase mode
  const list = lsGet<RecentMaterial[]>(LS_MATERIALS, []);
  const next = list.map((m) => (m.id === id ? { ...m, lastScore } : m));
  lsSet(LS_MATERIALS, next);
}

/* ----------------------- Question bank (cache) ----------------------- */
// Generated questions are stored per material and reused, so future rounds and
// retakes serve from the bank instead of calling the API again.

export async function listBank(materialId: string): Promise<QuizQuestion[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('quiz_bank')
      .select('question')
      .eq('material_id', materialId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map((r) => r.question as QuizQuestion);
  }
  const map = lsGet<Record<string, QuizQuestion[]>>(LS_BANK, {});
  return map[materialId] || [];
}

export async function addToBank(
  materialId: string,
  materialTitle: string,
  questions: QuizQuestion[]
): Promise<void> {
  if (!questions.length) return;
  if (supabase) {
    const rows = questions.map((q) => ({
      material_id: materialId,
      material_title: materialTitle,
      question_text: q.question.trim().slice(0, 200),
      question: q,
    }));
    await supabase.from('quiz_bank').insert(rows);
    return;
  }
  const map = lsGet<Record<string, QuizQuestion[]>>(LS_BANK, {});
  const existing = map[materialId] || [];
  const seen = new Set(existing.map((q) => q.question.trim().slice(0, 200)));
  for (const q of questions) {
    const key = q.question.trim().slice(0, 200);
    if (!seen.has(key)) {
      existing.push(q);
      seen.add(key);
    }
  }
  map[materialId] = existing;
  lsSet(LS_BANK, map);
}

/* -------------------------- Missed questions ------------------------- */

const qText = (q: QuizQuestion) => q.question.trim().slice(0, 200);

export async function recordRoundResults(args: {
  materialId: string;
  materialTitle: string;
  userName: string;
  questions: QuizQuestion[];
  answers: AnswerRecord[];
}): Promise<void> {
  const { materialId, materialTitle, userName, questions, answers } = args;

  for (const a of answers) {
    const q = questions[a.questionIndex];
    if (!q) continue;
    if (a.correct) {
      await masterMissed(materialId, userName, q);
    } else {
      await bumpMissed(materialId, materialTitle, userName, q);
    }
  }
}

async function bumpMissed(
  materialId: string,
  materialTitle: string,
  userName: string,
  q: QuizQuestion
) {
  if (supabase) {
    const { data } = await supabase
      .from('missed_questions')
      .select('id,times_wrong,times_seen')
      .eq('material_id', materialId)
      .eq('user_name', userName)
      .eq('question_text', qText(q))
      .maybeSingle();
    if (data) {
      await supabase
        .from('missed_questions')
        .update({
          times_wrong: data.times_wrong + 1,
          times_seen: data.times_seen + 1,
          updated_at: nowIso(),
        })
        .eq('id', data.id);
    } else {
      await supabase.from('missed_questions').insert({
        material_id: materialId,
        material_title: materialTitle,
        user_name: userName,
        question_text: qText(q),
        question: q,
        times_wrong: 1,
        times_seen: 1,
      });
    }
    return;
  }
  const list = lsGet<MissedQuestion[]>(LS_MISSED, []);
  const idx = list.findIndex(
    (m) =>
      m.materialId === materialId &&
      qText(m.question) === qText(q) &&
      userKey(m) === userName
  );
  if (idx >= 0) {
    list[idx].timesWrong += 1;
    list[idx].timesSeen += 1;
    list[idx].updatedAt = nowIso();
  } else {
    list.unshift({
      id: uid(),
      materialId,
      materialTitle,
      question: q,
      timesWrong: 1,
      timesSeen: 1,
      updatedAt: nowIso(),
      userName,
    });
  }
  lsSet(LS_MISSED, list);
}

function userKey(m: MissedQuestion): string {
  return m.userName || 'Student';
}

async function masterMissed(
  materialId: string,
  userName: string,
  q: QuizQuestion
) {
  if (supabase) {
    await supabase
      .from('missed_questions')
      .delete()
      .eq('material_id', materialId)
      .eq('user_name', userName)
      .eq('question_text', qText(q));
    return;
  }
  const list = lsGet<MissedQuestion[]>(LS_MISSED, []);
  const next = list.filter(
    (m) =>
      !(
        m.materialId === materialId &&
        qText(m.question) === qText(q) &&
        userKey(m) === userName
      )
  );
  lsSet(LS_MISSED, next);
}

export async function listMissed(
  userName: string,
  materialId?: string,
  limit = 200
): Promise<MissedQuestion[]> {
  if (supabase) {
    let query = supabase
      .from('missed_questions')
      .select('*')
      .eq('user_name', userName)
      .order('times_wrong', { ascending: false })
      .limit(limit);
    if (materialId) query = query.eq('material_id', materialId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id,
      materialId: r.material_id,
      materialTitle: r.material_title,
      question: r.question as QuizQuestion,
      timesWrong: r.times_wrong,
      timesSeen: r.times_seen,
      updatedAt: r.updated_at,
    }));
  }
  const list = lsGet<MissedQuestion[]>(LS_MISSED, []).filter(
    (m) => userKey(m) === userName && (!materialId || m.materialId === materialId)
  );
  return list.sort((a, b) => b.timesWrong - a.timesWrong).slice(0, limit);
}

export async function countMissed(
  userName: string,
  materialId?: string
): Promise<number> {
  return (await listMissed(userName, materialId, 999)).length;
}

/** Grade a review drill: correct answers leave the pile; misses bump the count. */
export async function gradeReviewResults(
  userName: string,
  missed: MissedQuestion[],
  answers: AnswerRecord[]
): Promise<void> {
  for (const a of answers) {
    const m = missed[a.questionIndex];
    if (!m) continue;
    if (a.correct) await masterMissed(m.materialId, userName, m.question);
    else await bumpMissed(m.materialId, m.materialTitle, userName, m.question);
  }
}
