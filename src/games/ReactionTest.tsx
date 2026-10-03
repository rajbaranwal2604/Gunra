import { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Zap } from 'lucide-react';

type Props = { gameId: string; onSubmitScore: (gameId: string, score: number) => void };
type State = 'idle' | 'waiting' | 'ready' | 'tooSoon' | 'done';

export default function ReactionTest({ gameId, onSubmitScore }: Props) {
  const [state, setState] = useState<State>('idle');
  const [reaction, setReaction] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const startTime = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setState('waiting');
    setReaction(null);
    const delay = 1200 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      startTime.current = Date.now();
      setState('ready');
    }, delay);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function handleClick() {
    if (state === 'idle' || state === 'tooSoon' || state === 'done') {
      start();
    } else if (state === 'waiting') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState('tooSoon');
    } else if (state === 'ready') {
      const ms = Date.now() - startTime.current;
      setReaction(ms);
      setState('done');
      const score = Math.max(0, 1000 - ms);
      onSubmitScore(gameId, score);
      if (best === null || ms < best) setBest(ms);
    }
  }

  const colors: Record<State, string> = {
    idle: 'bg-slate-700 hover:bg-slate-600',
    waiting: 'bg-rose-600',
    ready: 'bg-emerald-500',
    tooSoon: 'bg-amber-500',
    done: 'bg-sky-600 hover:bg-sky-500',
  };

  const texts: Record<State, string> = {
    idle: 'Click to start',
    waiting: 'Wait for green...',
    ready: 'CLICK NOW!',
    tooSoon: 'Too soon! Click to retry',
    done: `${reaction}ms — Click to retry`,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-400">
          {best !== null && <>Best: <span className="text-emerald-400 font-semibold">{best}ms</span></>}
        </div>
        <button
          onClick={() => { setState('idle'); setReaction(null); if (timerRef.current) clearTimeout(timerRef.current); }}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
      <button
        onClick={handleClick}
        className={`w-full h-56 rounded-2xl flex flex-col items-center justify-center text-white font-bold text-xl transition-all ${colors[state]}`}
      >
        {state === 'ready' && <Zap className="w-8 h-8 mb-2" />}
        {texts[state]}
      </button>
      <p className="text-xs text-slate-500 mt-3 text-center">
        Click as fast as you can when the box turns green. Lower ms = higher score.
      </p>
    </div>
  );
}
