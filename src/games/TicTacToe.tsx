import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

type Props = { gameId: string; onSubmitScore: (gameId: string, score: number) => void };
type Cell = 'X' | 'O' | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(b: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line };
  }
  return null;
}

function aiMove(b: Cell[]): number {
  // Try to win, then block, then center, then corner, then random
  const tryWin = findMove(b, 'O');
  if (tryWin !== -1) return tryWin;
  const tryBlock = findMove(b, 'X');
  if (tryBlock !== -1) return tryBlock;
  if (b[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => b[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const empty = b.map((c, i) => c === null ? i : -1).filter((i) => i !== -1);
  return empty[Math.floor(Math.random() * empty.length)];
}

function findMove(b: Cell[], player: Cell): number {
  for (const line of LINES) {
    const cells = line.map((i) => b[i]);
    const count = cells.filter((c) => c === player).length;
    const empty = line.find((i) => b[i] === null);
    if (count === 2 && empty !== undefined) return empty;
  }
  return -1;
}

export default function TicTacToe({ gameId, onSubmitScore }: Props) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [winner, setWinner] = useState<{ winner: Cell; line: number[] } | null>(null);
  const [draw, setDraw] = useState(false);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [playerTurn, setPlayerTurn] = useState(true);

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setDraw(false);
    setPlayerTurn(true);
  }, []);

  function play(i: number) {
    if (board[i] || winner || !playerTurn) return;
    const next = [...board];
    next[i] = 'X';
    setBoard(next);
    setPlayerTurn(false);
    const result = checkWinner(next);
    if (result) {
      setWinner(result);
      setStats((s) => ({ ...s, losses: s.losses + 1 }));
      return;
    }
    if (next.every((c) => c)) { setDraw(true); setStats((s) => ({ ...s, draws: s.draws + 1 })); return; }

    // AI
    setTimeout(() => {
      const aiIdx = aiMove(next);
      next[aiIdx] = 'O';
      setBoard(next);
      setPlayerTurn(true);
      const r2 = checkWinner(next);
      if (r2) {
        setWinner(r2);
        setStats((s) => {
          const ns = { ...s, wins: s.wins + 1 };
          onSubmitScore(gameId, ns.wins * 100);
          return ns;
        });
      } else if (next.every((c) => c)) {
        setDraw(true);
        setStats((s) => ({ ...s, draws: s.draws + 1 }));
      }
    }, 400);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <span className="text-emerald-400">Wins: {stats.wins}</span>
          <span className="text-rose-400">Losses: {stats.losses}</span>
          <span className="text-slate-400">Draws: {stats.draws}</span>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      <p className="text-sm text-center text-slate-400 mb-3">
        {winner ? (winner.winner === 'X' ? '🎉 You win!' : 'AI wins.') : draw ? "It's a draw." : playerTurn ? 'Your turn (X)' : 'AI thinking...'}
      </p>

      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            disabled={!!cell || !!winner || draw || !playerTurn}
            className={`aspect-square rounded-xl text-4xl font-bold flex items-center justify-center transition-all ${
              winner?.line.includes(i)
                ? 'bg-emerald-500/30 border border-emerald-500/50'
                : cell
                ? 'bg-slate-700/50 border border-slate-600'
                : 'bg-slate-900/60 border border-slate-700 hover:border-slate-500 hover:scale-105'
            } ${cell === 'X' ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}
