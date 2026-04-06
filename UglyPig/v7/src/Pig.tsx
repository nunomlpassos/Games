interface PigProps {
  x: number;
  y: number;
  direction: number;
}

export function Pig({ x, y, direction }: PigProps) {
  return (
    <div
      className="absolute"
      style={{
        width: "40px",
        height: "40px",
        left: `${x}px`,
        top: `${y}px`,
        transform: direction === -1 ? "scaleX(-1)" : "scaleX(1)",
      }}
    >
      {/* Body */}
      <div className="absolute inset-0 bg-pink-400 rounded-full border-2 border-pink-600" />
      
      {/* Snout */}
      <div className="absolute bg-pink-300 border-2 border-pink-500 rounded-full"
        style={{
          width: "20px",
          height: "14px",
          top: "13px",
          left: direction === 1 ? "16px" : "4px",
        }}
      >
        {/* Nostrils */}
        <div className="absolute bg-pink-700 rounded-full w-2 h-2 top-2 left-3" />
        <div className="absolute bg-pink-700 rounded-full w-2 h-2 top-2 right-3" />
      </div>

      {/* Ears */}
      <div className="absolute bg-pink-500 rounded-full border-2 border-pink-700"
        style={{
          width: "10px",
          height: "10px",
          top: "2px",
          left: "4px",
        }}
      />
      <div className="absolute bg-pink-500 rounded-full border-2 border-pink-700"
        style={{
          width: "10px",
          height: "10px",
          top: "2px",
          right: "4px",
        }}
      />

      {/* Eyes */}
      <div className="absolute bg-black rounded-full"
        style={{
          width: "4px",
          height: "4px",
          top: "10px",
          left: direction === 1 ? "24px" : "12px",
        }}
      />
    </div>
  );
}