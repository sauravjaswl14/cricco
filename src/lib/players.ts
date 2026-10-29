import type { Player } from "@/generated/prisma/client";
import { calculateImpactScore } from "./impact-score";

export type PlayerWithScore = Player & { impactScore: number };

export function withImpactScore(player: Player): PlayerWithScore {
  return { ...player, impactScore: calculateImpactScore(player) };
}

/** Highest impact first; ties fall back to name so the order is stable between requests. */
export function rankByImpact(players: Player[]): PlayerWithScore[] {
  return players
    .map(withImpactScore)
    .sort((a, b) => b.impactScore - a.impactScore || a.name.localeCompare(b.name));
}
