import { useEffect, useState, useCallback } from 'react';
import { supabase, type Game, type GameScore } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Trophy, ArrowLeft, Play, Loader2, RefreshCw, BarChart3 } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import MemoryMatch from '@/games/MemoryMatch';
import ReactionTest from '@/games/ReactionTest';
import NumberGuess from '@/games/NumberGuess';
import TicTacToe from '@/games/TicTacToe';
import Snake from '@/games/Snake';
import ColorCode from '@/games/ColorCode';

export default function GamesPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Game | null>(null);
  const [leaderboard, setLeaderboard] = useState<GameScore[]>([]);
  const [myBest, setMyBest] = useState<number | null>(null);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('games').select('*').order('title');
      setGames((data as Game[]) || []);
      setLoading(false);
    })();
  }, []);

  const loadLeaderboard = useCallback(async (gameId: string) => {
    setLbLoading(true);
    const { data } = await supabase
      .from('game_scores')
      .select('id, game_id, user_id, score, created_at, profiles:profiles(username, avatar_url, full_name)')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(10);
    setLeaderboard((data as unknown as GameScore[]) || []);
    setLbLoading(false);
  }, []);

  const loadMyBest = useCallback(async (gameId: string, userId: string) => {
    const { data } = await supabase
      .from('game_scores')
      .select('score')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();
    setMyBest(data?.score ?? null);
  }, []);

  useEffect(() => {
    if (selected && user) {
      loadLeaderboard(selected.id);
      loadMyBest(selected.id, user.id);
    }
  }, [selected, user, loadLeaderboard, loadMyBest]);

  async function submitScore(gameId: string, score: number) {
    if (!user) return;
    const { error } = await supabase.from('game_scores').insert({ game_id: gameId, user_id: user.id, score });
    if (error) {
      console.error('Failed to submit score:', error.message);
      return;
    }
    await loadLeaderboard(gameId);
    await loadMyBest(gameId, user.id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to games
        </button>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Game area */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{selected.description}</p>
              </div>
              {myBest !== null && (
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Your best</div>
                  <div className="text-2xl font-bold text-emerald-400">{myBest}</div>
                </div>
              )}
            </div>
            <GameRenderer slug={selected.slug} gameId={selected.id} onSubmitScore={submitScore} />
          </div>

          {/* Leaderboard */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">Leaderboard</h3>
            </div>
            {lbLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-slate-500 animate-spin" /></div>
            ) : leaderboard.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No scores yet. Be the first!</p>
            ) : (
              <div className="space-y-1.5">
                {leaderboard.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      entry.user_id === user?.id ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-900/30'
                    }`}
                  >
                    <span className={`w-6 text-center text-sm font-bold ${
                      i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{entry.profiles?.username || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{timeAgo(entry.created_at)}</div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game grid
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Games</h1>
        <p className="text-sm text-slate-400 mt-1">Play single-player games, climb the leaderboard, track your stats.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelected(game)}
            className="group relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 text-left hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center mb-3">
                <GameIcon name={game.icon_name} />
              </div>
              <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{game.title}</h3>
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{game.description}</p>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-400 font-medium">
                <Play className="w-3.5 h-3.5" /> Play now
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function GameIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    Brain: <span className="text-emerald-400 text-lg">🧠</span>,
    Zap: <span className="text-amber-400 text-lg">⚡</span>,
    Hash: <span className="text-sky-400 text-lg">#</span>,
    Grid3x3: <span className="text-violet-400 text-lg">⊞</span>,
    Worm: <span className="text-lime-400 text-lg">🐍</span>,
    Palette: <span className="text-pink-400 text-lg">🎨</span>,
    Gamepad2: <span className="text-emerald-400 text-lg">🎮</span>,
  };
  return <>{icons[name] || icons.Gamepad2}</>;
}

function GameRenderer({
  slug,
  gameId,
  onSubmitScore,
}: {
  slug: string;
  gameId: string;
  onSubmitScore: (gameId: string, score: number) => void;
}) {
  const props = { gameId, onSubmitScore };
  switch (slug) {
    case 'memory-match':
      return <MemoryMatch {...props} />;
    case 'reaction-test':
      return <ReactionTest {...props} />;
    case 'number-guess':
      return <NumberGuess {...props} />;
    case 'tic-tac-toe':
      return <TicTacToe {...props} />;
    case 'snake':
      return <Snake {...props} />;
    case 'color-code':
      return <ColorCode {...props} />;
    default:
      return <p className="text-slate-500 text-center py-10">Game coming soon.</p>;
  }
}
