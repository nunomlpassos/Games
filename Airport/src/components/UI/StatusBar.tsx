import { Clock, Users, X, Pause, Play } from "lucide-react";

interface StatusBarProps {
  timeLeft: number;
  passedCount: number;
  target: number;
  failedCount: number;
  level: number;
  onPause: () => void;
  isPaused: boolean;
}

export function StatusBar({ 
  timeLeft, 
  passedCount, 
  target, 
  failedCount, 
  level,
  onPause,
  isPaused
}: StatusBarProps) {
  const timeColor = timeLeft <= 10 ? "text-red-600" : timeLeft <= 30 ? "text-orange-500" : "text-blue-600";
  const failedColor = failedCount >= 3 ? "text-red-600" : "text-gray-600";

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-gray-200 px-6 py-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Nível</span>
          <span className="text-lg font-bold text-gray-800">{level}</span>
        </div>
        
        <div className="h-8 w-px bg-gray-200" />

        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Tempo
          </span>
          <span className={`text-lg font-bold ${timeColor}`}>{timeLeft}s</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1">
            Passados <Users className="w-3 h-3" />
          </span>
          <span className="text-lg font-bold text-green-600">{passedCount}/{target}</span>
        </div>
        
        <div className="h-8 w-px bg-gray-200" />

        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1">
            Falhados <X className="w-3 h-3" />
          </span>
          <span className={`text-lg font-bold ${failedColor}`}>{failedCount}/3</span>
        </div>
      </div>

      {/* Botão de Pausa */}
      <button
        onClick={onPause}
        className="ml-4 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
        aria-label={isPaused ? "Retomar" : "Pausar"}
      >
        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </button>
    </div>
  );
}