type PriorityInput = {
  coachRepScore: number;
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
  const normalizedWinPct = Math.min(Math.max(input.careerWinPct, 0), 1);
  const tie = deterministicTieBreaker(input.userId);

  // Lexicographic order: coach rep first, then career win pct.
  const score = input.coachRepScore * 1000 + normalizedWinPct * 100 + tie;

  return Math.round(score * 100) / 100;
}
