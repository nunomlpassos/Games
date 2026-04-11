interface GameUIProps {
  score: number;
  lastScore: number;
  topScore: number;
  isGameOver: boolean;
}

export function GameUI({ score, lastScore, topScore, isGameOver }: GameUIProps) {
  return (
    <>
      {/* Top Score Display (Small) */}
      <div className="absolute top-4 left-0 right-0 text-center z-10">
        <span className="text-2xl font-bold text-amber-900 drop-shadow-sm">
          {score}
        </span>
      </div>

      {isGameOver && (
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
              Tap or Space to Restart
            </div>
          </div>
        </div>
      )}
    </>
  );
}