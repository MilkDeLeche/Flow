import { ReactNode, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface TextFadeProps {
  children: ReactNode;
  direction?: 'up' | 'down';
  className?: string;
  staggerChildren?: number;
}

/**
 * TextFade
 * GSAP scroll-triggered reveal. Each direct child fades + slides into place
 * when the wrapper scrolls into view, staggered. Honors prefers-reduced-motion.
 */
export default function TextFade({
  children,
  direction = 'up',
  className,
  staggerChildren = 0.15,
}: TextFadeProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      const items = gsap.utils.toArray<HTMLElement>('[data-fade-item]');
      if (!items.length) return;

      if (reduce) {
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }

      gsap.from(items, {
        opacity: 0,
        y: direction === 'down' ? -18 : 18,
        duration: 0.8,
        ease: 'power3.out',
        stagger: staggerChildren,
        scrollTrigger: {
          trigger: container.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    },
    { scope: container, dependencies: [direction, staggerChildren] }
  );

  const wrap = (child: ReactNode, key?: number) => (
    <div data-fade-item key={key}>
      {child}
    </div>
  );

  return (
    <div ref={container} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => wrap(child, i))
        : wrap(children)}
    </div>
  );
}
