import { useRef, useState } from 'react';
import { Upload, Sparkles, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { THEMES, themeGradient } from '../../lib/themes';
import { extractTextFromFile, readPdf } from '../../lib/extract';
import { parseCourseFromInput } from '../../lib/parseCourse';
import { createCourse, type Course } from '../../lib/courses';

interface Props {
  byokActive: boolean;
  onCreated: (
    c: Course,
    initialChapter?: { content: string; sourceType: string }
  ) => void;
}

const IMG_EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const res = String(r.result);
      resolve(res.includes(',') ? res.split(',')[1] : res);
    };
    r.onerror = () => reject(new Error('Could not read that file.'));
    r.readAsDataURL(file);
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read that image.'));
    r.readAsDataURL(file);
  });
}

/** Create a course — AI auto-fill from an upload (own key), or type it manually. */
export default function AddCourseForm({ byokActive, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [theme, setTheme] = useState(THEMES[0].key);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [pasteText, setPasteText] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const autofill = async (file: File) => {
    setError(null);
    setNote(null);
    setAiBusy(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let payload: Parameters<typeof parseCourseFromInput>[0] = {};
      if (ext === 'pdf') {
        const { text, base64 } = await readPdf(file);
        payload = text.trim().length > 200 ? { text } : { pdfBase64: base64 };
      } else if (IMG_EXT.includes(ext)) {
        payload = {
          imageBase64: await fileToBase64(file),
          imageMediaType: file.type || 'image/png',
        };
      } else {
        payload = { text: await extractTextFromFile(file) };
      }
      const meta = await parseCourseFromInput(payload);
      setName(meta.name);
      setDescription(meta.description);
      setNote('Filled in from your file — edit anything before saving.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Auto-fill failed.');
    } finally {
      setAiBusy(false);
    }
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (!byokActive) {
      setError('AI auto-fill needs your own API key (set it below). Or type the details manually.');
      return;
    }
    autofill(file);
  };

  const autofillFromPaste = async () => {
    if (!byokActive) {
      setError('AI auto-fill needs your own API key. Or type the details manually.');
      return;
    }
    if (pasteText.trim().length < 80) {
      setError('Paste a little more material so AI can tell what class this is.');
      return;
    }
    setError(null);
    setNote(null);
    setAiBusy(true);
    try {
      const meta = await parseCourseFromInput({ text: pasteText });
      setName(meta.name);
      setDescription(meta.description);
      setNote('Filled in from pasted material. You can edit it before saving.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Auto-fill failed.');
    } finally {
      setAiBusy(false);
    }
  };

  const onImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for the course card.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Course images need to be under 2 MB.');
      return;
    }
    setError(null);
    setImageUrl(await fileToDataUrl(file));
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Give the course a name.');
      return;
    }
    setBusy(true);
    const c = await createCourse({ name, description, theme, imageUrl, semester, year });
    setBusy(false);
    setName('');
    setDescription('');
    setSemester('');
    setYear('');
    setTheme(THEMES[0].key);
    setImageUrl(undefined);
    setNote(null);
    onCreated(
      c,
      pasteText.trim().length >= 40
        ? { content: pasteText, sourceType: 'paste' }
        : undefined
    );
    setPasteText('');
  };

  return (
    <div className="rounded-2xl border-2 border-line p-5">
      <h3 className="text-[15px] font-medium text-ink">Add a course</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
        Paste a chapter, syllabus, or notes so AI can infer the class and summary,
        or type everything yourself.
      </p>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="text-[12px] text-ink-secondary">Paste course material</label>
          <span className="text-[12px] text-ink-muted">
            {pasteText.length.toLocaleString()} chars
          </span>
        </div>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={5}
          placeholder="Paste a chapter, syllabus, study guide, or notes. AI will infer the course name and about text. If you save with chapter text here, it becomes the first chapter."
          className="w-full resize-y rounded-xl border-2 border-line bg-surface-card text-ink px-4 py-3 text-[14px] leading-relaxed outline-none transition-colors focus:border-line-strong"
        />
        <button
          onClick={autofillFromPaste}
          disabled={aiBusy || pasteText.trim().length < 80}
          className="mt-2 inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface-card text-ink px-4 py-2.5 text-[14px] transition-colors hover:bg-surface-muted disabled:opacity-50"
        >
          {aiBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Fill from pasted text
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={aiBusy}
          className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface-card text-ink px-4 py-2.5 text-[14px] transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          {aiBusy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {aiBusy ? 'Reading…' : 'Upload PDF / TXT / image'}
        </button>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Sparkles size={13} /> AI auto-fill {byokActive ? '' : '(needs your own key)'}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.pptx,.png,.jpg,.jpeg,.webp,.gif,image/*,text/plain"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      <div className="mt-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Course name — e.g. Biology 101"
          className="w-full rounded-xl border-2 border-line bg-surface-card text-ink px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-line-strong"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What it's about (optional)"
          className="w-full resize-y rounded-xl border-2 border-line bg-surface-card text-ink px-4 py-2.5 text-[14px] outline-none transition-colors focus:border-line-strong"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            placeholder="Semester (optional), e.g. Fall"
            className="w-full rounded-xl border-2 border-line bg-surface-card text-ink px-4 py-2.5 text-[14px] outline-none transition-colors focus:border-line-strong"
          />
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year (optional), e.g. 2026"
            className="w-full rounded-xl border-2 border-line bg-surface-card text-ink px-4 py-2.5 text-[14px] outline-none transition-colors focus:border-line-strong"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] text-ink-secondary">Card background</label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                title={t.label}
                className={`h-9 w-9 rounded-full border-2 transition-transform ${
                  theme === t.key ? 'border-accent scale-110' : 'border-line'
                }`}
                style={{ backgroundImage: themeGradient(t.key) }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] text-ink-secondary">Course image</label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => imageRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface-card text-ink px-4 py-2 text-[13px] transition-colors hover:bg-surface-muted"
            >
              <ImageIcon size={14} /> {imageUrl ? 'Change image' : 'Upload image'}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-line px-3 py-2 text-[13px] text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <X size={13} /> Remove
              </button>
            )}
            <input
              ref={imageRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/*"
              className="hidden"
              onChange={(e) => onImage(e.target.files?.[0])}
            />
          </div>
          {imageUrl && (
            <div className="mt-3 h-28 overflow-hidden rounded-xl border-2 border-line">
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        {note && <p className="text-[13px] text-[#2c7a4b]">{note}</p>}
        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button
          onClick={save}
          disabled={busy}
          className="btn-primary gap-2 px-5 py-2.5 text-[14px] disabled:opacity-60"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {pasteText.trim().length >= 40
            ? 'Create course + chapter'
            : 'Create course'}
        </button>
      </div>
    </div>
  );
}
