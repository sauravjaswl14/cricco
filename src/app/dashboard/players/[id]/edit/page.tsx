import { notFound, redirect } from "next/navigation";
import { PlayerForm } from "@/components/player-form";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { updatePlayerAction } from "../../actions";

export const metadata = { title: "Edit player | Cricket Impact" };

export default async function EditPlayerPage({ params }: PageProps<"/dashboard/players/[id]/edit">) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const player = await db.player.findUnique({ where: { id } });
  if (!player) notFound();

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-semibold">Edit {player.name}</h1>
      <p className="mb-6 text-sm text-slate-500">Update the player&apos;s details and career stats.</p>
      <PlayerForm
        action={updatePlayerAction.bind(null, player.id)}
        submitLabel="Save changes"
        initial={{
          name: player.name,
          role: player.role,
          basePrice: String(player.basePrice),
          matchesPlayed: String(player.matchesPlayed),
          totalRuns: String(player.totalRuns),
          totalWickets: String(player.totalWickets),
        }}
      />
    </section>
  );
}
