import { useAuth } from '@/context/AuthContext';
import { Gamepad2, Users, MessageSquare, LogOut, UserCircle } from 'lucide-react';
import type { Page } from '@/App';

export default function Navbar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const { profile, signOut } = useAuth();

  const navItems: { id: Page; label: string; icon: typeof Gamepad2 }[] = [
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'community', label: 'Community', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <button onClick={() => setPage('games')} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight hidden sm:block">Gunra</span>
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setPage('profile')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-emerald-400 border border-slate-600 group-hover:border-emerald-500 transition-colors overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile?.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <span className="text-sm text-slate-300 hidden md:block max-w-[100px] truncate group-hover:text-white transition-colors">
              {profile?.username || 'User'}
            </span>
          </button>
          <button
            onClick={signOut}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
