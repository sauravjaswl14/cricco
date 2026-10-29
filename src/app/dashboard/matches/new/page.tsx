import { redirect } from "next/navigation";
import { MatchForm } from "@/components/match-form";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const metadata = { title: "Record match | Cricket Impact" };

export default async function NewMatchPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/dashboard");

  const players = await db.player.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <section className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Record match</h1>
      <p className="mb-6 text-sm text-slate-500">
        Each performance adds one match plus the runs and wickets to that player&apos;s career totals.
      </p>
      {players.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Add some players before recording a match.
        </p>
      ) : (
        <MatchForm players={players} />
      )}
    </section>
  );
}
