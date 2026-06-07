import { supabase } from './supabase';

export interface SavedMaterial {
  id: string;
  created_at: string;
  title: string;
  content: string;
  source_type: string;
  char_count: number;
}

export interface Attempt {
  id: string;
  created_at: string;
  material_id: string | null;
  material_title: string;
  round_size: number;
  score: number;
  total: number;
  user_name: string;
  mode: string;
}

export async function saveMaterial(
  title: string,
  content: string,
  sourceType: string
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('materials')
    .insert({
      title,
      content,
      source_type: sourceType,
      char_count: content.length,
    })
    .select('id')
    .single();
  if (error) {
    console.warn('saveMaterial failed:', error.message);
    return null;
  }
  return data.id;
}

export async function saveAttempt(a: {
  materialId: string | null;
  materialTitle: string;
  roundSize: number;
  score: number;
  total: number;
  userName: string;
  mode?: string;
}): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('attempts').insert({
    material_id: a.materialId,
    material_title: a.materialTitle,
    round_size: a.roundSize,
    score: a.score,
    total: a.total,
    user_name: a.userName,
    mode: a.mode ?? 'practice',
  });
  if (error) console.warn('saveAttempt failed:', error.message);
}

/** All attempts for a set of materials (a course's chapters), newest first. */
export async function listAttemptsForMaterials(
  materialIds: string[]
): Promise<Attempt[]> {
  if (!supabase || !materialIds.length) return [];
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .in('material_id', materialIds)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Attempt[];
}

export async function listAttempts(limit = 50): Promise<Attempt[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('listAttempts failed:', error.message);
    return [];
  }
  return data as Attempt[];
}

export async function listMaterials(limit = 50): Promise<SavedMaterial[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('listMaterials failed:', error.message);
    return [];
  }
  return data as SavedMaterial[];
}
