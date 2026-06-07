import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import CourseCard from './CourseCard';
import JumpBackIn from '../JumpBackIn';
import TextFade from '../TextFade';
import { listCourses, type Course } from '../../lib/courses';
import type { RecentMaterial } from '../../lib/store';

interface Props {
  refreshKey: number;
  onOpenCourse: (c: Course) => void;
  onNewCourse: () => void;
  onQuickQuiz: () => void;
  onResume: (m: RecentMaterial) => void;
}

/** Signed-in home: the landing layout, personalized to the user's courses. */
export default function CoursesHome({
  refreshKey,
  onOpenCourse,
  onNewCourse,
  onQuickQuiz,
  onResume,
}: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let on = true;
    listCourses().then((c) => {
      if (on) {
        setCourses(c);
        setLoaded(true);
      }
    });
    return () => {
      on = false;
    };
  }, [refreshKey]);

  return (
    <div className="mx-auto max-w-[1000px] px-5 pb-16 pt-10 md:px-8">
      <TextFade direction="up">
        <h1 className="mb-2 font-mondwest text-[34px] leading-[0.98] md:text-[48px]">
          Your courses
        </h1>
        <p className="mb-8 text-[15px] text-[#646464] md:text-[16px]">
          Pick a class to study, or start a quick one-off quiz.
        </p>
      </TextFade>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} onClick={() => onOpenCourse(c)} />
        ))}
        <button
          onClick={onNewCourse}
          className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#dde3dd] text-[#646464] transition-colors hover:border-[#b8beb8] hover:bg-[#eef1ed]"
        >
          <Plus size={22} />
          <span className="text-[14px]">New course</span>
        </button>
      </div>

      {loaded && courses.length === 0 && (
        <p className="mt-4 text-[14px] text-[#b4b8b4]">
          No courses yet — create one to organize your chapters, quizzes, and tests.
        </p>
      )}

      <div className="mt-6">
        <button
          onClick={onQuickQuiz}
          className="text-[14px] text-[#646464] underline-offset-2 transition-colors hover:text-[#2c2c2c] hover:underline"
        >
          or take a quick quiz without a course →
        </button>
      </div>

      <JumpBackIn onResume={onResume} refreshKey={refreshKey} />
    </div>
  );
}
