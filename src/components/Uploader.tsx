import { useRef, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import TextFade from './TextFade';
import { extractTextFromFile, isImageFile, readImage, readPdf } from '../lib/extract';
import { ROUND_SIZES, type QuizMode, type RoundSize } from '../lib/types';
import { supabaseEnabled } from '../lib/supabase';
import { useLocale } from '../lib/i18n';

const VISION_MAX_PAGES = 50;
const VISION_MAX_MB = 3;

interface UploaderProps {
  allowUpload: boolean; // free tier is paste-text only
  intent?: 'quiz' | 'chapter';
  courseName?: string;
  onStart: (args: {
    title: string;
    material: string;
    sourceType: string;
    roundSize: RoundSize;
    mode: QuizMode;
    pdfBase64?: string;
    imageBase64?: string;
    imageMediaType?: string;
  }) => void;
}

export default function Uploader({
  onStart,
  allowUpload,
  intent = 'quiz',
  courseName,
}: UploaderProps) {
  const { t } = useLocale();
  const [title, setTitle] = useState('');
  const [material, setMaterial] = useState('');
  const [sourceType, setSourceType] = useState('paste');
  const [roundSize, setRoundSize] = useState<RoundSize>(10);
  const [mode, setMode] = useState<QuizMode>('practice');
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | undefined>();
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imageMediaType, setImageMediaType] = useState<string | undefined>();
  const [visionNote, setVisionNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setVisionNote(null);
    setPdfBase64(undefined);
    setImageBase64(undefined);
    setImageMediaType(undefined);
    setExtracting(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
      if (isImageFile(file)) {
        const fileMb = file.size / 1_000_000;
        if (fileMb > VISION_MAX_MB) {
          setError(
            `That image is too large (limit ${VISION_MAX_MB}MB). Try a smaller or cropped photo.`
          );
        } else {
          const { base64, mediaType } = await readImage(file);
          setImageBase64(base64);
          setImageMediaType(mediaType);
          setMaterial(`Photo: ${file.name}`);
          setVisionNote(
            'I’ll read this photo — typed or handwritten text and diagrams — to build your quiz.'
          );
        }
      } else if (ext === 'pdf') {
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

  const canStart = material.trim().length >= 40 || !!pdfBase64 || !!imageBase64;
  const isChapter = intent === 'chapter';

  return (
    <section className="max-w-[760px] mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-16">
      <TextFade direction="up" staggerChildren={0.12}>
        <h1 className="font-mondwest text-ink text-[34px] md:text-[52px] leading-[0.98] mb-4">
          {isChapter ? t.addChapterTitle : t.uploadTitle}
        </h1>
        <p className="text-[16px] md:text-[18px] text-ink-secondary max-w-[560px] mb-8 leading-relaxed">
          {isChapter
            ? t.addChapterIntro(courseName ?? t.allMaterial)
            : t.uploadIntro}
        </p>
      </TextFade>

      <div className="space-y-5">
        <div>
          <label className="block text-[13px] text-ink-secondary mb-2">
            {isChapter ? t.chapterTitleOptional : t.nameMaterial}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              isChapter
                ? t.chapterTitlePlaceholder
                : t.materialPlaceholder
            }
            className="w-full px-4 py-3 text-[15px] btn-outline border-2 rounded-xl outline-none focus:border-line-strong transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] text-ink-secondary">
              {t.pasteMaterial}
            </label>
            <span className="text-[12px] text-ink-muted">
              {material.length.toLocaleString()} {t.characters}
            </span>
          </div>
          <textarea
            value={material}
            onChange={(e) => {
              setMaterial(e.target.value);
              setSourceType('paste');
              setPdfBase64(undefined);
              setImageBase64(undefined);
              setImageMediaType(undefined);
              setVisionNote(null);
            }}
            rows={9}
            placeholder={t.pastePlaceholder}
            className="w-full px-4 py-3 text-[14px] leading-relaxed btn-outline border-2 rounded-xl outline-none focus:border-line-strong transition-colors resize-y"
          />
        </div>

        {allowUpload ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-ink-muted">{t.or}</span>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={extracting}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[14px] btn-outline border-2 rounded-full hover:bg-surface-muted transition-colors disabled:opacity-60"
            >
              {extracting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {extracting ? t.readingFile : t.uploadFile}
            </button>
            {(material || pdfBase64) && sourceType !== 'paste' && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-secondary">
                <FileText size={14} /> {t.loadedFrom} .{sourceType}
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.pptx,.txt,.md,text/plain,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <p className="text-[12px] text-ink-muted">
            {t.uploadLocked}
          </p>
        )}

        {!isChapter && (
          <div>
            <label className="block text-[13px] text-ink-secondary mb-2">
              {t.startWith}
            </label>
            <div className="flex flex-wrap gap-2">
              {ROUND_SIZES.map((n) => (
                <button
                  key={n}
                  onClick={() => setRoundSize(n)}
                  className={`px-4 py-2 text-[14px] transition-colors ${
                    roundSize === n
                      ? 'btn-pill-active'
                      : 'btn-pill'
                  }`}
                >
                  {n} {t.questions}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isChapter && (
          <div>
            <label className="block text-[13px] text-ink-secondary mb-2">{t.mode}</label>
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
                  className={`px-4 py-2 text-[14px] transition-colors ${
                    mode === value
                      ? 'btn-pill-active'
                      : 'btn-pill'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-ink-muted mt-1.5">
              {mode === 'practice'
                ? t.practiceHint
                : t.examHint}
            </p>
          </div>
        )}

        {visionNote && (
          <p className="text-[13.5px] text-ink bg-surface-muted border border-line rounded-lg px-4 py-3">
            📐 {visionNote}
          </p>
        )}

        {error && (
          <p className="text-[14px] text-red-600 bg-red-50 border border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-900/50 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() =>
              onStart({
                title: title.trim(),
                material,
                sourceType,
                roundSize,
                mode,
                pdfBase64,
                imageBase64,
                imageMediaType,
              })
            }
            disabled={!canStart}
            className="btn-primary px-6 py-3 text-[15px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isChapter ? t.saveChapter : t.startQuiz(roundSize, mode)}
          </button>
          {!canStart && (
            <span className="text-[13px] text-ink-muted">
              {t.addMaterial}
            </span>
          )}
        </div>

        {!supabaseEnabled && (
          <p className="text-[12px] text-ink-muted pt-2">
            {t.historyOff}
          </p>
        )}
      </div>
    </section>
  );
}
