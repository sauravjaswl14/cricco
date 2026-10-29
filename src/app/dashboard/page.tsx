import Link from "next/link";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/player-labels";
import { getSession } from "@/lib/session";

export const metadata = { title: "Players | Cricket Impact" };

export default async function PlayersPage() {
  const [session, players] = await Promise.all([
    getSession(),
    db.player.findMany({ orderBy: { name: "asc" } }),
  ]);
  const isAdmin = session?.role === "ADMIN";

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Players</h1>
          <p className="text-sm text-slate-500">{players.length} registered</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/players/new"
            className="rounded-lg bg-pitch px-4 py-2 text-sm font-medium text-white transition hover:bg-pitch-dark"
          >
            Add player
          </Link>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Base price</th>
              <th className="px-4 py-3 text-right">Matches</th>
              <th className="px-4 py-3 text-right">Runs</th>
              <th className="px-4 py-3 text-right">Wickets</th>
              {isAdmin && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No players yet.{isAdmin ? " Add the first one." : ""}
                </td>
              </tr>
            )}
            {players.map((player) => (
              <tr key={player.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{player.name}</td>
                <td className="px-4 py-3">{ROLE_LABELS[player.role]}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.basePrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.matchesPlayed}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.totalRuns}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.totalWickets}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/players/${player.id}/edit`}
                      className="font-medium text-pitch hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
