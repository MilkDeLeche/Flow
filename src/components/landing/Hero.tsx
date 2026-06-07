import TextFade from '../TextFade';

/**
 * Hero — oversized PPMondwest headline, supporting copy, and a CTA that scrolls
 * to the intro video. Reveals on mount with the shared TextFade (up, staggered).
 */
export default function Hero() {
  return (
    <section
      id="home"
      className="scroll-mt-24 px-5 pb-12 pt-28 lg:px-10 lg:pb-20 lg:pt-32"
    >
      <TextFade direction="up" staggerChildren={0.15}>
        <h1 className="max-w-[900px] font-mondwest text-[32px] leading-[0.95] md:text-[50px] lg:max-w-[700px] lg:text-[70px]">
          Transform your workflow using plain English
        </h1>
        <p className="mt-6 max-w-[620px] text-[17px] text-[#444141] lg:max-w-[520px] lg:text-[18px]">
          FlowMate connects to your current apps, builds smart workflows, and
          manages operations. Powering the platforms you already know and trust.
        </p>
        <div className="mt-8">
          <a
            href="#video"
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-[15px] text-white transition-colors hover:bg-[#2c2c2c]"
          >
            View our intro video
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
          </a>
        </div>
      </TextFade>
    </section>
  );
}
