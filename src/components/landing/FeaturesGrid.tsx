import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  FileText,
  History,
  Image as ImageIcon,
  Languages,
  Lightbulb,
  Sparkle,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useLocale } from '../../lib/i18n';

const VIDEO_BACKGROUND =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_150203_44a5bd32-516a-47ce-a077-8acbf9aa8991.mp4';
const VIDEO_STAT =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_154543_d5b83fc1-9cea-44f3-b5e8-8f325935211a.mp4';
const VIDEO_TOOLS =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_153148_d7a3e1dd-e5d0-4ce6-8306-00d7522ecc44.mp4';

const MARQUEE_ROW_1: LucideIcon[] = [
  TrendingUp,
  Lightbulb,
  Languages,
  FileText,
  ImageIcon,
  Target,
  History,
  Sparkles,
];
const MARQUEE_ROW_2: LucideIcon[] = [
  History,
  Target,
  ImageIcon,
  FileText,
  Languages,
  Lightbulb,
  TrendingUp,
  Sparkles,
];

interface Props {
  onEnter: () => void;
}

function SectionLabel({
  children,
  align = 'center',
}: {
  children: string;
  align?: 'center' | 'start';
}) {
  return (
    <div
      className={`relative z-10 flex items-center gap-2 ${
        align === 'start' ? 'justify-start' : 'justify-center'
      }`}
    >
      <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} aria-hidden />
      <span className="text-[11px] uppercase tracking-[0.22em] text-white/70">{children}</span>
      <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} aria-hidden />
    </div>
  );
}

function BgVideo({ src }: { src: string }) {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover"
      src={src}
      aria-hidden
    />
  );
}

function MarqueeRow({ icons, direction }: { icons: LucideIcon[]; direction: 'left' | 'right' }) {
  const loop = [...icons, ...icons];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={`flex w-max gap-3 ${
          direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'
        }`}
      >
        {loop.map((Icon, index) => (
          <span
            key={index}
            className="liquid-glass flex h-14 w-14 shrink-0 items-center justify-center rounded-xl md:h-16 md:w-16"
          >
            <Icon className="h-5 w-5 text-white/85" strokeWidth={1.5} aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}

function parseTimeline(line: string) {
  const parts = line.split(' · ');
  return {
    period: parts[0] ?? '',
    role: parts[1] ?? '',
    org: parts[2] ?? '',
  };
}

/** Full-viewport dark bento grid — Flow features in a portfolio-style layout. */
export default function FeaturesGrid({ onEnter }: Props) {
  const { t } = useLocale();

  const timeline = [
    t.featuresTimeline1,
    t.featuresTimeline2,
    t.featuresTimeline3,
    t.featuresTimeline4,
  ].map(parseTimeline);

  return (
    <section
      id="features"
      className="scroll-mt-24 flex min-h-screen flex-col bg-[#0a0a0a] px-4 py-6 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-white antialiased sm:px-6 sm:py-8 md:px-10 md:py-10 lg:h-screen lg:min-h-0 lg:px-14"
    >
      <div className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="max-w-3xl">
          <h2 className="text-[28px] font-normal leading-[1.15] tracking-tight sm:text-3xl md:text-4xl lg:text-[44px]">
            {t.featuresTitle}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-[1.6] text-white/60 md:text-[15px]">
            {t.featuresIntro}
          </p>
        </div>
        <button
          type="button"
          onClick={onEnter}
          className="liquid-glass shrink-0 self-start rounded-full px-5 py-2.5 text-sm text-white transition-opacity hover:opacity-90 sm:px-6 sm:py-3 sm:text-[15px]"
        >
          {t.startStudying}
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {/* Column 1 — workflow / background */}
        <div className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-2xl bg-black p-5 md:min-h-[360px] lg:min-h-0">
          <BgVideo src={VIDEO_BACKGROUND} />
          <div className="absolute inset-0 bg-black/35" aria-hidden />
          <SectionLabel>{t.featuresWorkflowLabel}</SectionLabel>
          <div className="relative z-10 mt-auto space-y-3 pt-8">
            {timeline.map((row) => (
              <div
                key={row.period + row.role}
                className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-2 gap-y-1 text-[11px] sm:text-[12px]"
              >
                <span className="whitespace-nowrap text-white/55">{row.period}</span>
                <Sparkle className="h-3 w-3 text-white/60" strokeWidth={1.5} aria-hidden />
                <span className="min-w-0 truncate text-white/85">{row.role}</span>
                <span className="hidden truncate text-right text-white/50 sm:block">{row.org}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2 — voice + stat */}
        <div className="flex flex-col gap-4 md:grid md:grid-rows-[auto_1fr] md:gap-5">
          <div className="noise-overlay relative overflow-hidden rounded-2xl bg-[#324444] p-5 md:p-6">
            <SectionLabel align="start">{t.featuresVoiceLabel}</SectionLabel>
            <blockquote className="relative z-10 mt-5 text-[13px] leading-[1.6] text-white/85 sm:text-[13.5px]">
              &ldquo;{t.featureExplainDesc}&rdquo;
            </blockquote>
            <p className="relative z-10 mt-4 text-[12px] text-white/60">
              <span className="font-medium text-white/85">{t.featureExplainTitle}</span>
              {' — Flow'}
            </p>
          </div>

          <div className="relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-black p-5 md:min-h-0">
            <BgVideo src={VIDEO_STAT} />
            <div className="absolute inset-0 bg-black/40" aria-hidden />
            <p className="relative z-10 text-5xl font-light tracking-tight drop-shadow sm:text-6xl md:text-7xl lg:text-[88px]">
              50+
            </p>
            <p className="relative z-10 mt-2 text-center text-sm text-white/85">
              {t.featuresStatCaption}
            </p>
          </div>
        </div>

        {/* Column 3 — tools + CTA */}
        <div className="flex flex-col gap-4 md:col-span-2 md:grid md:grid-cols-2 md:gap-5 lg:col-span-1 lg:flex lg:flex-col">
          <div className="relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-2xl bg-black p-5 md:min-h-[280px] lg:min-h-0 lg:flex-1">
            <BgVideo src={VIDEO_TOOLS} />
            <div className="absolute inset-0 bg-black/45" aria-hidden />
            <SectionLabel>{t.featuresToolsLabel}</SectionLabel>
            <div className="relative z-10 mt-auto space-y-3 pt-6">
              <MarqueeRow icons={MARQUEE_ROW_1} direction="left" />
              <MarqueeRow icons={MARQUEE_ROW_2} direction="right" />
            </div>
          </div>

          <div className="noise-overlay relative rounded-2xl bg-[#324444] p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionLabel align="start">{t.featuresReachLabel}</SectionLabel>
                <ul className="relative z-10 mt-5 space-y-2 text-[13px] leading-relaxed text-white/85 sm:text-[14px]">
                  <li>{t.featureProgressiveTitle}</li>
                  <li>{t.featureLanguageTitle}</li>
                  <li>{t.featureReviewTitle}</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={onEnter}
                title={t.startStudying}
                className="liquid-glass relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
              >
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
