import { db } from "./db";
import type { MatchInput } from "./validation";

export class UnknownPlayersError extends Error {
  constructor(public readonly missingIds: string[]) {
    super(`Unknown player id(s): ${missingIds.join(", ")}`);
  }
}

/**
 * Stores the match and its per-player performances, then rolls those numbers
 * into each player's career totals (+1 match, +runs, +wickets).
 *
 * Everything happens in one transaction so a failure half-way can never leave
 * a match recorded without the career stats being updated (or the reverse).
 */
export async function recordMatch(input: MatchInput, recordedById: string) {
  const playerIds = input.performances.map((p) => p.playerId);

  return db.$transaction(async (tx) => {
    const found = await tx.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((p) => p.id));
    const missing = playerIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) throw new UnknownPlayersError(missing);

    const match = await tx.match.create({
      data: {
        teamA: input.teamA,
        teamB: input.teamB,
        winner: input.winner || null,
        recordedById,
        performances: {
          create: input.performances.map(({ playerId, runs, wickets }) => ({ playerId, runs, wickets })),
        },
      },
      include: { performances: true },
    });

    for (const { playerId, runs, wickets } of input.performances) {
      await tx.player.update({
        where: { id: playerId },
        data: {
          matchesPlayed: { increment: 1 },
          totalRuns: { increment: runs },
          totalWickets: { increment: wickets },
        },
      });
    }

    return match;
  });
}
