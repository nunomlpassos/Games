interface FenceProps {
  y: number;
  gapStart: number;
  gapWidth: number;
  gameWidth: number;
}

function FenceSegment({ width, left, y }: { width: number; left: number; y: number }) {
  const segmentHeight = 34;
  const railHeight = 7;
  const railOffsetTop = 10;
  const railOffsetBottom = 19;
  const picketWidth = 12;
  const picketGap = 8;

  const pickets = [];
  let cursor = 10;
  let idx = 0;

  while (cursor + picketWidth < width - 10) {
    const h = idx % 2 === 0 ? 24 : 28;
    pickets.push(
      <div
        key={idx}
        className="absolute"
        style={{
          left: `${cursor}px`,
          bottom: "2px",
          width: `${picketWidth}px`,
          height: `${h}px`,
          background: "linear-gradient(90deg, #be7a17 0%, #d9962f 45%, #b96e10 100%)",
          border: "1px solid #8c4f06",
          borderBottomWidth: "2px",
          clipPath: "polygon(50% 0%, 100% 20%, 100% 100%, 0% 100%, 0% 20%)",
          boxShadow: "inset -1px 0 0 rgba(255,255,255,0.25), inset 1px 0 0 rgba(0,0,0,0.12)",
        }}
      />
    );
    cursor += picketWidth + picketGap;
    idx += 1;
  }

  return (
    <div
      className="absolute"
      style={{
        left: `${left}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${segmentHeight}px`,
      }}
    >
      {/* back rails */}
      <div
        className="absolute"
        style={{
          left: "-8px",
          right: "-8px",
          top: `${railOffsetTop}px`,
          height: `${railHeight}px`,
          borderRadius: "5px",
          background: "linear-gradient(90deg, #a86410 0%, #c7801d 45%, #a15f0b 100%)",
          border: "1px solid #854b06",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "-8px",
          right: "-8px",
          top: `${railOffsetBottom}px`,
          height: `${railHeight}px`,
          borderRadius: "5px",
          background: "linear-gradient(90deg, #a86410 0%, #c7801d 45%, #a15f0b 100%)",
          border: "1px solid #854b06",
        }}
      />

      {/* side posts */}
      <div
        className="absolute"
        style={{
          left: "-2px",
          bottom: "0px",
          width: "12px",
          height: "32px",
          borderRadius: "7px",
          background: "linear-gradient(90deg, #9f5c0f 0%, #c98420 50%, #93540c 100%)",
          border: "1px solid #7b4606",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "-2px",
          bottom: "0px",
          width: "12px",
          height: "32px",
          borderRadius: "7px",
          background: "linear-gradient(90deg, #9f5c0f 0%, #c98420 50%, #93540c 100%)",
          border: "1px solid #7b4606",
        }}
      />

      {/* front pickets */}
      {pickets}
    </div>
  );
}

export function Fence({ y, gapStart, gapWidth, gameWidth }: FenceProps) {
  const rightWidth = gameWidth - gapStart - gapWidth;

  return (
    <>
      <FenceSegment width={gapStart} left={0} y={y} />
      <FenceSegment width={rightWidth} left={gapStart + gapWidth} y={y} />
    </>
  );
}
