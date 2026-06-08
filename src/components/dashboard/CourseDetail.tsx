import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  NotebookTabs,
  Plus,
  Play,
  Target,
} from 'lucide-react';
import { themeGradient } from '../../lib/themes';
import { listMaterialsByCourse, type RecentMaterial } from '../../lib/store';
import { listAttemptsForMaterials, type Attempt } from '../../lib/history';
import type { Course } from '../../lib/courses';
import { useLocale } from '../../lib/i18n';

interface Props {
  course: Course;
  refreshKey: number;
  onBack: () => void;
  onAddChapter: () => void;
  onRead: (m: RecentMaterial) => void;
  onStudy: (m: RecentMaterial) => void;
  onReview: () => void;
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
}: Props) {
  const { t } = useLocale();
  const [chapters, setChapters] = useState<RecentMaterial[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

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

  const quizzes = attempts.filter((a) => a.mode !== 'exam');
  const tests = attempts.filter((a) => a.mode === 'exam');
  const latestChapter = chapters[0];
  const bestScore = attempts.length
    ? Math.max(...attempts.map((a) => Math.round((a.score / Math.max(1, a.total)) * 100)))
    : 0;

  return (
    <div className="mx-auto max-w-[1120px] px-5 pb-16 pt-6 md:px-8">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-[#646464] transition-colors hover:text-[#2c2c2c]"
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
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] text-[#2c2c2c] transition-colors hover:bg-[#eef1ed]"
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
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] text-[#2c2c2c] transition-colors hover:bg-[#eef1ed]"
                >
                  <Plus size={14} /> {t.addChapter}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#dde3dd] bg-white px-4 py-3">
          <p className="mb-1 flex items-center gap-2 text-[12px] text-[#646464]">
            <FileText size={14} /> {t.chapterModules}
          </p>
          <p className="text-[26px] font-semibold text-[#2c2c2c]">{chapters.length}</p>
        </div>
        <div className="rounded-xl border border-[#dde3dd] bg-white px-4 py-3">
          <p className="mb-1 flex items-center gap-2 text-[12px] text-[#646464]">
            <NotebookTabs size={14} /> {t.quizAttempts}
          </p>
          <p className="text-[26px] font-semibold text-[#2c2c2c]">{attempts.length}</p>
        </div>
        <div className="rounded-xl border border-[#dde3dd] bg-white px-4 py-3">
          <p className="mb-1 flex items-center gap-2 text-[12px] text-[#646464]">
            <CheckCircle2 size={14} /> {t.bestScore}
          </p>
          <p className="text-[26px] font-semibold text-[#2c2c2c]">
            {attempts.length ? `${bestScore}%` : t.notStarted}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={onAddChapter}
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[14px] text-white transition-colors hover:bg-[#2c2c2c]"
        >
          <Plus size={16} /> {t.addChapter}
        </button>
        <button
          onClick={onReview}
          className="inline-flex items-center gap-2 rounded-full border-2 border-[#dde3dd] bg-white px-5 py-2.5 text-[14px] transition-colors hover:bg-[#eef1ed]"
        >
          <Target size={16} /> {t.reviewMistakes}
        </button>
      </div>

      <h2 className="mb-3 text-[15px] font-medium text-[#2c2c2c]">{t.courseModules}</h2>
      {chapters.length === 0 ? (
        <p className="mb-8 rounded-xl border-2 border-dashed border-[#dde3dd] px-4 py-6 text-center text-[14px] text-[#b4b8b4]">
          {t.noChapters}
        </p>
      ) : (
        <ul className="mb-8 space-y-3">
          {chapters.map((m) => (
            <li
              key={m.id}
              className="grid gap-3 rounded-xl border border-[#e1e5df] bg-white px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-1 inline-flex items-center gap-2 text-[12px] text-[#8a8f8a]">
                  <FileText size={13} /> {t.chapterMaterial}
                </p>
                <p className="truncate text-[16px] font-semibold text-[#2c2c2c]">{m.title}</p>
                <p className="text-[12px] text-[#646464]">
                  {t.addedDate(fmtDate(m.createdAt))}
                  {m.lastScore
                    ? ` - ${m.lastScore.score}/${m.lastScore.total}`
                    : ''}
                </p>
                <p className="mt-2 line-clamp-2 max-w-[680px] text-[13px] leading-relaxed text-[#646464]">
                  {m.content.replace(/\s+/g, ' ').slice(0, 220)}
                  {m.content.length > 220 ? '...' : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  onClick={() => onRead(m)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#dde3dd] bg-white px-4 py-2 text-[13px] transition-colors hover:bg-[#eef1ed]"
                >
                  <BookOpen size={13} /> {t.read}
                </button>
                <button
                  onClick={() => onStudy(m)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] text-white transition-colors hover:bg-[#2c2c2c]"
                >
                  <Play size={13} /> {t.quiz}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-[15px] font-medium text-[#2c2c2c]">{t.quizzesTests}</h2>
      {attempts.length === 0 ? (
        <p className="text-[14px] text-[#b4b8b4]">{t.noAttempts}</p>
      ) : (
        <ul className="space-y-2">
          {attempts.slice(0, 20).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-[#e8e8e8] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] text-[#2c2c2c]">
                  {a.material_title}
                </p>
                <p className="text-[12px] text-[#646464]">
                  {a.mode === 'exam' ? t.test : t.quiz} - {fmtDate(a.created_at)}
                </p>
              </div>
              <span className="shrink-0 text-[14px] font-medium text-[#2c2c2c]">
                {a.score}/{a.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
