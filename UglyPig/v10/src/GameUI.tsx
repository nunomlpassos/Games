interface GameUIProps {
  score: number;
  lastScore: number;
  topScore: number;
  isGameOver: boolean;
  isPaused: boolean;
  isNewBest: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onResume: () => void;
  onRestart: () => void;
}

function CelebrationEffects() {
  const confetti = Array.from({ length: 18 }, (_, i) => i);
  const fireworks = Array.from({ length: 3 }, (_, i) => i);

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(180px) rotate(320deg); opacity: 0; }
        }
        @keyframes boom {
          0% { transform: scale(0.2); opacity: 0.9; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      <div className="absolute left-3 top-16 z-50 pointer-events-none">
        {confetti.slice(0, 9).map((i) => (
          <span
            key={`l-${i}`}
            className="absolute block w-2 h-4 rounded"
            style={{
              left: `${(i % 3) * 10}px`,
              background: ["#f59e0b", "#22c55e", "#3b82f6", "#ec4899"][i % 4],
              animation: `confettiFall ${1 + (i % 3) * 0.3}s ease-out ${(i % 4) * 0.1}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="absolute right-3 top-16 z-50 pointer-events-none">
        {confetti.slice(9).map((i) => (
          <span
            key={`r-${i}`}
            className="absolute block w-2 h-4 rounded"
            style={{
              right: `${(i % 3) * 10}px`,
              background: ["#f59e0b", "#22c55e", "#3b82f6", "#ec4899"][i % 4],
              animation: `confettiFall ${1 + (i % 3) * 0.3}s ease-out ${(i % 4) * 0.1}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        {fireworks.map((i) => (
          <span
            key={i}
            className="absolute rounded-full border-2"
            style={{
              left: `${(i - 1) * 42}px`,
              width: "22px",
              height: "22px",
              borderColor: ["#f59e0b", "#60a5fa", "#34d399"][i],
              animation: `boom 1s ease-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

export function GameUI({
  score,
  lastScore,
  topScore,
  isGameOver,
  isPaused,
  isNewBest,
  soundEnabled,
  vibrationEnabled,
  onToggleSound,
  onToggleVibration,
  onResume,
  onRestart,
}: GameUIProps) {
  if (!isGameOver && !isPaused) return null;

  if (isGameOver) {
    return (
      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-40">
        {isNewBest && <CelebrationEffects />}

        <div className="bg-white border-4 border-red-600 p-6 rounded-lg w-72 relative">
          {isNewBest && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full shadow">
              NEW PERSONAL BEST!
            </div>
          )}

          <div className="text-red-600 text-3xl font-black mb-4 text-center uppercase tracking-wider">Game Over</div>

          <div className="flex flex-col gap-3 mb-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-amber-900 text-base font-bold">Score:</span>
              <span className="text-amber-900 text-xl font-black">{score}</span>
            </div>

            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-600 text-base font-bold">Last Run:</span>
              <span className="text-gray-700 text-lg font-bold">{lastScore}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-green-700 text-base font-bold">Best:</span>
              <span className="text-green-700 text-xl font-black">{topScore}</span>
            </div>
          </div>

          <button type="button" onClick={onRestart} className="w-full px-3 py-2 rounded bg-red-600 text-white font-bold">
            Play again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center z-40">
      <div className="bg-white border-4 border-amber-700 p-6 rounded-lg w-72">
        <div className="text-amber-700 text-3xl font-black mb-4 text-center uppercase tracking-wider">Paused</div>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <span className="text-amber-900 text-base font-bold">Score:</span>
            <span className="text-amber-900 text-xl font-black">{score}</span>
          </div>

          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <span className="text-gray-600 text-base font-bold">Last Run:</span>
            <span className="text-gray-700 text-lg font-bold">{lastScore}</span>
          </div>

          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <span className="text-green-700 text-base font-bold">Best:</span>
            <span className="text-green-700 text-xl font-black">{topScore}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={onToggleSound}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-slate-900 text-white font-bold"
            title={soundEnabled ? "Sound ON" : "Sound OFF"}
          >
            <span className="text-lg">{soundEnabled ? "🔊" : "🔇"}</span>
            <span>{soundEnabled ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={onToggleVibration}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-slate-900 text-white font-bold"
            title={vibrationEnabled ? "Vibration ON" : "Vibration OFF"}
          >
            <span className="text-lg">{vibrationEnabled ? "📳" : "📴"}</span>
            <span>{vibrationEnabled ? "ON" : "OFF"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onResume} className="px-3 py-2 rounded bg-emerald-600 text-white font-bold">
            Resume
          </button>

          <button type="button" onClick={onRestart} className="px-3 py-2 rounded bg-red-600 text-white font-bold">
            Restart game
          </button>
        </div>
      </div>
    </div>
  );
}
