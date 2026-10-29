import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Not env("DATABASE_URL"): that throws when the variable is missing, which
    // broke `prisma generate` in postinstall on a fresh clone before .env exists.
    // Generating the client needs no database; migrate/deploy still need the real URL.
    url: process.env.DATABASE_URL ?? "",
  },
});
