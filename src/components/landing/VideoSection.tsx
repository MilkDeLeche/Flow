import { useEffect, useRef, useState } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_073438_071156e5-2a7a-45d8-a8d9-c628d2144e88.mp4';
const TYPED = 'Daily check rival companies and ping me on messenger';

/**
 * Video section with a liquid-glass overlay card. The card springs in on scroll
 * (GSAP), then a typewriter types out the prompt at 50ms/char.
 */
export default function VideoSection() {
  const root = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState('');
  const [started, setStarted] = useState(false);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      const card = root.current?.querySelector('[data-glass]');
      if (!card) return;
      if (reduce) {
        gsap.set(card, { opacity: 1, y: 0 });
        setStarted(true);
        return;
      }
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

  return (
    <section
      id="video"
      ref={root}
      className="scroll-mt-24 border-t border-[#e8e8e8] px-5 py-12 lg:px-10 lg:py-20"
    >
      <div className="relative mx-auto max-w-[980px] overflow-hidden rounded-3xl">
        <video
          src={VIDEO}
          autoPlay
          loop
          muted
          playsInline
          className="aspect-video h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <div
            data-glass
            className="w-full max-w-[520px] rounded-2xl p-4"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              backgroundImage:
                'linear-gradient(in oklab, rgba(255, 255, 255, 0.35) 0px, rgba(255, 255, 255, 0.12) 100%)',
              border: '6px solid rgba(255, 255, 255, 0.2)',
              boxShadow:
                '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
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
      </div>
    </section>
  );
}
