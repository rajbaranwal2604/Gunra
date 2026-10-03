import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check } from 'lucide-react';

const EMOJIS = ['🎮', '🎯', '🏆', '⚡', '🎲', '🎨', '🚀', '💡'];

type Props = { gameId: string; onSubmitScore: (gameId: string, score: number) => void };

export default function MemoryMatch({ gameId, onSubmitScore }: Props) {
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [done, setDone] = useState(false);
  const [lock, setLock] = useState(false);

  const init = useCallback(() => {
    const deck = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setMatched(0);
    setDone(false);
    setLock(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  function flip(idx: number) {
    if (lock || cards[idx].flipped || cards[idx].matched) return;
    const next = [...cards];
    next[idx].flipped = true;
    setCards(next);
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLock(true);
      const [a, b] = newFlipped;
      if (next[a].emoji === next[b].emoji) {
        setTimeout(() => {
          next[a].matched = true;
          next[b].matched = true;
          setCards(next);
          setFlipped([]);
          setLock(false);
          setMatched((c) => {
            const nc = c + 1;
            if (nc === 8) {
              setDone(true);
              const score = Math.max(100, 1000 - moves * 50);
              onSubmitScore(gameId, score);
            }
            return nc;
          });
        }, 500);
      } else {
        setTimeout(() => {
          next[a].flipped = false;
          next[b].flipped = false;
          setCards(next);
          setFlipped([]);
          setLock(false);
        }, 900);
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <span className="text-slate-400">Moves: <span className="text-white font-semibold">{moves}</span></span>
          <span className="text-slate-400">Pairs: <span className="text-emerald-400 font-semibold">{matched}/8</span></span>
        </div>
        <button onClick={init} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {done && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4" /> Solved in {moves} moves! Score submitted.
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => flip(i)}
            className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
              card.matched
                ? 'bg-emerald-500/20 border border-emerald-500/40 scale-95'
                : card.flipped
                ? 'bg-slate-700 border border-slate-600'
                : 'bg-slate-900/60 border border-slate-700 hover:border-slate-600 hover:scale-105'
            }`}
          >
            {card.flipped || card.matched ? card.emoji : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
