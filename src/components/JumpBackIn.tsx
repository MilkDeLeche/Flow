import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import TextFade from './TextFade';
import { listRecentMaterials, type RecentMaterial } from '../lib/store';

interface JumpBackInProps {
  onResume: (material: RecentMaterial) => void;
  refreshKey?: number;
}

// Pick a subject glyph + gradient from the title so each card feels distinct,
// without needing an external image service.
const GRADIENTS = [
  ['#1f6feb', '#0b3d91'],
  ['#16a34a', '#065f46'],
  ['#ea580c', '#7c2d12'],
  ['#7c3aed', '#3730a3'],
  ['#db2777', '#831843'],
  ['#0891b2', '#155e75'],
  ['#ca8a04', '#713f12'],
];

const SUBJECT_GLYPHS: [RegExp, string][] = [
  [/\b(bio|evolu|cell|gene|species|organism|biolog)/i, '🧬'],
  [/\b(econ|econom|market|inflation|gdp|diapositiv)/i, '📈'],
  [/\b(geometr|trig|trigon)/i, '📐'],
  [/\b(math|calc|algebra|equation|function)/i, '➗'],
  [/\b(chem|molecul|reaction|atom)/i, '⚗️'],
  [/\b(physic|force|energy|quantum)/i, '🔭'],
  [/\b(civ|civiliz|ancient|empire|dynasty)/i, '🏛️'],
  [/\b(hist|histor|war|revolution|century)/i, '📜'],
  [/\b(law|legal|constitut|court)/i, '⚖️'],
  [/\b(psych|brain|behavior|cognit)/i, '🧠'],
  [/\b(geo|map|climate|earth)/i, '🌍'],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function artFor(title: string) {
  const [a, b] = GRADIENTS[hash(title) % GRADIENTS.length];
  const glyph =
    SUBJECT_GLYPHS.find(([re]) => re.test(title))?.[1] ?? '📚';
  return { gradient: `linear-gradient(135deg, ${a}, ${b})`, glyph };
}

export default function JumpBackIn({ onResume, refreshKey }: JumpBackInProps) {
  const [materials, setMaterials] = useState<RecentMaterial[]>([]);

  useEffect(() => {
    let active = true;
    listRecentMaterials(12).then((m) => active && setMaterials(m));
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (!materials.length) return null;

  return (
    <section className="max-w-[760px] mx-auto px-5 md:px-8 pt-8">
      <TextFade direction="up">
        <h2 className="font-mondwest text-[#2c2c2c] text-[22px] md:text-[26px] mb-4">
          Jump back in
        </h2>
      </TextFade>

      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
        {materials.map((m) => {
          const { gradient, glyph } = artFor(m.title);
          return (
            <button
              key={m.id}
              onClick={() => onResume(m)}
              className="group relative shrink-0 w-[200px] h-[150px] rounded-2xl overflow-hidden border-2 border-[#dee2de] text-left snap-start"
            >
              <div className="absolute inset-0" style={{ background: gradient }} />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              <span className="absolute top-3 left-3 text-[28px] drop-shadow">
                {glyph}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-[14px] font-medium leading-snug line-clamp-2">
                  {m.title}
                </p>
                <p className="text-white/80 text-[11px] mt-0.5 flex items-center gap-1">
                  {m.lastScore
                    ? `Last: ${m.lastScore.score}/${m.lastScore.total}`
                    : 'Tap to study'}
                  <ArrowRight
                    size={12}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
