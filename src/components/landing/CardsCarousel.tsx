import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import BackgroundVideo from '../BackgroundVideo';
import { useLocale } from '../../lib/i18n';

/**
 * Auto-rotating carousel (4s) showing 3 cards on desktop, 1 on mobile, with
 * manual prev/next. Slides via a transformed track with custom easing.
 */
export default function CardsCarousel() {
  const { t } = useLocale();
  const root = useRef<HTMLElement>(null);
  const [perView, setPerView] = useState(3);
  const [index, setIndex] = useState(0);

  const cards = [
    {
      category: t.carouselStudents,
      text: t.carouselStudentsDesc,
      from: '#5b6e57',
      to: '#39492f',
      video:
        'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260422_191657_800d4e1f-7ab3-41af-90b6-9bd3039eb294.mp4',
    },
    {
      category: t.carouselExam,
      text: t.carouselExamDesc,
      from: '#8a5a44',
      to: '#5e342a',
      video:
        'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4',
    },
    {
      category: t.carouselSubjects,
      text: t.carouselSubjectsDesc,
      from: '#46566b',
      to: '#2b3340',
      video:
        'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4',
    },
    {
      category: t.carouselLanguage,
      text: t.carouselLanguageDesc,
      from: '#6b4a63',
      to: '#3f2b3a',
      video:
        'https://stream.mux.com/blULaJm2RMbAmsrwxLrBdgEx9yI1do2yM89vHTkdA6I.m3u8',
    },
    {
      category: t.carouselPrivate,
      text: t.carouselPrivateDesc,
      from: '#2f4858',
      to: '#1b2a33',
      video:
        'https://stream.mux.com/01RFgQzREU151pcAPmtrmfOaaPleIUBpff02V34zduXXM.m3u8',
    },
  ];

  useEffect(() => {
    const calc = () => setPerView(window.innerWidth < 1024 ? 1 : 3);
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const maxIndex = Math.max(0, cards.length - perView);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 4000);
    return () => clearInterval(id);
  }, [maxIndex]);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      gsap.from('.carousel-head', {
        opacity: 0,
        y: 18,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 80%', once: true },
      });
    },
    { scope: root }
  );

  const prev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  const next = () => setIndex((i) => (i >= maxIndex ? 0 : i + 1));

  return (
    <section
      id="cards"
      ref={root}
      className="scroll-mt-24 border-t border-line px-5 py-12 lg:px-10 lg:py-20"
    >
      <div className="carousel-head mb-6 flex items-center justify-between">
        <h2 className="max-w-[620px] font-mondwest text-[28px] leading-tight text-ink md:text-[40px] lg:text-[44px]">
          {t.carouselTitle}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous"
            onClick={prev}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-surface-card transition-colors hover:bg-surface-muted"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={next}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-surface-card transition-colors hover:bg-surface-muted"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * (100 / perView)}%)`,
            transitionProperty: 'transform',
            transitionDuration: '700ms',
            transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          {cards.map((c) => (
            <div
              key={c.text}
              className="shrink-0 px-2"
              style={{ flexBasis: `${100 / perView}%` }}
            >
              <div
                className="group relative h-[420px] overflow-hidden rounded-2xl md:h-[460px]"
                style={
                  c.video
                    ? undefined
                    : { backgroundImage: `linear-gradient(135deg, ${c.from}, ${c.to})` }
                }
              >
                {c.video ? (
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                    <BackgroundVideo
                      src={c.video}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10 transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <span className="text-[12px] uppercase tracking-wide text-white/70">
                    {c.category}
                  </span>
                  <h3 className="mt-1 max-w-[280px] font-mondwest text-[26px] leading-tight">
                    {c.text}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
