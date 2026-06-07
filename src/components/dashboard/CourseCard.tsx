import { themeGradient } from '../../lib/themes';
import type { Course } from '../../lib/courses';

interface Props {
  course: Course;
  onClick: () => void;
}

/** A course rendered as a themed card (used on the home grid). */
export default function CourseCard({ course, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group relative h-[200px] overflow-hidden rounded-2xl border-2 border-[#dee2de] text-left transition-colors hover:border-[#b8beb8]"
    >
      <div
        className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: themeGradient(course.theme) }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="font-mondwest text-[24px] leading-tight">{course.name}</h3>
        {course.description && (
          <p className="mt-1 text-[13px] leading-snug text-white/80 line-clamp-2">
            {course.description}
          </p>
        )}
        <p className="mt-2 text-[12px] text-white/70">
          {course.chapterCount} chapter{course.chapterCount === 1 ? '' : 's'}
        </p>
      </div>
    </button>
  );
}
