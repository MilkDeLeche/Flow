import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  NotebookTabs,
  Plus,
  Play,
  Share2,
  Target,
  Trash2,
} from 'lucide-react';
import { themeGradient } from '../../lib/themes';
import { listMaterialsByCourse, type RecentMaterial } from '../../lib/store';
import { listAttemptsForMaterials, type Attempt } from '../../lib/history';
import type { Course } from '../../lib/courses';
import { deleteCourse, getCourseShareId, setCourseShare, updateCourse } from '../../lib/courses';
import { supabaseEnabled } from '../../lib/supabase';
import { useLocale } from '../../lib/i18n';

interface Props {
  course: Course;
  refreshKey: number;
  onBack: () => void;
  onAddChapter: () => void;
  onRead: (m: RecentMaterial) => void;
  onStudy: (m: RecentMaterial) => void;
  onReview: () => void;
  onChanged: () => void;
  onDelete: () => void;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function CourseDetail({
  course,
  refreshKey,
  onBack,
  onAddChapter,
  onRead,
  onStudy,
  onReview,
  onChanged,
  onDelete,
}: Props) {
  const { t } = useLocale();
  const [chapters, setChapters] = useState<RecentMaterial[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [semester, setSemester] = useState(course.semester || '');
  const [year, setYear] = useState(course.year || '');
  const [finishedAt, setFinishedAt] = useState(course.finishedAt || '');
  const [savingMeta, setSavingMeta] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let on = true;
    listMaterialsByCourse(course.id).then(async (mats) => {
      if (!on) return;
      setChapters(mats);
      const atts = await listAttemptsForMaterials(mats.map((m) => m.id));
      if (on) setAttempts(atts);
    });
    return () => {
      on = false;
    };
  }, [course.id, refreshKey]);

  useEffect(() => {
    setSemester(course.semester || '');
    setYear(course.year || '');
    setFinishedAt(course.finishedAt || '');
  }, [course.id, course.semester, course.year, course.finishedAt]);

  useEffect(() => {
    if (supabaseEnabled) getCourseShareId(course.id).then(setShareId);
  }, [course.id]);

  const shareUrl = shareId ? `${window.location.origin}/?shared=${shareId}` : '';
  const toggleShare = async () => {
    setShareBusy(true);
    const next = await setCourseShare(course.id, !shareId);
    setShareId(next);
    setShareBusy(false);
  };
  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const quizzes = attempts.filter((a) => a.mode !== 'exam');
  const tests = attempts.filter((a) => a.mode === 'exam');
  const latestChapter = chapters[0];
  const bestScore = attempts.length
    ? Math.max(...attempts.map((a) => Math.round((a.score / Math.max(1, a.total)) * 100)))
    : 0;
  const saveMeta = async (nextFinishedAt = finishedAt) => {
    setSavingMeta(true);
    await updateCourse(course.id, {
      semester,
      year,
      finishedAt: nextFinishedAt || null,
    });
    onChanged();
    setSavingMeta(false);
  };
  const markFinished = async () => {
    const doneAt = new Date().toISOString();
    setFinishedAt(doneAt);
    await saveMeta(doneAt);
  };
  const reopenCourse = async () => {
    setFinishedAt('');
    await saveMeta('');
  };
  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCourse(course.id);
      onDelete();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t.deleteCourseFailed);
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1120px] px-5 pb-16 pt-6 md:px-8">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} /> {t.allCourses}
      </button>

      <div
        className="relative mb-6 overflow-hidden rounded-2xl px-5 py-6 text-white md:px-7 md:py-8"
        style={
          course.imageUrl
            ? {
                backgroundImage: `url(${course.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { backgroundImage: themeGradient(course.theme) }
        }
      >
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-1 text-[12px] text-white/85">
              <GraduationCap size={14} /> {t.courseDashboard}
            </p>
            <h1 className="font-mondwest text-[34px] leading-tight md:text-[52px]">
              {course.name}
            </h1>
            {course.description && (
              <p className="mt-2 max-w-[660px] text-[14px] leading-relaxed text-white/85">
                {course.description}
              </p>
            )}
            <p className="mt-4 text-[12px] text-white/75">
              {chapters.length} {t.chapters.toLowerCase()} - {quizzes.length}{' '}
              {t.quiz.toLowerCase()} - {tests.length} {t.test.toLowerCase()}
            </p>
          </div>
          <div className="rounded-xl bg-black/28 p-4 backdrop-blur-sm">
            <p className="mb-1 text-[12px] text-white/75">{t.readyNext}</p>
            <p className="line-clamp-2 text-[18px] font-semibold">
              {latestChapter ? latestChapter.title : t.noChaptersShort}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {latestChapter ? (
                <>
                  <button
                    onClick={() => onStudy(latestChapter)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] text-ink transition-colors hover:bg-surface-muted"
                  >
                    <Play size={14} /> {t.startQuizPlain}
                  </button>
                  <button
                    onClick={() => onRead(latestChapter)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/35 px-4 py-2.5 text-[13px] text-white transition-colors hover:bg-white/12"
                  >
                    <BookOpen size={14} /> {t.openReader}
                  </button>
                </>
              ) : (
                <button
                  onClick={onAddChapter}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] text-ink transition-colors hover:bg-surface-muted"
                >
                  <Plus size={14} /> {t.addChapter}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface-card px-4 py-3">
          <p className="mb-1 flex items-center gap-2 text-[12px] text-ink-secondary">
            <FileText size={14} /> {t.chapterModules}
          </p>
          <p className="text-[26px] font-semibold text-ink">{chapters.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-card px-4 py-3">
          <p className="mb-1 flex items-center gap-2 text-[12px] text-ink-secondary">
            <NotebookTabs size={14} /> {t.quizAttempts}
          </p>
          <p className="text-[26px] font-semibold text-ink">{attempts.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-card px-4 py-3">
          <p className="mb-1 flex items-center gap-2 text-[12px] text-ink-secondary">
            <CheckCircle2 size={14} /> {t.bestScore}
          </p>
          <p className="text-[26px] font-semibold text-ink">
            {attempts.length ? `${bestScore}%` : t.notStarted}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={onAddChapter}
          className="btn-primary gap-2 px-5 py-2.5 text-[14px]"
        >
          <Plus size={16} /> {t.addChapter}
        </button>
        <button
          onClick={onReview}
          className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface-card text-ink px-5 py-2.5 text-[14px] transition-colors hover:bg-surface-muted"
        >
          <Target size={16} /> {t.reviewMistakes}
        </button>
      </div>

      <section className="mb-8 rounded-xl border border-line bg-surface-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-[12px] text-ink-secondary">Semester</label>
            <input
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="Fall, Spring, Summer..."
              className="input-field h-10 rounded-lg px-3 text-[14px]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] text-ink-secondary">Year</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2026"
              className="input-field h-10 rounded-lg px-3 text-[14px]"
            />
          </div>
          <button
            onClick={() => saveMeta()}
            disabled={savingMeta}
            className="btn-outline h-10 px-4 text-[13px] disabled:opacity-50"
          >
            Save details
          </button>
          {finishedAt ? (
            <button
              onClick={reopenCourse}
              disabled={savingMeta}
              className="btn-outline h-10 px-4 text-[13px] disabled:opacity-50"
            >
              Reopen
            </button>
          ) : (
            <button
              onClick={markFinished}
              disabled={savingMeta}
              className="btn-primary h-10 px-4 text-[13px] disabled:opacity-50"
            >
              Finished
            </button>
          )}
        </div>
        <p className="mt-2 text-[12px] text-ink-muted">
          {finishedAt
            ? `Finished ${fmtDate(finishedAt)}`
            : 'Mark the class finished when the semester is over.'}
        </p>
      </section>

      {supabaseEnabled && (
        <section className="mb-8 rounded-xl border border-line bg-surface-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="inline-flex items-center gap-2 text-[14px] font-medium text-ink">
                <Share2 size={15} /> {t.shareCourse}
              </h2>
              <p className="mt-1 max-w-[680px] text-[12px] leading-relaxed text-ink-secondary">
                {t.shareCourseHint}
              </p>
            </div>
            <button
              onClick={toggleShare}
              disabled={shareBusy}
              className="btn-outline shrink-0 gap-2 px-4 py-2 text-[13px] disabled:opacity-50"
            >
              {shareBusy ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              {shareId ? t.shareOff : t.shareOn}
            </button>
          </div>
          {shareId && (
            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="input-field h-9 flex-1 px-3 text-[12px]"
              />
              <button onClick={copyLink} className="btn-primary h-9 shrink-0 px-3 text-[12px]">
                {copied ? t.copied : t.copyLink}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="mb-8 rounded-xl border border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[14px] font-medium text-red-950 dark:text-red-300">
              {t.deleteCourse}
            </h2>
            <p className="mt-1 max-w-[680px] text-[12px] leading-relaxed text-red-800/80 dark:text-red-300/70">
              {t.deleteCourseHint}
            </p>
          </div>
          {confirmDelete ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center rounded-full border-2 border-red-300 bg-surface-card px-4 text-[13px] text-red-700 transition-colors hover:bg-red-950/20 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-700 px-4 text-[13px] text-white transition-colors hover:bg-red-800 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t.confirmDeleteCourse}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border-2 border-red-300 bg-surface-card px-4 text-[13px] text-red-700 transition-colors hover:bg-red-950/20 dark:border-red-800 dark:text-red-400"
            >
              <Trash2 size={14} /> {t.deleteCourse}
            </button>
          )}
        </div>
        {deleteError && (
          <p className="mt-3 text-[12px] text-red-700">{deleteError}</p>
        )}
      </section>

      <h2 className="mb-3 text-[15px] font-medium text-ink">{t.courseModules}</h2>
      {chapters.length === 0 ? (
        <p className="mb-8 rounded-xl border-2 border-dashed border-line px-4 py-6 text-center text-[14px] text-ink-muted">
          {t.noChapters}
        </p>
      ) : (
        <ul className="mb-8 space-y-3">
          {chapters.map((m) => (
            <li
              key={m.id}
              className="grid gap-3 rounded-xl border border-line bg-surface-card px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-1 inline-flex items-center gap-2 text-[12px] text-ink-muted">
                  <FileText size={13} /> {t.chapterMaterial}
                </p>
                <p className="truncate text-[16px] font-semibold text-ink">{m.title}</p>
                <p className="text-[12px] text-ink-secondary">
                  {t.addedDate(fmtDate(m.createdAt))}
                  {m.lastScore
                    ? ` - ${m.lastScore.score}/${m.lastScore.total}`
                    : ''}
                </p>
                <p className="mt-2 line-clamp-2 max-w-[680px] text-[13px] leading-relaxed text-ink-secondary">
                  {m.content.replace(/\s+/g, ' ').slice(0, 220)}
                  {m.content.length > 220 ? '...' : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  onClick={() => onRead(m)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-surface-card text-ink px-4 py-2 text-[13px] transition-colors hover:bg-surface-muted"
                >
                  <BookOpen size={13} /> {t.read}
                </button>
                <button
                  onClick={() => onStudy(m)}
                  className="btn-primary gap-1.5 px-4 py-2 text-[13px]"
                >
                  <Play size={13} /> {t.quiz}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-[15px] font-medium text-ink">{t.quizzesTests}</h2>
      {attempts.length === 0 ? (
        <p className="text-[14px] text-ink-muted">{t.noAttempts}</p>
      ) : (
        <ul className="space-y-2">
          {attempts.slice(0, 20).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-line px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] text-ink">
                  {a.material_title}
                </p>
                <p className="text-[12px] text-ink-secondary">
                  {a.mode === 'exam' ? t.test : t.quiz} - {fmtDate(a.created_at)}
                </p>
              </div>
              <span className="shrink-0 text-[14px] font-medium text-ink">
                {a.score}/{a.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
