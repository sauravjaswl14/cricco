import { describe, expect, it } from "vitest";
import { fieldErrors, matchSchema, playerSchema } from "./validation";

const validPlayer = {
  name: "Virat Kohli",
  role: "BATSMAN",
  basePrice: "200",
  matchesPlayed: "30",
  totalRuns: "1500",
  totalWickets: "2",
};

describe("playerSchema", () => {
  it("accepts form-style string numbers", () => {
    const parsed = playerSchema.parse(validPlayer);
    expect(parsed.totalRuns).toBe(1500);
  });

  it("rejects negative total runs with a readable message", () => {
    const result = playerSchema.safeParse({ ...validPlayer, totalRuns: "-5" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).totalRuns).toBe("Total runs cannot be negative");
    }
  });

  it("treats a blank number field as missing instead of zero", () => {
    const result = playerSchema.safeParse({ ...validPlayer, totalWickets: "" });
    expect(result.success).toBe(false);
  });
});

describe("matchSchema", () => {
  const base = {
    teamA: "Kathmandu Kings",
    teamB: "Pokhara Rhinos",
    performances: [{ playerId: "p1", runs: 40, wickets: 1 }],
  };

  it("rejects identical teams and unknown winners", () => {
    expect(matchSchema.safeParse({ ...base, teamB: "kathmandu kings" }).success).toBe(false);
    expect(matchSchema.safeParse({ ...base, winner: "Someone Else" }).success).toBe(false);
  });

  it("rejects the same player listed twice", () => {
    const result = matchSchema.safeParse({
      ...base,
      performances: [
        { playerId: "p1", runs: 1, wickets: 0 },
        { playerId: "p1", runs: 2, wickets: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });
});
