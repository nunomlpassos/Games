interface PipeProps {
  x: number;
  topHeight: number;
  gapHeight: number;
  gameHeight: number;
}

export function Pipe({ x, topHeight, gapHeight, gameHeight }: PipeProps) {
  const bottomHeight = gameHeight - topHeight - gapHeight;

  return (
    <>
      <div
        className="absolute bg-gray-700"
        style={{
          width: "48px",
          height: `${topHeight}px`,
          left: `${x}px`,
          top: "0px",
        }}
      />
      <div
        className="absolute bg-gray-700"
        style={{
          width: "48px",
          height: `${bottomHeight}px`,
          left: `${x}px`,
          top: `${topHeight + gapHeight}px`,
        }}
      />
    </>
  );
}