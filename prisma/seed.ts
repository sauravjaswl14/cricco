import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

const players = [
  { name: "Rohit Paudel", role: "BATSMAN", basePrice: 150, matchesPlayed: 28, totalRuns: 1240, totalWickets: 1 },
  { name: "Sandeep Lamichhane", role: "BOWLER", basePrice: 180, matchesPlayed: 31, totalRuns: 85, totalWickets: 64 },
  { name: "Kushal Bhurtel", role: "BATSMAN", basePrice: 120, matchesPlayed: 22, totalRuns: 870, totalWickets: 0 },
  { name: "Dipendra Airee", role: "ALL_ROUNDER", basePrice: 160, matchesPlayed: 19, totalRuns: 540, totalWickets: 22 },
  { name: "Aarif Sheikh", role: "WICKETKEEPER", basePrice: 110, matchesPlayed: 24, totalRuns: 690, totalWickets: 0 },
  { name: "Karan KC", role: "BOWLER", basePrice: 90, matchesPlayed: 4, totalRuns: 12, totalWickets: 9 },
  { name: "Gulsan Jha", role: "ALL_ROUNDER", basePrice: 75, matchesPlayed: 3, totalRuns: 64, totalWickets: 2 },
] as const;

async function main() {
  await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Demo Admin",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "ADMIN",
    },
  });

  if ((await db.player.count()) === 0) {
    await db.player.createMany({ data: players.map((p) => ({ ...p })) });
  }
  console.log("Seeded demo admin (admin@example.com / password123) and sample players.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
