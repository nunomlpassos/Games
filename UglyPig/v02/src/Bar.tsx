interface BarProps {
  y: number;
  gapStart: number;
  gapWidth: number;
  gameWidth: number;
}

export function Bar({ y, gapStart, gapWidth, gameWidth }: BarProps) {
  const BAR_HEIGHT = 20;

  return (
    <>
      {/* Left segment of the bar */}
      <div
        className="absolute bg-gray-700"
        style={{
          width: `${gapStart}px`,
          height: `${BAR_HEIGHT}px`,
          left: "0px",
          top: `${y}px`,
        }}
      />
      {/* Right segment of the bar */}
      <div
        className="absolute bg-gray-700"
        style={{
          width: `${gameWidth - gapStart - gapWidth}px`,
          height: `${BAR_HEIGHT}px`,
          left: `${gapStart + gapWidth}px`,
          top: `${y}px`,
        }}
      />
    </>
  );
}