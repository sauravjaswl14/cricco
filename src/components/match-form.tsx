"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PlayerOption {
  id: string;
  name: string;
}

interface Row {
  key: number;
  playerId: string;
  runs: string;
  wickets: string;
}

export function MatchForm({ players }: { players: PlayerOption[] }) {
  const router = useRouter();
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [winner, setWinner] = useState("");
  const [rows, setRows] = useState<Row[]>([{ key: 0, playerId: "", runs: "0", wickets: "0" }]);
  const [nextKey, setNextKey] = useState(1);
  const [pending, setPending] = useState(false);

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamA,
          teamB,
          winner: winner || undefined,
          performances: rows.map(({ playerId, runs, wickets }) => ({ playerId, runs, wickets })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstField = data.fields ? Object.values<string>(data.fields)[0] : undefined;
        toast.error(firstField ?? data.error ?? "Could not record match");
        return;
      }
      toast.success("Match recorded and player stats updated");
      router.push("/dashboard/leaderboard");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pitch/30";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">
          <span className="font-medium text-slate-700">Team A</span>
          <input value={teamA} onChange={(e) => setTeamA(e.target.value)} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">Team B</span>
          <input value={teamB} onChange={(e) => setTeamB(e.target.value)} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">Winner (optional)</span>
          <select value={winner} onChange={(e) => setWinner(e.target.value)} className={`mt-1 bg-white ${inputClass}`}>
            <option value="">No result</option>
            {teamA.trim() && <option value={teamA.trim()}>{teamA.trim()}</option>}
            {teamB.trim() && <option value={teamB.trim()}>{teamB.trim()}</option>}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Player performances</h2>
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[1fr_6rem_6rem_auto] items-end gap-3">
            <label className="text-xs text-slate-500">
              Player
              <select
                value={row.playerId}
                onChange={(e) => updateRow(row.key, { playerId: e.target.value })}
                className={`mt-1 bg-white ${inputClass}`}
              >
                <option value="">Select player</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Runs
              <input
                type="number"
                value={row.runs}
                onChange={(e) => updateRow(row.key, { runs: e.target.value })}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-slate-500">
              Wickets
              <input
                type="number"
                value={row.wickets}
                onChange={(e) => updateRow(row.key, { wickets: e.target.value })}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <button
              type="button"
              disabled={rows.length === 1}
              onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
              className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setRows((current) => [...current, { key: nextKey, playerId: "", runs: "0", wickets: "0" }]);
            setNextKey((k) => k + 1);
          }}
          className="text-sm font-medium text-pitch hover:underline"
        >
          + Add another player
        </button>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-pitch px-5 py-2 text-sm font-medium text-white transition hover:bg-pitch-dark disabled:opacity-60"
      >
        {pending ? "Recording..." : "Record match"}
      </button>
    </form>
  );
}
