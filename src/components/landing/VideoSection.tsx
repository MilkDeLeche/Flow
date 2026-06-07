import { useEffect, useRef, useState } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

const TYPED = 'Turn chapter 7 of my biology notes into a 20-question quiz';
const DEMO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4';

/**
 * Demo section. The requested video sits behind the liquid-glass card that
 * types out a study prompt. Reveals on scroll; honors prefers-reduced-motion.
 */
export default function VideoSection() {
  const root = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState('');
  const [started, setStarted] = useState(false);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Card reveal + start the typewriter when the panel scrolls into view.
      const card = root.current?.querySelector('[data-glass]');
      if (card) {
        if (reduce) {
          gsap.set(card, { opacity: 1, y: 0 });
          setStarted(true);
        } else {
          gsap.from(card, {
            opacity: 0,
            y: 18,
            duration: 0.8,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: root.current,
              start: 'top 75%',
              once: true,
              onEnter: () => setStarted(true),
            },
          });
        }
      }
    },
    { scope: root }
  );

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(TYPED.slice(0, i));
      if (i >= TYPED.length) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [started]);

  // Recompute scroll positions once the section has mounted (fonts/layout).
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    <section
      id="demo"
      ref={root}
      className="scroll-mt-24 border-t border-[#e8e8e8] px-5 py-12 lg:px-10 lg:py-20"
    >
      <div className="relative mx-auto flex aspect-[16/10] max-w-[980px] items-center justify-center overflow-hidden rounded-3xl bg-[#eef1ed] md:aspect-video">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          src={DEMO_VIDEO}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-[#fefffc]/10 to-black/15" />

        {/* glass prompt card */}
        <div
          data-glass
          className="relative z-10 w-full max-w-[520px] rounded-2xl p-4"
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            backgroundImage:
              'linear-gradient(in oklab, rgba(255, 255, 255, 0.55) 0px, rgba(255, 255, 255, 0.25) 100%)',
            border: '6px solid rgba(255, 255, 255, 0.35)',
            boxShadow:
              '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          }}
        >
          <p className="min-h-[48px] text-[16px] leading-relaxed text-[#2c2c2c]">
            {typed}
            <span className="animate-pulse">|</span>
          </p>
          <div className="mt-3 flex items-center justify-between">
            <Paperclip size={18} className="text-[#646464]" />
            <button
              type="button"
              aria-label="Send"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-[#2c2c2c]"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
