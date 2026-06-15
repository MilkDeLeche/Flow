import { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  History,
  LayoutDashboard,
  Settings,
  Target,
} from 'lucide-react';
import { useLocale } from '../lib/i18n';
import type { UserProfile } from '../lib/userProfile';
import UserAvatar from './UserAvatar';

type View = 'home' | 'history' | 'review' | 'dashboard' | 'settings';

interface TopBarProps {
  view: View;
  onNavigate: (view: View) => void;
  userName: string;
  userProfile?: UserProfile;
  authed: boolean;
  missedCount: number;
  onChangeUser: (name: string) => void;
}

export default function TopBar({
  view,
  onNavigate,
  userName,
  userProfile,
  authed,
  missedCount,
  onChangeUser,
}: TopBarProps) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(userName);
  const displayName = authed ? userProfile?.displayName ?? userName : userName;

  useEffect(() => setDraft(userName), [userName]);

  const commit = () => {
    onChangeUser(draft.trim() || 'Student');
    setEditing(false);
  };

  const primaryNav: Array<{
    view: View;
    label: string;
    icon: typeof BookOpen;
    badge?: number;
  }> = [
    { view: 'home', label: t.study, icon: BookOpen },
    { view: 'dashboard', label: t.dashboard, icon: BarChart3 },
    { view: 'review', label: t.review, icon: Target, badge: missedCount },
    { view: 'history', label: t.history, icon: History },
  ];

  const navBtn = (
    v: View,
    label: string,
    Icon: typeof BookOpen,
    badge?: number
  ) => (
    <button
      onClick={() => onNavigate(v)}
      className={`relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] transition-colors ${
        view === v
          ? 'bg-surface-muted text-ink'
          : 'text-ink-secondary hover:bg-surface-muted/70 hover:text-ink'
      }`}
    >
      <Icon size={17} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-accent px-1 text-[11px] text-accent-ink">
          {badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[248px] flex-col border-r border-line bg-surface-muted px-4 py-5 md:flex">
        <button
          onClick={() => onNavigate('home')}
          className="mb-7 px-2 text-left"
        >
          <span className="block font-mondwest text-[26px] leading-none text-ink">
            Flow
          </span>
          <span className="block text-[11px] text-ink-muted">{t.courseWorkspace}</span>
        </button>

        <nav className="flex flex-col gap-1">
          {primaryNav.map((item) => navBtn(item.view, item.label, item.icon, item.badge))}
        </nav>

        <div className="mt-auto rounded-xl border border-line bg-surface-card p-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-ink-muted">
            {authed ? t.account : t.yourName}
          </p>
          {authed ? (
            <button
              onClick={() => onNavigate('settings')}
              className="flex w-full items-center gap-2.5 rounded-lg bg-surface-muted px-2 py-2 text-left transition-colors hover:bg-surface-muted/80"
            >
              <UserAvatar
                name={displayName}
                src={userProfile?.avatarUrl}
                size="md"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">
                  {displayName}
                </span>
                {userProfile?.email && (
                  <span className="block truncate text-[11px] text-ink-muted">
                    {userProfile.email}
                  </span>
                )}
              </span>
            </button>
          ) : !editing ? (
            <button
              onClick={() => setEditing(true)}
              title={t.changeStudent}
              className="w-full truncate rounded-lg bg-surface-muted px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface-muted/80"
            >
              {userName}
            </button>
          ) : (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && commit()}
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-[13px] outline-none focus:border-line-strong"
              placeholder={t.yourName}
            />
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-surface/92 backdrop-blur-sm md:ml-[248px]">
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <button
              onClick={() => onNavigate('home')}
              className="font-mondwest text-[28px] leading-none text-ink"
            >
              Flow
            </button>
          </div>

          <nav className="hidden min-w-0 items-center gap-1 md:flex">
            <span className="inline-flex items-center gap-2 text-[13px] text-ink-secondary">
              <LayoutDashboard size={15} />
              {view === 'home'
                ? t.yourCourses
                : primaryNav.find((n) => n.view === view)?.label ?? t.settings}
            </span>
          </nav>

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:hidden">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] ${
                    view === item.view
                      ? 'bg-accent text-accent-ink'
                      : 'bg-surface-muted text-ink-secondary'
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                  {item.badge ? (
                    <span className="ml-0.5 rounded-full bg-white/18 px-1 text-[10px]">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => onNavigate('settings')}
            title={t.settings}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-[13px] transition-colors ${
              view === 'settings'
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-line bg-surface-card text-ink-secondary hover:bg-surface-muted hover:text-ink'
            }`}
          >
            {authed && userProfile ? (
              <UserAvatar name={displayName} src={userProfile.avatarUrl} size="sm" />
            ) : (
              <Settings size={16} />
            )}
            <span className="hidden sm:inline">{t.settings}</span>
          </button>
        </div>
      </header>
    </>
  );
}
