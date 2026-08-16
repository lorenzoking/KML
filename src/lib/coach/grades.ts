export type ReputationGrade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D"
  | "F";

export function getReputationGrade(score: number): ReputationGrade {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 75) return "C";
  if (score >= 70) return "D";
  return "F";
}

export function getReputationGradeLabel(grade: ReputationGrade): string {
  switch (grade) {
    case "A+":
      return "Elite";
    case "A":
      return "Championship Level";
    case "B+":
      return "Highly Respected";
    case "B":
      return "Stable";
    case "C":
    case "C+":
    case "C-":
      return "Hot Seat";
    case "D":
      return "Firing Territory";
    case "F":
      return "Termination Level";
    default:
      return "Stable";
  }
}

export function gradeToNumeric(grade: ReputationGrade): number {
  const map: Record<ReputationGrade, number> = {
    "A+": 11,
    A: 10,
    "A-": 9,
    "B+": 8,
    B: 7,
    "B-": 6,
    "C+": 5,
    C: 4,
    "C-": 3,
    D: 2,
    F: 1,
  };
  return map[grade];
}
