import { db } from "@/lib/db";
import { rankByImpact } from "@/lib/players";
import { ROLE_LABELS } from "@/lib/player-labels";

export const metadata = { title: "Leaderboard | Cricket Impact" };

// A React Server Component: the query and the score calculation both run on the
// server, so the browser only receives the finished table markup.
export default async function LeaderboardPage() {
  const players = await db.player.findMany();
  const ranked = rankByImpact(players);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Leaderboard</h1>
      <p className="text-sm text-slate-500">Players ranked by Cricket Impact Score.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Matches</th>
              <th className="px-4 py-3 text-right">Runs</th>
              <th className="px-4 py-3 text-right">Wickets</th>
              <th className="px-4 py-3 text-right">Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranked.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Nothing to rank yet. Add players first.
                </td>
              </tr>
            )}
            {ranked.map((player, index) => (
              <tr key={player.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-400">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{player.name}</td>
                <td className="px-4 py-3">{ROLE_LABELS[player.role]}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.matchesPlayed}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.totalRuns}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.totalWickets}</td>
                <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-pitch">
                  {player.impactScore.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
