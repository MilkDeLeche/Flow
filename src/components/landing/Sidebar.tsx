import { useEffect, useState } from 'react';

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'video', label: 'Video' },
  { id: 'features', label: 'Features' },
  { id: 'cards', label: 'Cards' },
];

const LOGO =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_072635_e0ca60b6-0b6c-49a3-825d-b2b6a53dd63d.png&w=1280&q=85';

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
      <img
        src={LOGO}
        alt="FlowMate"
        className="mb-8 h-10 w-10 rounded-xl object-cover"
      />
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
    </aside>
  );
}
