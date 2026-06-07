import TextFade from '../TextFade';

interface Props {
  onEnter: () => void;
}

/**
 * Hero — oversized PPMondwest headline describing the app (turn any material
 * into a progressive practice quiz). Reveals with the shared TextFade.
 */
export default function Hero({ onEnter }: Props) {
  return (
    <section
      id="home"
      className="scroll-mt-24 px-5 pb-12 pt-28 lg:px-10 lg:pb-20 lg:pt-32"
    >
      <TextFade direction="up" staggerChildren={0.15}>
        <h1 className="max-w-[900px] font-mondwest text-[32px] leading-[0.95] md:text-[50px] lg:max-w-[760px] lg:text-[70px]">
          Turn any chapter into a quiz that teaches you
        </h1>
        <p className="mt-6 max-w-[620px] text-[17px] text-[#444141] lg:max-w-[540px] lg:text-[18px]">
          Paste a chapter, drop a PDF, or upload your slides — Flow·quiz writes
          progressive practice rounds (10 → 20 → 30 → 40 → 50 questions) and
          explains <em>why</em> every wrong answer is wrong, in the language of
          your material.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={onEnter}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-[15px] text-white transition-colors hover:bg-[#2c2c2c]"
          >
            Start studying
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
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#dde3dd] bg-white px-5 py-3 text-[15px] transition-colors hover:bg-[#eef1ed]"
          >
            See how it works
          </a>
        </div>
      </TextFade>
    </section>
  );
}
