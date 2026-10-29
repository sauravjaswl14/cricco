import { describe, expect, it } from "vitest";
import {
  calculateImpactScore,
  ROLE_MODIFIERS,
  type PlayerStats,
} from "./impact-score";

const stats = (overrides: Partial<PlayerStats>): PlayerStats => ({
  role: "ALL_ROUNDER",
  matchesPlayed: 10,
  totalRuns: 0,
  totalWickets: 0,
  ...overrides,
});

describe("calculateImpactScore", () => {
  it("applies the 1.5x wicket multiplier and rookie penalty to a Bowler with 0 matches", () => {
    // wickets: 10 * 1.5 = 15 -> 15 * 20 = 300, runs 0, rookie -50
    const score = calculateImpactScore(
      stats({ role: "BOWLER", matchesPlayed: 0, totalWickets: 10 }),
    );
    expect(score).toBe(250);
  });

  it("gives a Wicketkeeper with high runs the flat +30 and no bowler multiplier", () => {
    // runs: 1000 * 1.2 = 1200, wickets 4 * 20 = 80 (NOT 1.5x), veteran +100, keeper +30
    const score = calculateImpactScore(
      stats({
        role: "WICKETKEEPER",
        matchesPlayed: 25,
        totalRuns: 1000,
        totalWickets: 4,
      }),
    );
    expect(score).toBe(1410);
  });

  it("applies the 1.3x run multiplier to a Batsman", () => {
    // 500 * 1.3 = 650 -> 650 * 1.2 = 780, 10 matches => no adjustment
    const score = calculateImpactScore(
      stats({ role: "BATSMAN", matchesPlayed: 10, totalRuns: 500 }),
    );
    expect(score).toBe(780);
  });

  it("treats the 5 and 20 match boundaries as neutral", () => {
    const base = { totalRuns: 100 }; // 120 points
    expect(calculateImpactScore(stats({ ...base, matchesPlayed: 4 }))).toBe(70);
    expect(calculateImpactScore(stats({ ...base, matchesPlayed: 5 }))).toBe(120);
    expect(calculateImpactScore(stats({ ...base, matchesPlayed: 20 }))).toBe(120);
    expect(calculateImpactScore(stats({ ...base, matchesPlayed: 21 }))).toBe(220);
  });

  it("does not leak floating point noise into the result", () => {
    // 1.3 * 1.2 * 100 is 156.00000000000003 in raw floating point math
    const score = calculateImpactScore(
      stats({ role: "BATSMAN", matchesPlayed: 10, totalRuns: 100 }),
    );
    expect(score).toBe(156);
  });

  it("rejects negative or fractional stats", () => {
    expect(() => calculateImpactScore(stats({ totalRuns: -1 }))).toThrow(RangeError);
    expect(() => calculateImpactScore(stats({ totalWickets: -3 }))).toThrow(RangeError);
    expect(() => calculateImpactScore(stats({ matchesPlayed: 2.5 }))).toThrow(RangeError);
  });
});

describe("ROLE_MODIFIERS", () => {
  it("never gives a Wicketkeeper the bowler wicket multiplier", () => {
    expect(ROLE_MODIFIERS.WICKETKEEPER.wicketsFactor).toBe(1);
    expect(ROLE_MODIFIERS.BOWLER.wicketsFactor).toBe(1.5);
  });

  it("is rejected by the compiler if a wicketkeeper is given the bowler multiplier", () => {
    const bad: typeof ROLE_MODIFIERS = {
      ...ROLE_MODIFIERS,
      // @ts-expect-error WICKETKEEPER.wicketsFactor must be the literal 1
      WICKETKEEPER: { runsFactor: 1, wicketsFactor: 1.5, flatBonus: 30 },
    };
    expect(bad).toBeDefined();
  });
});
