import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Play, Target } from 'lucide-react';
import { themeGradient } from '../../lib/themes';
import { listMaterialsByCourse, type RecentMaterial } from '../../lib/store';
import { listAttemptsForMaterials, type Attempt } from '../../lib/history';
import type { Course } from '../../lib/courses';

interface Props {
  course: Course;
  refreshKey: number;
  onBack: () => void;
  onAddChapter: () => void;
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
  onStudy,
  onReview,
}: Props) {
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

  return (
    <div className="mx-auto max-w-[860px] px-5 pb-16 pt-6 md:px-8">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-[#646464] transition-colors hover:text-[#2c2c2c]"
      >
        <ArrowLeft size={15} /> All courses
      </button>

      {/* Banner */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white"
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
        <div className="relative">
          <h1 className="font-mondwest text-[30px] leading-tight md:text-[40px]">
            {course.name}
          </h1>
          {course.description && (
            <p className="mt-1 max-w-[600px] text-[14px] text-white/85">
              {course.description}
            </p>
          )}
          <p className="mt-3 text-[12px] text-white/70">
            {chapters.length} chapter{chapters.length === 1 ? '' : 's'} ·{' '}
            {quizzes.length} quiz{quizzes.length === 1 ? '' : 'zes'} · {tests.length}{' '}
            test{tests.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={onAddChapter}
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[14px] text-white transition-colors hover:bg-[#2c2c2c]"
        >
          <Plus size={16} /> Add chapter
        </button>
        <button
          onClick={onReview}
          className="inline-flex items-center gap-2 rounded-full border-2 border-[#dde3dd] bg-white px-5 py-2.5 text-[14px] transition-colors hover:bg-[#eef1ed]"
        >
          <Target size={16} /> Review mistakes
        </button>
      </div>

      {/* Chapters */}
      <h2 className="mb-3 text-[15px] font-medium text-[#2c2c2c]">Chapters & material</h2>
      {chapters.length === 0 ? (
        <p className="mb-8 rounded-xl border-2 border-dashed border-[#dde3dd] px-4 py-6 text-center text-[14px] text-[#b4b8b4]">
          No chapters yet. Add your first one to start quizzing.
        </p>
      ) : (
        <ul className="mb-8 space-y-2">
          {chapters.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-[#e8e8e8] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-[#2c2c2c]">
                  {m.title}
                </p>
                <p className="text-[12px] text-[#646464]">
                  Added {fmtDate(m.createdAt)}
                  {m.lastScore
                    ? ` · last ${m.lastScore.score}/${m.lastScore.total}`
                    : ''}
                </p>
              </div>
              <button
                onClick={() => onStudy(m)}
                className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] text-white transition-colors hover:bg-[#2c2c2c]"
              >
                <Play size={13} /> Study
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Quizzes & tests history */}
      <h2 className="mb-3 text-[15px] font-medium text-[#2c2c2c]">Quizzes & tests</h2>
      {attempts.length === 0 ? (
        <p className="text-[14px] text-[#b4b8b4]">
          No attempts yet — they’ll show here once you take a quiz or an exam.
        </p>
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
                  {a.mode === 'exam' ? 'Test' : 'Quiz'} · {fmtDate(a.created_at)}
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
