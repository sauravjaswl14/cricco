import { redirect } from "next/navigation";
import { PlayerForm } from "@/components/player-form";
import { getSession } from "@/lib/session";
import { createPlayerAction } from "../actions";

export const metadata = { title: "Add player | Cricket Impact" };

export default async function NewPlayerPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/dashboard");

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-semibold">Add player</h1>
      <p className="mb-6 text-sm text-slate-500">Stats start from whatever they have so far.</p>
      <PlayerForm
        action={createPlayerAction}
        submitLabel="Add player"
        initial={{ matchesPlayed: "0", totalRuns: "0", totalWickets: "0" }}
      />
    </section>
  );
}
