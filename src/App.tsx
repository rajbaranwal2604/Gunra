import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Loader2, Gamepad2 } from 'lucide-react';
import AuthPage from '@/pages/AuthPage';
import Navbar from '@/components/Navbar';
import GamesPage from '@/pages/GamesPage';
import ProfilePage from '@/pages/ProfilePage';
import CommunityPage from '@/pages/CommunityPage';

export type Page = 'games' | 'profile' | 'community';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('games');
  const [profileViewId, setProfileViewId] = useState<string | undefined>(undefined);

  // Handle hash-based profile navigation
  useEffect(() => {
    function onHash() {
      const h = window.location.hash;
      if (h.startsWith('#profile:')) {
        setProfileViewId(h.slice('#profile:'.length));
        setPage('profile');
      }
    }
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center animate-pulse">
          <Gamepad2 className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar page={page} setPage={(p) => { setProfileViewId(undefined); setPage(p); }} />
      <main>
        {page === 'games' && <GamesPage />}
        {page === 'profile' && <ProfilePage viewUserId={profileViewId} />}
        {page === 'community' && <CommunityPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

