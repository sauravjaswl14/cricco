import { z } from "zod";
import { PLAYER_ROLES } from "./impact-score";

/**
 * Form posts arrive as strings and an empty input becomes "" - which
 * `Number("")` happily turns into 0. Treat blanks as "missing" instead so a
 * forgotten field is an error, not a silent zero.
 */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

function wholeNumber(label: string) {
  return z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: `${label} is required and must be a number` })
      .int(`${label} must be a whole number`)
      .min(0, `${label} cannot be negative`),
  );
}

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Password is required"),
});

export const playerSchema = z.object({
  name: z.string().trim().min(2, "Player name must be at least 2 characters"),
  role: z.enum(PLAYER_ROLES, { error: "Pick a valid role" }),
  basePrice: wholeNumber("Base price"),
  matchesPlayed: wholeNumber("Matches played"),
  totalRuns: wholeNumber("Total runs"),
  totalWickets: wholeNumber("Total wickets"),
});

export const performanceSchema = z.object({
  playerId: z.string().min(1, "Player is required"),
  runs: wholeNumber("Runs"),
  wickets: wholeNumber("Wickets"),
});

export const matchSchema = z
  .object({
    teamA: z.string().trim().min(1, "Team A is required"),
    teamB: z.string().trim().min(1, "Team B is required"),
    winner: z.string().trim().optional(),
    performances: z
      .array(performanceSchema)
      .min(1, "Add at least one player performance"),
  })
  .superRefine((match, ctx) => {
    if (match.teamA.toLowerCase() === match.teamB.toLowerCase()) {
      ctx.addIssue({
        code: "custom",
        path: ["teamB"],
        message: "Team A and Team B must be different",
      });
    }
    if (match.winner && match.winner !== match.teamA && match.winner !== match.teamB) {
      ctx.addIssue({
        code: "custom",
        path: ["winner"],
        message: "Winner must be one of the two teams",
      });
    }
    const ids = match.performances.map((p) => p.playerId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["performances"],
        message: "A player can only appear once per match",
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PlayerInput = z.infer<typeof playerSchema>;
export type MatchInput = z.infer<typeof matchSchema>;

/** Flatten zod issues into `{ fieldName: firstMessage }` for forms and API errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
