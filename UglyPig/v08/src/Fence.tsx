interface FenceProps {
  y: number;
  gapStart: number;
  gapWidth: number;
  gameWidth: number;
}

export function Fence({ y, gapStart, gapWidth, gameWidth }: FenceProps) {
  const FENCE_HEIGHT = 21; // +5%
  const POST_WIDTH = 21; // +5%

  const renderFenceSegment = (width: number, left: number) => {
    const posts = [];
    for (let i = 0; i < width; i += POST_WIDTH) {
      posts.push(
        <div
          key={i}
          className="absolute bg-amber-900"
          style={{
            width: "4px",
            height: `${FENCE_HEIGHT}px`,
            left: `${left + i + 8}px`,
            top: "0px",
          }}
        />
      );
    }
    return posts;
  };

  return (
    <>
      <div
        className="absolute bg-amber-700 border-y-2 border-amber-900"
        style={{
          width: `${gapStart}px`,
          height: `${FENCE_HEIGHT}px`,
          left: "0px",
          top: `${y}px`,
        }}
      >
        {renderFenceSegment(gapStart, 0)}
      </div>

      <div
        className="absolute bg-amber-700 border-y-2 border-amber-900"
        style={{
          width: `${gameWidth - gapStart - gapWidth}px`,
          height: `${FENCE_HEIGHT}px`,
          left: `${gapStart + gapWidth}px`,
          top: `${y}px`,
        }}
      >
        {renderFenceSegment(gameWidth - gapStart - gapWidth, gapStart + gapWidth)}
      </div>
    </>
  );
}
