import { useRef } from 'react';
import {
  TrendingUp,
  Lightbulb,
  Languages,
  FileText,
  Image as ImageIcon,
  Target,
  History,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

interface Feature {
  title: string;
  desc: string;
  icons: LucideIcon[];
}

const FEATURES: Feature[] = [
  {
    title: 'Progressive practice rounds',
    desc: 'Start at 10 questions and ramp up — 20, 30, 40, 50 — so the material gets harder as you actually learn it.',
    icons: [TrendingUp],
  },
  {
    title: 'Every wrong answer explained',
    desc: 'Miss one and Flow·quiz tells you exactly why it’s wrong (and why the right one is right), so you fix the gap.',
    icons: [Lightbulb],
  },
  {
    title: 'Quizzes in your language',
    desc: 'English chapter → English quiz. Diapositivas de economía → quiz en español. It writes in the language of your material.',
    icons: [Languages],
  },
  {
    title: 'Chapters, PDFs & slides',
    desc: 'Paste text or drop a file. Scanned or figure-heavy PDFs (diagrams, geometry) are read visually, with math as real formulas.',
    icons: [FileText, ImageIcon],
  },
  {
    title: 'Review your mistakes',
    desc: 'Missed questions go into a Review pile you can drill until they stick — answer right and they leave the pile.',
    icons: [Target],
  },
  {
    title: 'Saved & cached',
    desc: 'Your history syncs across devices, and generated questions are cached per material so retakes don’t cost a thing.',
    icons: [History, Sparkles],
  },
];

/** Three-up responsive grid of real features with a staggered scroll reveal. */
export default function FeaturesGrid() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        gsap.set('.feature-title, .feature-card', { opacity: 1, y: 0 });
        return;
      }

      gsap.from('.feature-title', {
        opacity: 0,
        y: 18,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 80%', once: true },
      });

      // Each card reveals as it enters the viewport, batched + staggered.
      gsap.set('.feature-card', { opacity: 0, y: 20 });
      ScrollTrigger.batch('.feature-card', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.1,
            overwrite: true,
          }),
      });
    },
    { scope: root }
  );

  return (
    <section
      id="features"
      ref={root}
      className="scroll-mt-24 border-t border-[#e8e8e8] px-5 py-12 lg:px-10 lg:py-20"
    >
      <h2 className="feature-title mb-8 max-w-[760px] font-mondwest text-[28px] leading-tight md:text-[40px] lg:mb-12 lg:text-[48px]">
        Everything you need to actually learn the material
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="feature-card flex flex-col rounded-2xl border-2 border-[#dee2de] p-6 transition-colors hover:border-[#b8beb8]"
          >
            <h3 className="text-[18px] font-medium text-[#2c2c2c]">{f.title}</h3>
            <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-[#646464]">
              {f.desc}
            </p>
            <div className="mt-5 flex gap-2">
              {f.icons.map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef1ed] text-[#646464]"
                >
                  <Icon size={16} />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
