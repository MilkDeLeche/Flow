import { supabase } from './supabase';

export interface ReaderMarks {
  highlights: string[];
  notes: Record<string, string>;
}

const EMPTY_MARKS: ReaderMarks = { highlights: [], notes: {} };

export async function loadReaderMarks(materialId: string): Promise<ReaderMarks> {
  if (!supabase) return EMPTY_MARKS;

  const { data, error } = await supabase
    .from('reader_marks')
    .select('section_id,highlighted,note')
    .eq('material_id', materialId);

  if (error || !data) return EMPTY_MARKS;

  const highlights: string[] = [];
  const notes: Record<string, string> = {};

  for (const row of data) {
    const sectionId = row.section_id as string;
    if (row.highlighted) highlights.push(sectionId);
    if (typeof row.note === 'string' && row.note.trim()) notes[sectionId] = row.note;
  }

  return { highlights, notes };
}

export async function saveReaderMark(args: {
  materialId: string;
  sectionId: string;
  highlighted: boolean;
  note: string;
}): Promise<void> {
  const { materialId, sectionId, highlighted, note } = args;

  if (!supabase) return;

  const trimmed = note.trim();
  if (!highlighted && !trimmed) {
    await supabase
      .from('reader_marks')
      .delete()
      .eq('material_id', materialId)
      .eq('section_id', sectionId);
    return;
  }

  await supabase.from('reader_marks').upsert(
    {
      material_id: materialId,
      section_id: sectionId,
      highlighted,
      note,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'material_id,section_id' }
  );
}
