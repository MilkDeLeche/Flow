// Preset card backgrounds for courses. No external images — gradients only, so
// they're instant and work under the strict Content-Security-Policy.
export interface Theme {
  key: string;
  label: string;
  from: string;
  to: string;
}

export const THEMES: Theme[] = [
  { key: 'sage', label: 'Sage', from: '#5b6e57', to: '#39492f' },
  { key: 'clay', label: 'Clay', from: '#8a5a44', to: '#5e342a' },
  { key: 'slate', label: 'Slate', from: '#46566b', to: '#2b3340' },
  { key: 'plum', label: 'Plum', from: '#6b4a63', to: '#3f2b3a' },
  { key: 'ocean', label: 'Ocean', from: '#2f4858', to: '#1b2a33' },
  { key: 'sand', label: 'Sand', from: '#b9a888', to: '#6f6047' },
];

export const DEFAULT_THEME = THEMES[0].key;

export function themeFor(key: string): Theme {
  return THEMES.find((t) => t.key === key) ?? THEMES[0];
}

export function themeGradient(key: string): string {
  const t = themeFor(key);
  return `linear-gradient(135deg, ${t.from}, ${t.to})`;
}
