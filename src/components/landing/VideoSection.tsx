import { useEffect, useRef, useState } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

const TYPED = 'Turn chapter 7 of my biology notes into a 20-question quiz';

/**
 * Demo section. An on-brand animated gradient panel (GSAP-floated blobs) with a
 * liquid-glass card that types out a study prompt — mirroring what you'd ask the
 * app to do. Reveals on scroll; honors prefers-reduced-motion.
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

      // Slowly drifting gradient blobs (skipped when reduced motion is on).
      if (!reduce) {
        gsap.to('[data-blob="1"]', {
          x: 40,
          y: -30,
          duration: 9,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
        gsap.to('[data-blob="2"]', {
          x: -50,
          y: 30,
          duration: 11,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
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
        {/* gradient backdrop */}
        <div
          data-blob="1"
          className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-[#cdd8cc] blur-3xl"
        />
        <div
          data-blob="2"
          className="pointer-events-none absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-[#d8cfc0] blur-3xl"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />

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
