export function generateFence(gameWidth: number) {
  const minGapWidth = 120; // Easier for casual players
  const maxGapWidth = 170;
  const gapWidth = Math.floor(Math.random() * (maxGapWidth - minGapWidth + 1)) + minGapWidth;
  
  const maxGapStart = gameWidth - gapWidth;
  const gapStart = Math.floor(Math.random() * maxGapStart);

  return {
    y: -21,
    gapStart,
    gapWidth,
  };
}