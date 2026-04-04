interface FarmBackgroundProps {
  gameWidth: number;
  gameHeight: number;
}

export function FarmBackground({ gameWidth, gameHeight }: FarmBackgroundProps) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* Sky is handled by parent bg-sky-300 */}
      
      {/* Sun */}
      <div className="absolute top-8 right-8 w-16 h-16 bg-yellow-300 rounded-full border-4 border-yellow-500" />
      
      {/* Clouds */}
      <div className="absolute top-16 left-10 w-20 h-8 bg-white rounded-full opacity-90" />
      <div className="absolute top-24 left-16 w-12 h-6 bg-white rounded-full opacity-90" />
      
      <div className="absolute top-32 right-24 w-24 h-10 bg-white rounded-full opacity-90" />
      <div className="absolute top-40 right-32 w-14 h-6 bg-white rounded-full opacity-90" />

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-green-600 border-t-4 border-green-800" />
      
      {/* Dirt details */}
      <div className="absolute bottom-4 left-10 w-6 h-6 bg-green-700 rounded-full" />
      <div className="absolute bottom-8 right-20 w-8 h-8 bg-green-700 rounded-full" />
      <div className="absolute bottom-2 left-1/2 w-5 h-5 bg-green-700 rounded-full" />
    </div>
  );
}