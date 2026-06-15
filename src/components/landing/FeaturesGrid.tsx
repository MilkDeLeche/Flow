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
import { useLocale } from '../../lib/i18n';

/** Three-up responsive grid of real features with a staggered scroll reveal. */
export default function FeaturesGrid() {
  const { t } = useLocale();
  const root = useRef<HTMLElement>(null);

  const features: Array<{ title: string; desc: string; icons: LucideIcon[] }> = [
    { title: t.featureProgressiveTitle, desc: t.featureProgressiveDesc, icons: [TrendingUp] },
    { title: t.featureExplainTitle, desc: t.featureExplainDesc, icons: [Lightbulb] },
    { title: t.featureLanguageTitle, desc: t.featureLanguageDesc, icons: [Languages] },
    {
      title: t.featureFilesTitle,
      desc: t.featureFilesDesc,
      icons: [FileText, ImageIcon],
    },
    { title: t.featureReviewTitle, desc: t.featureReviewDesc, icons: [Target] },
    {
      title: t.featureOrganizedTitle,
      desc: t.featureOrganizedDesc,
      icons: [History, Sparkles],
    },
  ];

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
      className="scroll-mt-24 border-t border-line px-5 py-12 lg:px-10 lg:py-20"
    >
      <h2 className="feature-title mb-8 max-w-[760px] font-mondwest text-[28px] leading-tight text-ink md:text-[40px] lg:mb-12 lg:text-[48px]">
        {t.featuresTitle}
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="feature-card flex flex-col rounded-2xl border-2 border-line p-6 transition-colors hover:border-line-strong"
          >
            <h3 className="text-[18px] font-medium text-ink">{f.title}</h3>
            <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-ink-secondary">
              {f.desc}
            </p>
            <div className="mt-5 flex gap-2">
              {f.icons.map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-ink-secondary"
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
