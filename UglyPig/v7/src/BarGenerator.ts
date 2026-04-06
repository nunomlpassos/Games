export function generateBar(gameWidth: number) {
  const minGapWidth = 80;
  const maxGapWidth = 150;
  const gapWidth = Math.floor(Math.random() * (maxGapWidth - minGapWidth + 1)) + minGapWidth;
  
  const maxGapStart = gameWidth - gapWidth;
  const gapStart = Math.floor(Math.random() * maxGapStart);

  return {
    y: -20,
    gapStart,
    gapWidth,
  };
}