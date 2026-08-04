type PriorityInput = {
  coachRepScore: number;
  gmRepScore: number;
  careerXp: number;
  careerWinPct: number;
  userId: string;
};

function deterministicTieBreaker(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 1000;
  }
  return hash / 1000;
}

export function getCarouselPriorityScore(input: PriorityInput) {
  const normalizedXp = Math.min(input.careerXp / 300, 1);
  const normalizedWinPct = Math.min(Math.max(input.careerWinPct, 0), 1);
  const tie = deterministicTieBreaker(input.userId);

  const score =
    input.coachRepScore * 0.4 +
    input.gmRepScore * 0.3 +
    normalizedXp * 100 * 0.2 +
    normalizedWinPct * 100 * 0.08 +
    tie * 2;

  return Math.round(score * 100) / 100;
}
