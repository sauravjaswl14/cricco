"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { PlayerFormState } from "@/app/dashboard/players/actions";
import { PLAYER_ROLES } from "@/lib/impact-score";
import { ROLE_LABELS } from "@/lib/player-labels";

type Action = (state: PlayerFormState, formData: FormData) => Promise<PlayerFormState>;

interface Props {
  action: Action;
  submitLabel: string;
  initial?: Record<string, string>;
}

const initialState: PlayerFormState = { ok: false };

export function PlayerForm({ action, submitLabel, initial = {} }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);

  // Surface every server response as a toast. A fixed id stops React strict
  // mode's double effect from stacking duplicate toasts in development.
  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message, { id: "player-form" });
      router.push("/dashboard");
    } else {
      toast.error(state.message, { id: "player-form" });
    }
  }, [state, router]);

  const values = state.values ?? initial;
  const errors = state.errors ?? {};

  return (
    // noValidate: let the server validate so a negative number reaches it and
    // produces the toast, instead of the browser silently blocking the submit.
    <form action={formAction} noValidate className="space-y-5">
      <Field label="Name" name="name" defaultValue={values.name} error={errors.name} />

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Role</span>
        <select
          name="role"
          defaultValue={values.role ?? "BATSMAN"}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-pitch/30"
        >
          {PLAYER_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        {errors.role && <span className="mt-1 block text-xs text-red-600">{errors.role}</span>}
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Base price" name="basePrice" type="number" defaultValue={values.basePrice} error={errors.basePrice} />
        <Field label="Matches played" name="matchesPlayed" type="number" defaultValue={values.matchesPlayed} error={errors.matchesPlayed} />
        <Field label="Total runs" name="totalRuns" type="number" defaultValue={values.totalRuns} error={errors.totalRuns} />
        <Field label="Total wickets" name="totalWickets" type="number" defaultValue={values.totalWickets} error={errors.totalWickets} />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-pitch px-5 py-2 text-sm font-medium text-white transition hover:bg-pitch-dark disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className={`mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-pitch/30 ${
          error ? "border-red-400" : "border-slate-300"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
