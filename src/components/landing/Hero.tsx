import TextFade from '../TextFade';
import { useLocale } from '../../lib/i18n';

interface Props {
  onEnter: () => void;
}

/**
 * Hero - oversized PPMondwest headline describing the app.
 * Reveals with the shared TextFade.
 */
export default function Hero({ onEnter }: Props) {
  const { t } = useLocale();
  return (
    <section
      id="home"
      className="scroll-mt-24 px-5 pb-12 pt-28 lg:px-10 lg:pb-20 lg:pt-32"
    >
      <TextFade direction="up" staggerChildren={0.15}>
        <h1 className="max-w-[900px] font-mondwest text-[32px] leading-[0.95] text-ink md:text-[50px] lg:max-w-[760px] lg:text-[70px]">
          {t.heroTitle}
        </h1>
        <p className="mt-6 max-w-[620px] text-[17px] leading-relaxed text-ink-secondary lg:max-w-[540px] lg:text-[18px]">
          {t.heroBody}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button onClick={onEnter} className="btn-primary gap-2 px-5 py-3 text-[15px]">
            {t.startStudying}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <a href="#demo" className="btn-outline gap-2 px-5 py-3 text-[15px]">
            {t.seeHow}
          </a>
        </div>
      </TextFade>
    </section>
  );
}
