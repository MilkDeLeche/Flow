// Courses (classes). Each course groups chapters/materials and its quizzes &
// tests. Uses Supabase when configured, else localStorage (dev / offline).
import { supabase } from './supabase';
import { DEFAULT_THEME } from './themes';

export interface Course {
  id: string;
  name: string;
  description: string;
  theme: string;
  createdAt: string;
  chapterCount: number;
}

const LS_COURSES = 'flow_courses';

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
function nowIso() {
  return new Date(Date.now()).toISOString();
}

interface StoredCourse {
  id: string;
  name: string;
  description: string;
  theme: string;
  createdAt: string;
}

export async function listCourses(): Promise<Course[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('courses')
      .select('id,name,description,theme,created_at')
      .order('created_at', { ascending: false });
    if (error || !data) return [];

    // Tally chapter counts from materials in one query.
    const counts = new Map<string, number>();
    const { data: mats } = await supabase.from('materials').select('course_id');
    for (const m of mats || []) {
      if (m.course_id) counts.set(m.course_id, (counts.get(m.course_id) || 0) + 1);
    }

    return data.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? '',
      theme: c.theme ?? DEFAULT_THEME,
      createdAt: c.created_at,
      chapterCount: counts.get(c.id) || 0,
    }));
  }

  const list = lsGet<StoredCourse[]>(LS_COURSES, []);
  return list.map((c) => ({ ...c, chapterCount: 0 }));
}

export async function getCourse(id: string): Promise<Course | null> {
  const all = await listCourses();
  return all.find((c) => c.id === id) ?? null;
}

export async function createCourse(input: {
  name: string;
  description?: string;
  theme?: string;
}): Promise<Course> {
  const name = input.name.trim() || 'Untitled course';
  const description = (input.description ?? '').trim();
  const theme = input.theme ?? DEFAULT_THEME;

  if (supabase) {
    const { data, error } = await supabase
      .from('courses')
      .insert({ name, description, theme })
      .select('id,created_at')
      .single();
    if (!error && data) {
      return { id: data.id, name, description, theme, createdAt: data.created_at, chapterCount: 0 };
    }
  }

  const id = uid();
  const stored: StoredCourse = { id, name, description, theme, createdAt: nowIso() };
  const list = lsGet<StoredCourse[]>(LS_COURSES, []);
  list.unshift(stored);
  lsSet(LS_COURSES, list);
  return { ...stored, chapterCount: 0 };
}

export async function updateCourse(
  id: string,
  patch: { name?: string; description?: string; theme?: string }
): Promise<void> {
  const clean: Record<string, string> = {};
  if (patch.name !== undefined) clean.name = patch.name.trim() || 'Untitled course';
  if (patch.description !== undefined) clean.description = patch.description.trim();
  if (patch.theme !== undefined) clean.theme = patch.theme;

  if (supabase) {
    await supabase.from('courses').update(clean).eq('id', id);
    return;
  }
  const list = lsGet<StoredCourse[]>(LS_COURSES, []);
  lsSet(
    LS_COURSES,
    list.map((c) => (c.id === id ? { ...c, ...clean } : c))
  );
}

export async function deleteCourse(id: string): Promise<void> {
  if (supabase) {
    await supabase.from('courses').delete().eq('id', id);
    return;
  }
  const list = lsGet<StoredCourse[]>(LS_COURSES, []);
  lsSet(LS_COURSES, list.filter((c) => c.id !== id));
}
