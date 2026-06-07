import { useEffect, useState } from 'react';
import { Pencil, Trash2, Check, X, Image as ImageIcon } from 'lucide-react';
import AddCourseForm from './AddCourseForm';
import { THEMES, themeGradient } from '../../lib/themes';
import {
  listCourses,
  updateCourse,
  deleteCourse,
  type Course,
} from '../../lib/courses';

interface Props {
  byokActive: boolean;
  onOpenCourse: (c: Course) => void;
  onChanged: () => void;
  refreshKey: number;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read that image.'));
    r.readAsDataURL(file);
  });
}

export default function Dashboard({
  byokActive,
  onOpenCourse,
  onChanged,
  refreshKey,
}: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftTheme, setDraftTheme] = useState(THEMES[0].key);
  const [draftImageUrl, setDraftImageUrl] = useState<string | undefined>();
  const [editError, setEditError] = useState<string | null>(null);

  const reload = () => listCourses().then(setCourses);

  useEffect(() => {
    reload();
  }, [refreshKey]);

  const startEdit = (c: Course) => {
    setEditingId(c.id);
    setDraftName(c.name);
    setDraftDesc(c.description);
    setDraftTheme(c.theme);
    setDraftImageUrl(c.imageUrl);
    setEditError(null);
  };

  const saveEdit = async (id: string) => {
    await updateCourse(id, {
      name: draftName,
      description: draftDesc,
      theme: draftTheme,
      imageUrl: draftImageUrl ?? null,
    });
    setEditingId(null);
    await reload();
    onChanged();
  };

  const onEditImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEditError('Choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setEditError('Course images need to be under 2 MB.');
      return;
    }
    setEditError(null);
    setDraftImageUrl(await fileToDataUrl(file));
  };

  const remove = async (c: Course) => {
    if (!window.confirm(`Delete "${c.name}"? Its chapters stay but become uncategorized.`))
      return;
    await deleteCourse(c.id);
    await reload();
    onChanged();
  };

  return (
    <div className="mx-auto max-w-[760px] px-5 pb-16 pt-10 md:px-8">
      <h1 className="mb-6 font-mondwest text-[32px] leading-none md:text-[42px]">
        Dashboard
      </h1>

      <div className="space-y-6">
        <AddCourseForm
          byokActive={byokActive}
          onCreated={(c) => {
            reload();
            onChanged();
            onOpenCourse(c);
          }}
        />

        {/* Manage courses */}
        <div className="rounded-2xl border-2 border-[#dee2de] p-5">
          <h3 className="mb-3 text-[15px] font-medium text-[#2c2c2c]">Your courses</h3>
          {courses.length === 0 ? (
            <p className="text-[13px] text-[#b4b8b4]">No courses yet.</p>
          ) : (
            <ul className="space-y-3">
              {courses.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-[#e8e8e8] p-3"
                >
                  {editingId === c.id ? (
                    <div className="space-y-2">
                      <input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className="w-full rounded-lg border-2 border-[#dde3dd] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#b8beb8]"
                      />
                      <textarea
                        value={draftDesc}
                        onChange={(e) => setDraftDesc(e.target.value)}
                        rows={2}
                        placeholder="What it's about"
                        className="w-full resize-y rounded-lg border-2 border-[#dde3dd] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#b8beb8]"
                      />
                      <div className="flex flex-wrap gap-2">
                        {THEMES.map((t) => (
                          <button
                            key={t.key}
                            onClick={() => setDraftTheme(t.key)}
                            title={t.label}
                            className={`h-7 w-7 rounded-full border-2 ${
                              draftTheme === t.key ? 'border-[#2c2c2c] scale-110' : 'border-white'
                            }`}
                            style={{ backgroundImage: themeGradient(t.key) }}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#dde3dd] px-3 py-1.5 text-[13px] hover:bg-[#eef1ed]">
                          <ImageIcon size={13} /> {draftImageUrl ? 'Change image' : 'Upload image'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif,image/*"
                            className="hidden"
                            onChange={(e) => onEditImage(e.target.files?.[0])}
                          />
                        </label>
                        {draftImageUrl && (
                          <button
                            onClick={() => setDraftImageUrl(undefined)}
                            className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#dde3dd] px-3 py-1.5 text-[13px] hover:bg-[#eef1ed]"
                          >
                            <X size={13} /> Remove image
                          </button>
                        )}
                      </div>
                      {draftImageUrl && (
                        <div className="h-24 overflow-hidden rounded-lg border border-[#e8e8e8]">
                          <img src={draftImageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      )}
                      {editError && <p className="text-[12px] text-red-600">{editError}</p>}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveEdit(c.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[13px] text-white hover:bg-[#2c2c2c]"
                        >
                          <Check size={13} /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#dde3dd] px-3 py-1.5 text-[13px] hover:bg-[#eef1ed]"
                        >
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span
                          className="h-10 w-10 shrink-0 rounded-lg"
                          style={{ backgroundImage: themeGradient(c.theme) }}
                        />
                      )}
                      <button
                        onClick={() => onOpenCourse(c)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-[14px] font-medium text-[#2c2c2c]">
                          {c.name}
                        </p>
                        <p className="truncate text-[12px] text-[#646464]">
                          {c.chapterCount} chapter{c.chapterCount === 1 ? '' : 's'}
                          {c.description ? ` · ${c.description}` : ''}
                        </p>
                      </button>
                      <button
                        onClick={() => startEdit(c)}
                        title="Edit"
                        className="text-[#646464] transition-colors hover:text-[#2c2c2c]"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        title="Delete"
                        className="text-red-600 transition-colors hover:text-red-700"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
