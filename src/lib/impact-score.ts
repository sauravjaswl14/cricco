export const PLAYER_ROLES = [
  "BATSMAN",
  "BOWLER",
  "ALL_ROUNDER",
  "WICKETKEEPER",
] as const;

export type PlayerRole = (typeof PLAYER_ROLES)[number];

export interface PlayerStats {
  role: PlayerRole;
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
}

/**
 * Per-role modifiers, encoded in the type system.
 *
 * Each literal type below is conditional on the role, so the compiler rejects
 * a table where a WICKETKEEPER has `wicketsFactor: 1.5` (the Bowler
 * multiplier). That is how we enforce "a wicketkeeper can never get the
 * bowler multiplier" at compile time rather than with a runtime check that
 * someone could forget.
 */
type RoleModifiers = {
  [R in PlayerRole]: {
    runsFactor: R extends "BATSMAN" ? 1.3 : 1;
    wicketsFactor: R extends "BOWLER" ? 1.5 : 1;
    flatBonus: R extends "WICKETKEEPER" ? 30 : 0;
  };
};

export const ROLE_MODIFIERS: RoleModifiers = {
  BATSMAN: { runsFactor: 1.3, wicketsFactor: 1, flatBonus: 0 },
  BOWLER: { runsFactor: 1, wicketsFactor: 1.5, flatBonus: 0 },
  ALL_ROUNDER: { runsFactor: 1, wicketsFactor: 1, flatBonus: 0 },
  WICKETKEEPER: { runsFactor: 1, wicketsFactor: 1, flatBonus: 30 },
};

export const RUNS_WEIGHT = 1.2;
export const WICKETS_WEIGHT = 20;
export const ROOKIE_MATCH_LIMIT = 5; // fewer than this => rookie penalty
export const ROOKIE_PENALTY = 50;
export const VETERAN_MATCH_LIMIT = 20; // more than this => veteran bonus
export const VETERAN_BONUS = 100;

function assertNonNegativeInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer, got ${value}`);
  }
}

function experienceAdjustment(matchesPlayed: number): number {
  if (matchesPlayed < ROOKIE_MATCH_LIMIT) return -ROOKIE_PENALTY;
  if (matchesPlayed > VETERAN_MATCH_LIMIT) return VETERAN_BONUS;
  return 0;
}

/**
 * Cricket Impact Score.
 *
 *   effectiveRuns    = runs    * (1.3 if Batsman else 1)
 *   effectiveWickets = wickets * (1.5 if Bowler  else 1)
 *   base             = effectiveRuns * 1.2 + effectiveWickets * 20
 *   score            = base + experience adjustment + wicketkeeper bonus
 *
 * Experience adjustment: -50 when matchesPlayed < 5, +100 when > 20.
 * Wicketkeepers get a flat +30 and never a bowler multiplier.
 *
 * The result is rounded to 2 decimals so that float noise from the 1.2 / 1.3
 * multipliers (e.g. 156.00000000000003) never leaks into the UI or the sort.
 */
export function calculateImpactScore(stats: PlayerStats): number {
  const { role, matchesPlayed, totalRuns, totalWickets } = stats;

  assertNonNegativeInteger(matchesPlayed, "matchesPlayed");
  assertNonNegativeInteger(totalRuns, "totalRuns");
  assertNonNegativeInteger(totalWickets, "totalWickets");

  const modifier = ROLE_MODIFIERS[role];
  if (!modifier) {
    throw new TypeError(`Unknown player role: ${String(role)}`);
  }

  const effectiveRuns = totalRuns * modifier.runsFactor;
  const effectiveWickets = totalWickets * modifier.wicketsFactor;

  const base = effectiveRuns * RUNS_WEIGHT + effectiveWickets * WICKETS_WEIGHT;
  const total = base + experienceAdjustment(matchesPlayed) + modifier.flatBonus;

  return Math.round(total * 100) / 100;
}
