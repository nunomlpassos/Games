interface PigProps {
  x: number;
  y: number;
  direction: number;
  size?: number;
  crashRotation?: number;
  crashOffsetY?: number;
}

export function Pig({ x, y, direction, size = 42, crashRotation = 0, crashOffsetY = 0 }: PigProps) {
  const snoutWidth = size * 0.5;
  const snoutHeight = size * 0.35;

  return (
    <div
      className="absolute"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}px`,
        top: `${y + crashOffsetY}px`,
        // Base drawing faces right; only flip horizontally when moving left
        transform: `${direction === -1 ? "scaleX(-1)" : "scaleX(1)"} rotate(${crashRotation}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      {/* Body */}
      <div className="absolute inset-0 bg-pink-400 rounded-full border-2 border-pink-600" />

      {/* Snout (right-facing base) */}
      <div
        className="absolute bg-pink-300 border-2 border-pink-500 rounded-full"
        style={{
          width: `${snoutWidth}px`,
          height: `${snoutHeight}px`,
          top: `${size * 0.33}px`,
          left: `${size * 0.42}px`,
        }}
      >
        <div
          className="absolute bg-pink-700 rounded-full"
          style={{ width: `${size * 0.08}px`, height: `${size * 0.08}px`, top: `${size * 0.06}px`, left: `${size * 0.12}px` }}
        />
        <div
          className="absolute bg-pink-700 rounded-full"
          style={{ width: `${size * 0.08}px`, height: `${size * 0.08}px`, top: `${size * 0.06}px`, right: `${size * 0.12}px` }}
        />
      </div>

      {/* Ears */}
      <div
        className="absolute bg-pink-500 rounded-full border-2 border-pink-700"
        style={{ width: `${size * 0.25}px`, height: `${size * 0.25}px`, top: `${size * 0.05}px`, left: `${size * 0.08}px` }}
      />
      <div
        className="absolute bg-pink-500 rounded-full border-2 border-pink-700"
        style={{ width: `${size * 0.25}px`, height: `${size * 0.25}px`, top: `${size * 0.05}px`, right: `${size * 0.08}px` }}
      />

      {/* Eye (right-facing base) */}
      <div
        className="absolute bg-black rounded-full"
        style={{
          width: `${size * 0.1}px`,
          height: `${size * 0.1}px`,
          top: `${size * 0.22}px`,
          left: `${size * 0.6}px`,
        }}
      />
    </div>
  );
}
