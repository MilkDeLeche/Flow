import { useEffect, useState } from 'react';

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'demo', label: 'Demo' },
  { id: 'features', label: 'Features' },
  { id: 'cards', label: 'Who it’s for' },
];

/**
 * Desktop-only left rail (240px). Tracks the section in view with an
 * IntersectionObserver and highlights the matching nav item.
 */
export default function Sidebar() {
  const [active, setActive] = useState('home');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-30 h-screen w-[240px] flex-col border-r-2 border-[#dde3dd] bg-[#fefffc] px-5 py-6">
      <a href="#home" className="mb-8 font-mondwest text-[24px] leading-none">
        Flow
      </a>
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            className={`rounded-lg px-3 py-2 text-[15px] transition-colors ${
              active === n.id
                ? 'bg-[#eef1ed] text-[#2c2c2c]'
                : 'text-[#b4b8b4] hover:bg-[#eef1ed]/60 hover:text-[#646464]'
            }`}
          >
            {n.label}
          </a>
        ))}
      </nav>

      <p className="mt-auto text-[12px] leading-relaxed text-[#b4b8b4]">
        Upload a chapter → get a quiz that explains every wrong answer.
      </p>
    </aside>
  );
}
