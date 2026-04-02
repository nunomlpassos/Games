interface FarmBackgroundProps {
  gameWidth: number;
  gameHeight: number;
}

export function FarmBackground({ gameWidth, gameHeight }: FarmBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sun */}
      <div 
        className="absolute bg-yellow-300 rounded-full border-4 border-yellow-400"
        style={{
          width: "60px",
          height: "60px",
          top: "40px",
          right: "40px",
        }}
      />

      {/* Clouds */}
      <div 
        className="absolute bg-white rounded-full"
        style={{
          width: "80px",
          height: "30px",
          top: "80px",
          left: "30px",
        }}
      />
      <div 
        className="absolute bg-white rounded-full"
        style={{
          width: "50px",
          height: "25px",
          top: "60px",
          left: "80px",
        }}
      />
      <div 
        className="absolute bg-white rounded-full"
        style={{
          width: "60px",
          height: "28px",
          top: "150px",
          left: "250px",
        }}
      />

      {/* Barn (Static background element) */}
      <div 
        className="absolute bg-red-600 border-4 border-red-800"
        style={{
          width: "80px",
          height: "60px",
          bottom: "100px",
          left: "20px",
        }}
      >
        {/* Barn roof */}
        <div 
          className="absolute bg-red-800"
          style={{
            width: "0",
            height: "0",
            borderLeft: "44px solid transparent",
            borderRight: "44px solid transparent",
            borderBottom: "30px solid #7f1d1d",
            top: "-30px",
            left: "-4px",
          }}
        />
        {/* Barn door */}
        <div 
          className="absolute bg-amber-900"
          style={{
            width: "24px",
            height: "36px",
            bottom: "0",
            left: "28px",
          }}
        />
      </div>

      {/* Grass patches at bottom */}
      <div 
        className="absolute bg-green-500 border-t-4 border-green-700"
        style={{
          width: "100%",
          height: "40px",
          bottom: "0",
          left: "0",
        }}
      />
    </div>
  );
}