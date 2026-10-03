import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

type Props = { gameId: string; onSubmitScore: (gameId: string, score: number) => void };
type Pt = { x: number; y: number };

const GRID = 15;
const CELL = 20;

export default function Snake({ gameId, onSubmitScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const dirRef = useRef<Pt>({ x: 1, y: 0 });
  const snakeRef = useRef<Pt[]>([{ x: 7, y: 7 }]);
  const foodRef = useRef<Pt>({ x: 10, y: 7 });
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const placeFood = useCallback(() => {
    foodRef.current = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  }, []);

  const reset = useCallback(() => {
    snakeRef.current = [{ x: 7, y: 7 }];
    dirRef.current = { x: 1, y: 0 };
    setScore(0);
    setGameOver(false);
    setRunning(false);
    placeFood();
  }, [placeFood]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const d = dirRef.current;
      if (e.key === 'ArrowUp' && d.y === 0) dirRef.current = { x: 0, y: -1 };
      else if (e.key === 'ArrowDown' && d.y === 0) dirRef.current = { x: 0, y: 1 };
      else if (e.key === 'ArrowLeft' && d.x === 0) dirRef.current = { x: -1, y: 0 };
      else if (e.key === 'ArrowRight' && d.x === 0) dirRef.current = { x: 1, y: 0 };
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!running) return;
    loopRef.current = setInterval(() => {
      const snake = snakeRef.current;
      const head = snake[0];
      const dir = dirRef.current;
      const nh = { x: head.x + dir.x, y: head.y + dir.y };

      if (nh.x < 0 || nh.x >= GRID || nh.y < 0 || nh.y >= GRID || snake.some((s) => s.x === nh.x && s.y === nh.y)) {
        setRunning(false);
        setGameOver(true);
        onSubmitScore(gameId, score * 10);
        return;
      }

      const ns = [nh, ...snake];
      if (nh.x === foodRef.current.x && nh.y === foodRef.current.y) {
        setScore((s) => s + 1);
        placeFood();
      } else {
        ns.pop();
      }
      snakeRef.current = ns;
    }, 120);
    return () => { if (loopRef.current) clearInterval(loopRef.current); };
  }, [running, score, gameId, onSubmitScore, placeFood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grid
    ctx.strokeStyle = '#1e293b';
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, GRID * CELL); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(GRID * CELL, i * CELL); ctx.stroke();
    }

    // food
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(foodRef.current.x * CELL + CELL / 2, foodRef.current.y * CELL + CELL / 2, CELL / 2.5, 0, Math.PI * 2);
    ctx.fill();

    // snake
    snakeRef.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#34d399' : '#10b981';
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-400">Score: <span className="text-emerald-400 font-semibold">{score}</span></div>
        <button onClick={reset} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      <div className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={GRID * CELL}
          height={GRID * CELL}
          className="rounded-xl border border-slate-700"
        />
        {!running && !gameOver && (
          <button
            onClick={() => setRunning(true)}
            className="mt-4 px-6 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-400 transition-colors"
          >
            Start Game
          </button>
        )}
        {gameOver && (
          <div className="mt-4 text-center">
            <p className="text-rose-400 font-semibold mb-2">Game Over! Score: {score}</p>
            <button
              onClick={() => { reset(); setRunning(true); }}
              className="px-6 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-400 transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
        {running && (
          <p className="text-xs text-slate-500 mt-3">Use arrow keys to move</p>
        )}
      </div>
    </div>
  );
}
