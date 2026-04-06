export function generatePipe(gameWidth: number, gameHeight: number) {
  const minGap = 120;
  const maxGap = 200;
  const minPipeHeight = 100;
  const maxPipeHeight = 300;

  const gapHeight = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
  const topHeight = Math.floor(
    Math.random() * (maxPipeHeight - minPipeHeight + 1)
  ) + minPipeHeight;

  return {
    x: gameWidth,
    topHeight,
    gapHeight,
  };
}