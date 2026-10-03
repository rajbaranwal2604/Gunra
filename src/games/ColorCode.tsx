import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Play } from 'lucide-react';

type Props = { gameId: string; onSubmitScore: (gameId: string, score: number) => void };

const COLORS = [
  { bg: 'bg-rose-500', name: 'Red', glow: 'shadow-rose-500/50' },
  { bg: 'bg-emerald-500', name: 'Green', glow: 'shadow-emerald-500/50' },
  { bg: 'bg-sky-500', name: 'Blue', glow: 'shadow-sky-500/50' },
  { bg: 'bg-amber-500', name: 'Yellow', glow: 'shadow-amber-500/50' },
];

type Phase = 'idle' | 'showing' | 'input' | 'wrong' | 'won';

export default function ColorCode({ gameId, onSubmitScore }: Props) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIdx, setInputIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [highlight, setHighlight] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setSequence([]);
    setInputIdx(0);
    setPhase('idle');
    setHighlight(null);
    setRound(0);
  }, [clearTimers]);

  function startGame() {
    clearTimers();
    const seq = [Math.floor(Math.random() * 4)];
    setSequence(seq);
    setRound(1);
    playSequence(seq);
  }

  function nextRound() {
    const seq = [...sequence, Math.floor(Math.random() * 4)];
    setSequence(seq);
    setRound(round + 1);
    setInputIdx(0);
    playSequence(seq);
  }

  function playSequence(seq: number[]) {
    setPhase('showing');
    seq.forEach((color, i) => {
      const showT = setTimeout(() => setHighlight(color), (i + 1) * 700);
      timersRef.current.push(showT);
      const hideT = setTimeout(() => setHighlight(null), (i + 1) * 700 + 400);
      timersRef.current.push(hideT);
    });
    const doneT = setTimeout(() => setPhase('input'), (seq.length + 1) * 700);
    timersRef.current.push(doneT);
  }

  function handleClick(color: number) {
    if (phase !== 'input') return;
    setHighlight(color);
    setTimeout(() => setHighlight(null), 200);

    if (color === sequence[inputIdx]) {
      const nextIdx = inputIdx + 1;
      if (nextIdx === sequence.length) {
        setPhase('won');
        const score = sequence.length * 100;
        onSubmitScore(gameId, score);
      } else {
        setInputIdx(nextIdx);
      }
    } else {
      setPhase('wrong');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-400">
          Round: <span className="text-emerald-400 font-semibold">{round}</span>
          {phase === 'input' && <> · Repeat the sequence</>}
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        {COLORS.map((c, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={phase !== 'input'}
            className={`aspect-square rounded-2xl transition-all duration-200 ${c.bg} ${
              highlight === i ? `opacity-100 scale-105 shadow-lg ${c.glow}` : 'opacity-40'
            } ${phase === 'input' ? 'hover:opacity-70 cursor-pointer' : ''}`}
          />
        ))}
      </div>

      <div className="mt-5 text-center min-h-[60px]">
        {phase === 'idle' && (
          <button onClick={startGame} className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-400 transition-colors">
            <Play className="w-4 h-4" /> Start
          </button>
        )}
        {phase === 'showing' && <p className="text-sm text-amber-400 animate-pulse">Watch closely...</p>}
        {phase === 'input' && <p className="text-sm text-slate-400">Your turn — repeat the pattern ({inputIdx}/{sequence.length})</p>}
        {phase === 'won' && (
          <div>
            <p className="text-emerald-400 font-semibold mb-2">Correct! Round {round} complete.</p>
            <button onClick={nextRound} className="px-6 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-400 transition-colors">
              Next Round
            </button>
          </div>
        )}
        {phase === 'wrong' && (
          <div>
            <p className="text-rose-400 font-semibold mb-2">Wrong! You reached round {round}.</p>
            <button onClick={startGame} className="px-6 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-400 transition-colors">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
