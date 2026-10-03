import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

type Props = { gameId: string; onSubmitScore: (gameId: string, score: number) => void };

export default function NumberGuess({ gameId, onSubmitScore }: Props) {
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<'higher' | 'lower' | 'correct' | null>(null);
  const [history, setHistory] = useState<{ val: number; dir: string }[]>([]);
  const [done, setDone] = useState(false);

  const reset = useCallback(() => {
    setTarget(Math.floor(Math.random() * 100) + 1);
    setGuess('');
    setAttempts(0);
    setHint(null);
    setHistory([]);
    setDone(false);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseInt(guess, 10);
    if (isNaN(val) || val < 1 || val > 100) return;
    const att = attempts + 1;
    setAttempts(att);
    if (val === target) {
      setHint('correct');
      setDone(true);
      const score = Math.max(50, 1000 - (att - 1) * 80);
      onSubmitScore(gameId, score);
    } else {
      const dir = val < target ? 'higher' : 'lower';
      setHint(dir);
      setHistory((h) => [{ val, dir }, ...h]);
    }
    setGuess('');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-400">
          Attempts: <span className="text-white font-semibold">{attempts}</span>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {done ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-emerald-400 font-semibold">You got it in {attempts} attempts!</p>
          <p className="text-sm text-slate-400 mt-1">The number was {target}.</p>
        </div>
      ) : (
        <>
          {hint && hint !== 'correct' && (
            <div className="mb-4 text-center text-sm font-medium text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded-lg py-2">
              Aim {hint}! Your last guess was too {hint === 'higher' ? 'low' : 'high'}.
            </div>
          )}
          <form onSubmit={submit} className="flex gap-2 mb-4">
            <input
              type="number"
              min={1}
              max={100}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="1–100"
              className="flex-1 px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-center text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            <button type="submit" className="px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-400 transition-colors">
              Guess
            </button>
          </form>
          <p className="text-xs text-slate-500 text-center">I'm thinking of a number between 1 and 100.</p>
        </>
      )}

      {history.length > 0 && (
        <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between text-sm px-3 py-1.5 bg-slate-900/30 rounded-lg">
              <span className="text-slate-300">Guessed {h.val}</span>
              <span className="text-amber-400 text-xs">↑ {h.dir}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
