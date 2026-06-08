// Courses (classes). Each course groups chapters/materials and its quizzes &
// tests. Uses Supabase when configured, else localStorage (dev / offline).
import { supabase } from './supabase';
import { DEFAULT_THEME } from './themes';

export interface Course {
  id: string;
  name: string;
  description: string;
  theme: string;
  imageUrl?: string;
  semester?: string;
  year?: string;
  finishedAt?: string;
  createdAt: string;
  chapterCount: number;
}

const LS_COURSES = 'flow_courses';
const LS_IMAGE_COLUMN = 'flow_course_image_column';
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
  imageUrl?: string;
  semester?: string;
  year?: string;
  finishedAt?: string;
  createdAt: string;
}

interface StoredMaterial {
  id: string;
  courseId?: string;
}

interface StoredMissedQuestion {
  materialId: string;
}

type CoursePatch = {
  name?: string;
  description?: string;
  theme?: string;
  imageUrl?: string | null;
  semester?: string;
  year?: string;
  finishedAt?: string | null;
};

type CourseRow = {
  id: string;
  name: string;
  description: string | null;
  theme: string | null;
  image_url?: string | null;
  semester?: string | null;
  year?: string | null;
  finished_at?: string | null;
  created_at: string;
};

export async function listCourses(): Promise<Course[]> {
  if (supabase) {
    const imageColumnKnownMissing =
      lsGet<'present' | 'missing' | null>(LS_IMAGE_COLUMN, null) === 'missing';
    let { data, error } = imageColumnKnownMissing
      ? await supabase
          .from('courses')
          .select('id,name,description,theme,semester,year,finished_at,created_at')
          .order('created_at', { ascending: false })
      : await supabase
      .from('courses')
      .select('id,name,description,theme,image_url,semester,year,finished_at,created_at')
      .order('created_at', { ascending: false });
    let rows = data as CourseRow[] | null;
    if (data && imageColumnKnownMissing) {
      rows = data.map((c) => ({ ...c, image_url: null }));
    }
    if (error) {
      lsSet(LS_IMAGE_COLUMN, 'missing');
      const fallback = await supabase
        .from('courses')
        .select('id,name,description,theme,created_at')
        .order('created_at', { ascending: false });
      rows = fallback.data?.map((c) => ({
        ...c,
        image_url: null,
        semester: null,
        year: null,
        finished_at: null,
      })) ?? null;
      error = fallback.error;
    }
    if (error || !rows) return [];

    // Tally chapter counts from materials in one query.
    const counts = new Map<string, number>();
    const { data: mats } = await supabase.from('materials').select('course_id');
    for (const m of mats || []) {
      if (m.course_id) counts.set(m.course_id, (counts.get(m.course_id) || 0) + 1);
    }

    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? '',
      theme: c.theme ?? DEFAULT_THEME,
      imageUrl: c.image_url ?? undefined,
      semester: c.semester ?? undefined,
      year: c.year ?? undefined,
      finishedAt: c.finished_at ?? undefined,
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
  imageUrl?: string;
  semester?: string;
  year?: string;
  finishedAt?: string | null;
}): Promise<Course> {
  const name = input.name.trim() || 'Untitled course';
  const description = (input.description ?? '').trim();
  const theme = input.theme ?? DEFAULT_THEME;
  const imageUrl = input.imageUrl?.trim() || undefined;
  const semester = input.semester?.trim() || undefined;
  const year = input.year?.trim() || undefined;
  const finishedAt = input.finishedAt || undefined;

  if (supabase) {
    let { data, error } = await supabase
      .from('courses')
      .insert({
        name,
        description,
        theme,
        image_url: imageUrl ?? null,
        semester: semester ?? null,
        year: year ?? null,
        finished_at: finishedAt ?? null,
      })
      .select('id,created_at')
      .single();
    if (!error) lsSet(LS_IMAGE_COLUMN, 'present');
    if (error) {
      lsSet(LS_IMAGE_COLUMN, 'missing');
      const fallback = await supabase
        .from('courses')
        .insert({ name, description, theme })
        .select('id,created_at')
        .single();
      data = fallback.data;
      error = fallback.error;
    }
    if (!error && data) {
      return {
        id: data.id,
        name,
        description,
        theme,
        imageUrl,
        semester,
        year,
        finishedAt,
        createdAt: data.created_at,
        chapterCount: 0,
      };
    }
  }

  const id = uid();
  const stored: StoredCourse = {
    id,
    name,
    description,
    theme,
    imageUrl,
    semester,
    year,
    finishedAt,
    createdAt: nowIso(),
  };
  const list = lsGet<StoredCourse[]>(LS_COURSES, []);
  list.unshift(stored);
  lsSet(LS_COURSES, list);
  return { ...stored, chapterCount: 0 };
}

export async function updateCourse(
  id: string,
  patch: CoursePatch
): Promise<void> {
  const clean: Record<string, string | null> = {};
  if (patch.name !== undefined) clean.name = patch.name.trim() || 'Untitled course';
  if (patch.description !== undefined) clean.description = patch.description.trim();
  if (patch.theme !== undefined) clean.theme = patch.theme;
  if (patch.imageUrl !== undefined) clean.imageUrl = patch.imageUrl?.trim() || null;
  if (patch.semester !== undefined) clean.semester = patch.semester.trim();
  if (patch.year !== undefined) clean.year = patch.year.trim();
  if (patch.finishedAt !== undefined) clean.finishedAt = patch.finishedAt;

  if (supabase) {
    const dbClean: Record<string, string | null> = {};
    if (clean.name !== undefined) dbClean.name = clean.name;
    if (clean.description !== undefined) dbClean.description = clean.description;
    if (clean.theme !== undefined) dbClean.theme = clean.theme;
    if (clean.imageUrl !== undefined) dbClean.image_url = clean.imageUrl;
    if (clean.semester !== undefined) dbClean.semester = clean.semester;
    if (clean.year !== undefined) dbClean.year = clean.year;
    if (clean.finishedAt !== undefined) dbClean.finished_at = clean.finishedAt;
    const { error } = await supabase.from('courses').update(dbClean).eq('id', id);
    if (!error && dbClean.image_url !== undefined) lsSet(LS_IMAGE_COLUMN, 'present');
    if (error && dbClean.image_url !== undefined) {
      lsSet(LS_IMAGE_COLUMN, 'missing');
      const { image_url: _imageUrl, ...withoutImage } = dbClean;
      await supabase.from('courses').update(withoutImage).eq('id', id);
    }
    return;
  }
  const list = lsGet<StoredCourse[]>(LS_COURSES, []);
  lsSet(
    LS_COURSES,
    list.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, ...clean };
      if (next.imageUrl === null) delete next.imageUrl;
      if (next.finishedAt === null) delete next.finishedAt;
      return next;
    })
  );
}

export async function deleteCourse(id: string): Promise<void> {
  if (supabase) {
    const { data: mats } = await supabase
      .from('materials')
      .select('id')
      .eq('course_id', id);
    const materialIds = (mats || []).map((m) => m.id as string);

    if (materialIds.length) {
      const cleanup = [
        await supabase.from('attempts').delete().in('material_id', materialIds),
        await supabase.from('missed_questions').delete().in('material_id', materialIds),
        await supabase.from('quiz_bank').delete().in('material_id', materialIds),
        await supabase.from('reader_marks').delete().in('material_id', materialIds),
        await supabase.from('materials').delete().in('id', materialIds),
      ];
      const cleanupError = cleanup.find((result) => result.error)?.error;
      if (cleanupError) throw new Error(cleanupError.message);
    }

    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const materials = lsGet<StoredMaterial[]>(LS_MATERIALS, []);
  const materialIds = new Set(
    materials.filter((m) => m.courseId === id).map((m) => m.id)
  );

  const list = lsGet<StoredCourse[]>(LS_COURSES, []);
  lsSet(LS_COURSES, list.filter((c) => c.id !== id));
  lsSet(
    LS_MATERIALS,
    materials.filter((m) => !materialIds.has(m.id))
  );

  const bank = lsGet<Record<string, unknown[]>>(LS_BANK, {});
  for (const materialId of materialIds) delete bank[materialId];
  lsSet(LS_BANK, bank);

  const missed = lsGet<StoredMissedQuestion[]>(LS_MISSED, []);
  lsSet(
    LS_MISSED,
    missed.filter((m) => !materialIds.has(m.materialId))
  );
}
