import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Card {
  category: string;
  text: string;
  image: string;
}

const CARDS: Card[] = [
  {
    category: 'For Everyone',
    text: 'Unleash your creative vision',
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_081328_19f48c5b-ea4d-4f23-8f80-7374f31015d4.png&w=1280&q=85',
  },
  {
    category: 'For Teams',
    text: 'Smart helper supporting each teammate daily',
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_081342_ad378347-1ebd-4b17-a716-ee895bf739c0.png&w=1280&q=85',
  },
  {
    category: 'For Enterprises',
    text: 'Elevate your whole organization using business AI',
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_081415_a6e8a76c-224e-417b-bf99-6b86d6494644.png&w=1280&q=85',
  },
  {
    category: 'Platform',
    text: 'Enhanced with FlowMate',
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_081513_cf1cd2c1-2122-4de6-90ed-acae8bfbdb00.png&w=1280&q=85',
  },
  {
    category: 'Security',
    text: 'Creating trusted and helpful AI',
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_081541_9d2d28bf-d6a3-4b31-b0bb-cfc5202d4fcd.png&w=1280&q=85',
  },
];

/**
 * Auto-rotating carousel (4s) showing 3 cards on desktop, 1 on mobile, with
 * manual prev/next. Slides via a transformed track with custom easing.
 */
export default function CardsCarousel() {
  const [perView, setPerView] = useState(3);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const calc = () => setPerView(window.innerWidth < 1024 ? 1 : 3);
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const maxIndex = Math.max(0, CARDS.length - perView);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 4000);
    return () => clearInterval(id);
  }, [maxIndex]);

  const prev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  const next = () => setIndex((i) => (i >= maxIndex ? 0 : i + 1));

  return (
    <section
      id="cards"
      className="scroll-mt-24 border-t border-[#e8e8e8] px-5 py-12 lg:px-10 lg:py-20"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-mondwest text-[28px] leading-tight md:text-[40px] lg:text-[44px]">
          Built for everyone
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous"
            onClick={prev}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#dde3dd] bg-white transition-colors hover:bg-[#eef1ed]"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={next}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#dde3dd] bg-white transition-colors hover:bg-[#eef1ed]"
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
          {CARDS.map((c) => (
            <div
              key={c.text}
              className="shrink-0 px-2"
              style={{ flexBasis: `${100 / perView}%` }}
            >
              <div className="group relative h-[500px] overflow-hidden rounded-2xl">
                <img
                  src={c.image}
                  alt={c.text}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <span className="text-[12px] uppercase tracking-wide text-white/70">
                    {c.category}
                  </span>
                  <h3 className="mt-1 max-w-[260px] font-mondwest text-[26px] leading-tight">
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
