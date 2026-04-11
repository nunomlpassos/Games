interface GameUIProps {
  score: number;
  lastScore: number;
  topScore: number;
  isGameOver: boolean;
  isPaused: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onResume: () => void;
  onRestart: () => void;
}

export function GameUI({
  score,
  lastScore,
  topScore,
  isGameOver,
  isPaused,
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
        <div className="bg-white border-4 border-red-600 p-6 rounded-lg w-64">
          <div className="text-red-600 text-3xl font-black mb-4 text-center uppercase tracking-wider">
            Game Over
          </div>

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

          <div className="text-gray-700 text-sm text-center mt-2 font-medium">
            Tap, Click or Space to Restart
          </div>
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
          <button
            type="button"
            onClick={onResume}
            className="px-3 py-2 rounded bg-emerald-600 text-white font-bold"
          >
            Retomar
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="px-3 py-2 rounded bg-red-600 text-white font-bold"
          >
            Reiniciar jogo
          </button>
        </div>
      </div>
    </div>
  );
}
