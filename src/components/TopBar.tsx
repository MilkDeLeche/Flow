import { useEffect, useState } from 'react';
import { useLocale } from '../lib/i18n';

type View = 'home' | 'history' | 'review' | 'dashboard' | 'settings';

interface TopBarProps {
  view: View;
  onNavigate: (view: View) => void;
  userName: string;
  authed: boolean;
  missedCount: number;
  onChangeUser: (name: string) => void;
}

export default function TopBar({
  view,
  onNavigate,
  userName,
  authed,
  missedCount,
  onChangeUser,
}: TopBarProps) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(userName);

  useEffect(() => setDraft(userName), [userName]);

  const commit = () => {
    onChangeUser(draft.trim() || 'Student');
    setEditing(false);
  };

  const navBtn = (v: View, label: string, badge?: number) => (
    <button
      onClick={() => onNavigate(v)}
      className={`relative px-4 py-2 text-[14px] rounded-full transition-colors ${
        view === v
          ? 'bg-[#eef1ed] text-[#2c2c2c]'
          : 'text-[#646464] hover:bg-[#eef1ed]'
      }`}
    >
      {label}
      {badge ? (
        <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] rounded-full bg-black text-white align-middle">
          {badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <header className="sticky top-0 z-30 bg-[#fefffc]/90 backdrop-blur-sm border-b border-[#e8e8e8]">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between px-5 md:px-8 h-16 md:h-[72px]">
        <button
          onClick={() => onNavigate('home')}
          className="font-mondwest text-[28px] md:text-[32px] leading-none text-[#2c2c2c] shrink-0"
        >
          Flow
        </button>

        <nav className="flex items-center gap-1.5 md:gap-2">
          {navBtn('home', t.study)}
          {navBtn('review', t.review, missedCount)}
          {navBtn('history', t.history)}

          {authed ? (
            <>
              {navBtn('dashboard', t.dashboard)}
              {navBtn('settings', t.settings)}
            </>
          ) : editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && commit()}
              className="w-28 px-3 py-2 text-[14px] bg-white border-2 border-[#dde3dd] rounded-full outline-none focus:border-[#b8beb8]"
              placeholder={t.yourName}
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              title={t.changeStudent}
              className="px-4 py-2 text-[14px] bg-black text-white rounded-full hover:bg-[#2c2c2c] transition-colors"
            >
              {userName}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
