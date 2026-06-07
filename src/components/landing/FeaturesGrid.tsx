import {
  Wrench,
  Activity,
  MessageSquare,
  FileText,
  Newspaper,
  Mail,
  Calendar,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import TextFade from '../TextFade';

interface Feature {
  title: string;
  desc: string;
  icons: LucideIcon[];
}

const FEATURES: Feature[] = [
  {
    title: 'Research this company (FlowMate)',
    desc: 'Execute investor-grade business analysis: generate detailed spreadsheets, gather web intel, compare rivals, and build team dossiers.',
    icons: [Wrench],
  },
  {
    title: "Check the dev team's progress",
    desc: "View a quick overview of your developer squad's activity, goals, and blockers.",
    icons: [Activity, MessageSquare],
  },
  {
    title: 'Build my CV from available information',
    desc: 'Generate a shareable PDF curriculum using stored facts and web sources, excluding any private contact info.',
    icons: [FileText],
  },
  {
    title: 'Turn this into retro pixels',
    desc: 'Transform any photo into vintage pixelated graphics with custom resolution.',
    icons: [],
  },
  {
    title: 'Track Industry Sites and Send Weekly Digest Each Monday',
    desc: 'Watch leading tech and development sources for fresh content then deliver Monday briefings with main insights and URLs.',
    icons: [Newspaper],
  },
  {
    title: 'Morning schedule digest',
    desc: 'Every AM, outline your agenda with important background and recommended preparation.',
    icons: [Mail, Calendar],
  },
];

/** Three-up responsive grid of capability cards. */
export default function FeaturesGrid() {
  return (
    <section
      id="features"
      className="scroll-mt-24 border-t border-[#e8e8e8] px-5 py-12 lg:px-10 lg:py-20"
    >
      <TextFade direction="up" staggerChildren={0.12}>
        <h2 className="mb-8 max-w-[760px] font-mondwest text-[28px] leading-tight md:text-[40px] lg:mb-12 lg:text-[48px]">
          Discover what FlowMate can accomplish for your team
        </h2>
      </TextFade>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex flex-col rounded-2xl border-2 border-[#dee2de] p-6 transition-colors hover:border-[#b8beb8]"
          >
            <h3 className="text-[18px] font-medium text-[#2c2c2c]">{f.title}</h3>
            <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-[#646464]">
              {f.desc}
            </p>
            {f.icons.length > 0 && (
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
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
