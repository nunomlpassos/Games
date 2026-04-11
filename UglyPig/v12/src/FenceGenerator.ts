export function generateFence(gameWidth: number) {
  const minGapWidth = 100; // Wider gap for mobile
  const maxGapWidth = 140;
  const gapWidth = Math.floor(Math.random() * (maxGapWidth - minGapWidth + 1)) + minGapWidth;
  
  const maxGapStart = gameWidth - gapWidth;
  const gapStart = Math.floor(Math.random() * maxGapStart);

  return {
    y: -21,
    gapStart,
    gapWidth,
  };
}