import { useRef, useState } from 'react';
import { Upload, Sparkles, Loader2 } from 'lucide-react';
import { THEMES, themeGradient } from '../../lib/themes';
import { extractTextFromFile, readPdf } from '../../lib/extract';
import { parseCourseFromInput } from '../../lib/parseCourse';
import { createCourse, type Course } from '../../lib/courses';

interface Props {
  byokActive: boolean;
  onCreated: (c: Course) => void;
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

/** Create a course — AI auto-fill from an upload (own key), or type it manually. */
export default function AddCourseForm({ byokActive, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState(THEMES[0].key);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const save = async () => {
    if (!name.trim()) {
      setError('Give the course a name.');
      return;
    }
    setBusy(true);
    const c = await createCourse({ name, description, theme });
    setBusy(false);
    setName('');
    setDescription('');
    setTheme(THEMES[0].key);
    setNote(null);
    onCreated(c);
  };

  return (
    <div className="rounded-2xl border-2 border-[#dee2de] p-5">
      <h3 className="text-[15px] font-medium text-[#2c2c2c]">Add a course</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-[#646464]">
        Upload a syllabus, chapter, slides, or a photo of your notes and let AI
        name it for you — or just type it in.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={aiBusy}
          className="inline-flex items-center gap-2 rounded-full border-2 border-[#dde3dd] bg-white px-4 py-2.5 text-[14px] transition-colors hover:bg-[#eef1ed] disabled:opacity-60"
        >
          {aiBusy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {aiBusy ? 'Reading…' : 'Upload PDF / TXT / image'}
        </button>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#b4b8b4]">
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
          className="w-full rounded-xl border-2 border-[#dde3dd] bg-white px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-[#b8beb8]"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What it's about (optional)"
          className="w-full resize-y rounded-xl border-2 border-[#dde3dd] bg-white px-4 py-2.5 text-[14px] outline-none transition-colors focus:border-[#b8beb8]"
        />

        <div>
          <label className="mb-1.5 block text-[12px] text-[#646464]">Card background</label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                title={t.label}
                className={`h-9 w-9 rounded-full border-2 transition-transform ${
                  theme === t.key ? 'border-[#2c2c2c] scale-110' : 'border-white'
                }`}
                style={{ backgroundImage: themeGradient(t.key) }}
              />
            ))}
          </div>
        </div>

        {note && <p className="text-[13px] text-[#2c7a4b]">{note}</p>}
        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[14px] text-white transition-colors hover:bg-[#2c2c2c] disabled:opacity-60"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          Create course
        </button>
      </div>
    </div>
  );
}
