interface GameUIProps {
  score: number;
  topScore: number;
  isGameOver: boolean;
}

export function GameUI({ score, topScore, isGameOver }: GameUIProps) {
  return (
    <>
      <div className="absolute top-4 left-0 right-0 text-center z-10">
        <span className="text-3xl font-bold text-amber-900 drop-shadow-sm">
          {score}
        </span>
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20">
          <div className="bg-white border-4 border-red-600 p-6 rounded-lg">
            <div className="text-red-600 text-3xl font-black mb-4 text-center">
              GAME OVER
            </div>
            
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between items-center gap-8">
                <span className="text-amber-900 text-lg font-bold">Score:</span>
                <span className="text-amber-900 text-xl font-black">{score}</span>
              </div>
              <div className="flex justify-between items-center gap-8">
                <span className="text-amber-900 text-lg font-bold">Best:</span>
                <span className="text-green-700 text-xl font-black">{topScore}</span>
              </div>
            </div>

            <div className="text-gray-700 text-lg text-center mt-2">
              Tap or Space to Restart
            </div>
          </div>
        </div>
      )}
    </>
  );
}