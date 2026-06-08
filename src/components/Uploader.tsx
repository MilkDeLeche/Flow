import { useRef, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import TextFade from './TextFade';
import { extractTextFromFile, readPdf } from '../lib/extract';
import { ROUND_SIZES, type QuizMode, type RoundSize } from '../lib/types';
import { supabaseEnabled } from '../lib/supabase';
import { useLocale } from '../lib/i18n';

const VISION_MAX_PAGES = 50;
const VISION_MAX_MB = 3;

interface UploaderProps {
  allowUpload: boolean; // free tier is paste-text only
  onStart: (args: {
    title: string;
    material: string;
    sourceType: string;
    roundSize: RoundSize;
    mode: QuizMode;
    pdfBase64?: string;
  }) => void;
}

export default function Uploader({ onStart, allowUpload }: UploaderProps) {
  const { t } = useLocale();
  const [title, setTitle] = useState('');
  const [material, setMaterial] = useState('');
  const [sourceType, setSourceType] = useState('paste');
  const [roundSize, setRoundSize] = useState<RoundSize>(10);
  const [mode, setMode] = useState<QuizMode>('practice');
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | undefined>();
  const [visionNote, setVisionNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setVisionNote(null);
    setPdfBase64(undefined);
    setExtracting(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
      if (ext === 'pdf') {
        const { text, base64, numPages } = await readPdf(file);
        const fileMb = file.size / 1_000_000;
        // Thin text relative to page count => scanned / figure-based PDF.
        const thin = text.trim().length < Math.max(200, numPages * 100);
        if (thin && numPages <= VISION_MAX_PAGES && fileMb <= VISION_MAX_MB) {
          setPdfBase64(base64);
          setVisionNote(
            'This looks image/diagram-based — I’ll read it visually, including figures (one-time cost, then cached).'
          );
          setMaterial(text || `Visual PDF: ${file.name}`);
        } else if (thin) {
          setError(
            `This looks scanned/figure-based but is too large for visual reading (limit ${VISION_MAX_PAGES} pages / ${VISION_MAX_MB}MB). Paste the key text instead.`
          );
          setMaterial(text);
        } else {
          setMaterial(text);
        }
      } else {
        const text = await extractTextFromFile(file);
        if (!text.trim()) {
          setError('Could not read any text from that file.');
        } else {
          setMaterial(text);
        }
      }
      setSourceType(ext);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read file.');
    } finally {
      setExtracting(false);
    }
  };

  const canStart = material.trim().length >= 40 || !!pdfBase64;

  return (
    <section className="max-w-[760px] mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-16">
      <TextFade direction="up" staggerChildren={0.12}>
        <h1 className="font-mondwest text-[#2c2c2c] text-[34px] md:text-[52px] leading-[0.98] mb-4">
          {t.uploadTitle}
        </h1>
        <p className="text-[16px] md:text-[18px] text-[#444141] max-w-[560px] mb-8 leading-relaxed">
          {t.uploadIntro}
        </p>
      </TextFade>

      <div className="space-y-5">
        <div>
          <label className="block text-[13px] text-[#646464] mb-2">
            {t.nameMaterial}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.materialPlaceholder}
            className="w-full px-4 py-3 text-[15px] bg-white border-2 border-[#dde3dd] rounded-xl outline-none focus:border-[#b8beb8] transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] text-[#646464]">
              {t.pasteMaterial}
            </label>
            <span className="text-[12px] text-[#b4b8b4]">
              {material.length.toLocaleString()} {t.characters}
            </span>
          </div>
          <textarea
            value={material}
            onChange={(e) => {
              setMaterial(e.target.value);
              setSourceType('paste');
              setPdfBase64(undefined);
              setVisionNote(null);
            }}
            rows={9}
            placeholder={t.pastePlaceholder}
            className="w-full px-4 py-3 text-[14px] leading-relaxed bg-white border-2 border-[#dde3dd] rounded-xl outline-none focus:border-[#b8beb8] transition-colors resize-y"
          />
        </div>

        {allowUpload ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#b4b8b4]">{t.or}</span>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={extracting}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[14px] bg-white border-2 border-[#dde3dd] rounded-full hover:bg-[#eef1ed] transition-colors disabled:opacity-60"
            >
              {extracting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {extracting ? t.readingFile : t.uploadFile}
            </button>
            {(material || pdfBase64) && sourceType !== 'paste' && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#646464]">
                <FileText size={14} /> {t.loadedFrom} .{sourceType}
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.pptx,.txt,.md,text/plain"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <p className="text-[12px] text-[#b4b8b4]">
            {t.uploadLocked}
          </p>
        )}

        <div>
          <label className="block text-[13px] text-[#646464] mb-2">
            {t.startWith}
          </label>
          <div className="flex flex-wrap gap-2">
            {ROUND_SIZES.map((n) => (
              <button
                key={n}
                onClick={() => setRoundSize(n)}
                className={`px-4 py-2 text-[14px] rounded-full border-2 transition-colors ${
                  roundSize === n
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-[#2c2c2c] border-[#dde3dd] hover:bg-[#eef1ed]'
                }`}
              >
                {n} {t.questions}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[13px] text-[#646464] mb-2">{t.mode}</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['practice', t.practice, t.practiceHint],
                ['exam', t.exam, t.examHint],
              ] as const
            ).map(([value, label, desc]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                title={desc}
                className={`px-4 py-2 text-[14px] rounded-full border-2 transition-colors ${
                  mode === value
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-[#2c2c2c] border-[#dde3dd] hover:bg-[#eef1ed]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-[#b4b8b4] mt-1.5">
            {mode === 'practice'
              ? t.practiceHint
              : t.examHint}
          </p>
        </div>

        {visionNote && (
          <p className="text-[13.5px] text-[#2c2c2c] bg-[#eef1ed] border border-[#dde3dd] rounded-lg px-4 py-3">
            📐 {visionNote}
          </p>
        )}

        {error && (
          <p className="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() =>
              onStart({
                title: title.trim() || 'Untitled material',
                material,
                sourceType,
                roundSize,
                mode,
                pdfBase64,
              })
            }
            disabled={!canStart}
            className="px-6 py-3 text-[15px] bg-black text-white rounded-full hover:bg-[#2c2c2c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.startQuiz(roundSize, mode)}
          </button>
          {!canStart && (
            <span className="text-[13px] text-[#b4b8b4]">
              {t.addMaterial}
            </span>
          )}
        </div>

        {!supabaseEnabled && (
          <p className="text-[12px] text-[#b4b8b4] pt-2">
            {t.historyOff}
          </p>
        )}
      </div>
    </section>
  );
}
